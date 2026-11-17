"""Model gateway. The graph depends on the ChatModel protocol; OpenRouter is the live adapter."""

from typing import Protocol

import httpx
from pydantic import BaseModel, ValidationError


class ModelError(Exception):
    """The model provider failed or was unreachable."""


class ModelTimeoutError(ModelError):
    """The model provider did not answer in time."""


class ModelOutputError(ModelError):
    """The model answered, but not with output matching the requested schema."""


class ChatModel(Protocol):
    async def generate[T: BaseModel](self, *, system: str, user: str, output: type[T]) -> T:
        """Returns the model's answer parsed and validated as `output`."""
        ...


class OpenRouterChatModel:
    """Calls OpenRouter's OpenAI-compatible chat completions API with strict JSON-schema output."""

    def __init__(self, *, client: httpx.AsyncClient, api_key: str, model: str) -> None:
        self._client = client
        self._api_key = api_key
        self._model = model

    async def generate[T: BaseModel](self, *, system: str, user: str, output: type[T]) -> T:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": output.__name__,
                    "strict": True,
                    "schema": output.model_json_schema(),
                },
            },
        }
        try:
            response = await self._client.post(
                "/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {self._api_key}"},
            )
        except httpx.TimeoutException as error:
            raise ModelTimeoutError("OpenRouter request timed out") from error
        except httpx.HTTPError as error:
            raise ModelError("OpenRouter request failed") from error

        if response.status_code != httpx.codes.OK:
            raise ModelError(f"OpenRouter returned HTTP {response.status_code}")
        try:
            content = response.json()["choices"][0]["message"]["content"]
            return output.model_validate_json(content)
        except (KeyError, IndexError, TypeError, ValueError, ValidationError) as error:
            raise ModelOutputError(f"Model output did not match {output.__name__}") from error
