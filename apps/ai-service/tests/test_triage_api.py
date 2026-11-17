from collections.abc import Iterator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from ai_service.app import create_app
from ai_service.config import Settings
from ai_service.model import ModelError, ModelOutputError
from tests.fakes import FakeChatModel

TOKEN = "test-service-token-with-enough-entropy-0001"
AUTH = {"Authorization": f"Bearer {TOKEN}"}
URL = "/internal/v1/enquiries/triage"

BOOKING = {"intent": "booking_request", "confidence": 0.93, "summary": "Wants a table for four"}
DRAFT = {"reply": "Thanks for reaching out! We will confirm availability shortly."}


def make_client(model: FakeChatModel | None, timeout: float = 5.0) -> Iterator[TestClient]:
    settings = Settings(
        service_token=SecretStr(TOKEN), request_timeout_seconds=timeout, environment="test"
    )
    with TestClient(create_app(settings, model)) as client:
        yield client


def body(message: str = "Can I book a table for 4 tomorrow at 8pm?") -> dict[str, str]:
    return {"organization_id": str(uuid4()), "channel": "whatsapp", "message": message}


@pytest.fixture
def model() -> FakeChatModel:
    return FakeChatModel(outputs={"Classification": BOOKING, "DraftReply": DRAFT})


@pytest.fixture
def client(model: FakeChatModel) -> Iterator[TestClient]:
    yield from make_client(model)


class TestServiceAuthentication:
    def test_rejects_missing_credentials(self, client: TestClient) -> None:
        response = client.post(URL, json=body())
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "UNAUTHENTICATED"

    def test_rejects_wrong_credentials(self, client: TestClient, model: FakeChatModel) -> None:
        response = client.post(URL, json=body(), headers={"Authorization": "Bearer wrong-token"})
        assert response.status_code == 401
        assert model.calls == []

    def test_health_endpoints_are_public(self, client: TestClient) -> None:
        assert client.get("/health").json() == {"status": "ok"}
        assert client.get("/ready").json() == {"status": "ready", "model": "enabled"}


class TestTriage:
    def test_confident_enquiry_gets_a_proposed_reply(
        self, client: TestClient, model: FakeChatModel
    ) -> None:
        response = client.post(URL, json=body(), headers={**AUTH, "x-request-id": "req-12345678"})
        assert response.status_code == 200
        assert response.headers["x-request-id"] == "req-12345678"
        assert response.json() == {
            "intent": "booking_request",
            "confidence": 0.93,
            "summary": "Wants a table for four",
            "outcome": "propose_reply",
            "proposed_reply": DRAFT["reply"],
            "review_reason": None,
        }
        assert model.calls == ["Classification", "DraftReply"]

    def test_low_confidence_goes_to_a_human_without_drafting(self) -> None:
        model = FakeChatModel(outputs={"Classification": {**BOOKING, "confidence": 0.4}})
        for client in make_client(model):
            result = client.post(URL, json=body(), headers=AUTH).json()
        assert result["outcome"] == "needs_human_review"
        assert result["proposed_reply"] is None
        assert "below" in result["review_reason"]
        assert model.calls == ["Classification"]

    def test_complaints_always_go_to_a_human(self) -> None:
        complaint = {"intent": "complaint", "confidence": 0.99, "summary": "Order arrived damaged"}
        model = FakeChatModel(outputs={"Classification": complaint})
        for client in make_client(model):
            result = client.post(URL, json=body("My order arrived broken!"), headers=AUTH).json()
        assert result["outcome"] == "needs_human_review"
        assert model.calls == ["Classification"]

    @pytest.mark.parametrize(
        "payload",
        [
            {"organization_id": "not-a-uuid", "channel": "web", "message": "hi"},
            {"organization_id": str(uuid4()), "channel": "fax", "message": "hi"},
            {"organization_id": str(uuid4()), "channel": "web", "message": ""},
            {"organization_id": str(uuid4()), "channel": "web", "message": "x" * 4001},
            {**body(), "auto_send": True},
        ],
    )
    def test_rejects_invalid_requests(self, client: TestClient, payload: dict[str, object]) -> None:
        response = client.post(URL, json=payload, headers=AUTH)
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_FAILED"


class TestFailureModes:
    def test_disabled_model_returns_503(self) -> None:
        for client in make_client(None):
            assert client.get("/ready").json()["model"] == "disabled"
            response = client.post(URL, json=body(), headers=AUTH)
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "MODEL_DISABLED"

    def test_slow_model_times_out_with_504(self) -> None:
        model = FakeChatModel(outputs={"Classification": BOOKING}, delay_seconds=0.5)
        for client in make_client(model, timeout=0.05):
            response = client.post(URL, json=body(), headers=AUTH)
        assert response.status_code == 504

    @pytest.mark.parametrize(
        ("error", "code"),
        [
            (ModelOutputError("bad json"), "MODEL_INVALID_OUTPUT"),
            (ModelError("provider down"), "MODEL_UNAVAILABLE"),
        ],
    )
    def test_model_errors_map_to_502(self, error: ModelError, code: str) -> None:
        for client in make_client(FakeChatModel(outputs={"Classification": error})):
            response = client.post(URL, json=body(), headers=AUTH)
        assert response.status_code == 502
        assert response.json()["error"]["code"] == code
