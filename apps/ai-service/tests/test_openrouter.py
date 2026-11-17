"""OpenRouter adapter behaviour against a local transport (no network)."""

import json

import httpx
import pytest

from ai_service.model import ModelError, ModelOutputError, ModelTimeoutError, OpenRouterChatModel
from ai_service.triage import Classification


def adapter(handler: httpx.MockTransport) -> OpenRouterChatModel:
    client = httpx.AsyncClient(base_url="https://openrouter.test/api/v1", transport=handler)
    return OpenRouterChatModel(client=client, api_key="sk-or-test", model="vendor/model-x")


def completion(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


async def test_sends_strict_schema_request_and_parses_output() -> None:
    seen: list[httpx.Request] = []

    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return completion('{"intent": "price_enquiry", "confidence": 0.8, "summary": "Asks price"}')

    result = await adapter(httpx.MockTransport(handle)).generate(
        system="sys", user="usr", output=Classification
    )
    assert result == Classification(intent="price_enquiry", confidence=0.8, summary="Asks price")

    request = seen[0]
    assert request.url.path == "/api/v1/chat/completions"
    assert request.headers["authorization"] == "Bearer sk-or-test"
    payload = json.loads(request.content)
    assert payload["model"] == "vendor/model-x"
    assert payload["response_format"]["json_schema"]["strict"] is True
    assert payload["response_format"]["json_schema"]["schema"]["additionalProperties"] is False


@pytest.mark.parametrize(
    ("response", "error"),
    [
        (httpx.Response(429, json={"error": "rate limited"}), ModelError),
        (completion("not json"), ModelOutputError),
        (completion('{"intent": "unknown", "confidence": 2, "summary": ""}'), ModelOutputError),
        (httpx.Response(200, json={"choices": []}), ModelOutputError),
    ],
)
async def test_maps_provider_failures(response: httpx.Response, error: type[ModelError]) -> None:
    model = adapter(httpx.MockTransport(lambda _: response))
    with pytest.raises(error):
        await model.generate(system="s", user="u", output=Classification)


async def test_maps_timeouts() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("slow", request=request)

    with pytest.raises(ModelTimeoutError):
        await adapter(httpx.MockTransport(handle)).generate(
            system="s", user="u", output=Classification
        )
