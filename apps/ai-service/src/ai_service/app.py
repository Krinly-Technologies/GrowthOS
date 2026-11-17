import asyncio
import hmac
import logging
import re
import uuid
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import AsyncExitStack, asynccontextmanager
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from langchain_core.runnables import RunnableConfig
from starlette.exceptions import HTTPException as StarletteHTTPException

from ai_service.config import Settings
from ai_service.contracts import ErrorResponse, TriageRequest, TriageResult
from ai_service.logging_setup import configure_logging, request_id_var
from ai_service.model import (
    ChatModel,
    ModelError,
    ModelOutputError,
    ModelTimeoutError,
    OpenRouterChatModel,
)
from ai_service.triage import build_triage_graph, run_triage

logger = logging.getLogger("ai_service")

REQUEST_ID_HEADER = "x-request-id"
INCOMING_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,128}$")

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    status: {"model": ErrorResponse} for status in (400, 401, 502, 503, 504)
}


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def _error(status: int, code: str, message: str) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "requestId": request_id_var.get() or ""}}
    return JSONResponse(status_code=status, content=body)


def _langfuse_config(settings: Settings) -> RunnableConfig | None:
    if not settings.langfuse_enabled:
        return None
    # Imported lazily: Langfuse is an optional extra. It reads LANGFUSE_* from the environment.
    from langfuse.langchain import CallbackHandler

    return {"callbacks": [CallbackHandler()]}


async def _live_model(settings: Settings, stack: AsyncExitStack) -> ChatModel | None:
    """OpenRouter adapter when credentials and a model are configured; otherwise None."""
    if settings.openrouter_api_key is None or settings.triage_model is None:
        return None
    client = await stack.enter_async_context(
        httpx.AsyncClient(
            base_url=settings.openrouter_base_url, timeout=settings.request_timeout_seconds
        )
    )
    return OpenRouterChatModel(
        client=client,
        api_key=settings.openrouter_api_key.get_secret_value(),
        model=settings.triage_model,
    )


def create_app(settings: Settings, model: ChatModel | None = None) -> FastAPI:
    """Builds the app. Tests inject `model`; otherwise OpenRouter is used when configured."""
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        async with AsyncExitStack() as stack:
            active_model = model or await _live_model(settings, stack)
            app.state.graph = (
                build_triage_graph(active_model, settings.auto_reply_min_confidence)
                if active_model
                else None
            )
            yield

    app = FastAPI(title="Krinly AI Service", version="1", lifespan=lifespan)

    @app.middleware("http")
    async def correlate(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        incoming = request.headers.get(REQUEST_ID_HEADER, "")
        request_id = incoming if INCOMING_REQUEST_ID.match(incoming) else str(uuid.uuid4())
        token = request_id_var.set(request_id)
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response

    @app.exception_handler(ApiError)
    async def api_error(_: Request, error: ApiError) -> JSONResponse:
        return _error(error.status, error.code, error.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        return _error(400, "VALIDATION_FAILED", f"{len(error.errors())} invalid field(s)")

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, error: StarletteHTTPException) -> JSONResponse:
        return _error(error.status_code, "HTTP_ERROR", str(error.detail))

    bearer = HTTPBearer(auto_error=False)

    def require_service_token(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    ) -> None:
        expected = settings.service_token.get_secret_value().encode()
        if credentials is None or not hmac.compare_digest(
            credentials.credentials.encode(), expected
        ):
            raise ApiError(401, "UNAUTHENTICATED", "Invalid service credentials")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/ready")
    async def ready(request: Request) -> dict[str, str]:
        return {"status": "ready", "model": "enabled" if request.app.state.graph else "disabled"}

    internal = APIRouter(prefix="/internal/v1", dependencies=[Depends(require_service_token)])

    @internal.post("/enquiries/triage", responses=ERROR_RESPONSES)
    async def triage(body: TriageRequest, request: Request) -> TriageResult:
        graph = request.app.state.graph
        if graph is None:
            raise ApiError(503, "MODEL_DISABLED", "No language model is configured")
        try:
            async with asyncio.timeout(settings.request_timeout_seconds):
                return await run_triage(
                    graph, body, settings.auto_reply_min_confidence, _langfuse_config(settings)
                )
        except (TimeoutError, ModelTimeoutError) as error:
            raise ApiError(504, "MODEL_TIMEOUT", "The model did not respond in time") from error
        except ModelOutputError as error:
            logger.warning("Model returned invalid structured output: %s", error)
            raise ApiError(
                502, "MODEL_INVALID_OUTPUT", "The model returned invalid output"
            ) from error
        except ModelError as error:
            logger.warning("Model provider error: %s", error)
            raise ApiError(502, "MODEL_UNAVAILABLE", "The model provider failed") from error

    app.include_router(internal)
    return app
