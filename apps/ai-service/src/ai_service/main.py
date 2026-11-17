"""ASGI entrypoint: `uvicorn ai_service.main:app`."""

import sentry_sdk

from ai_service.app import create_app
from ai_service.config import Settings

settings = Settings()
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn, environment=settings.environment, send_default_pii=False
    )

app = create_app(settings)
