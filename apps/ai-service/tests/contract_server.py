"""Serves the real application with a deterministic fake model for cross-service contract tests.

Usage: SERVICE_TOKEN=... python -m tests.contract_server <port>
Test-only: lives under tests/ and is never part of the deployed service.
"""

import os
import sys

import uvicorn
from pydantic import SecretStr

from ai_service.app import create_app
from ai_service.config import Settings
from tests.fakes import FakeChatModel

if __name__ == "__main__":
    model = FakeChatModel(
        outputs={
            "Classification": {
                "intent": "booking_request",
                "confidence": 0.9,
                "summary": "Customer wants to book a table",
            },
            "DraftReply": {"reply": "Thank you! We will confirm your booking shortly."},
        }
    )
    settings = Settings(
        service_token=SecretStr(os.environ["SERVICE_TOKEN"]),
        environment="test",
        log_level="WARNING",
    )
    uvicorn.run(create_app(settings, model), host="127.0.0.1", port=int(sys.argv[1]))
