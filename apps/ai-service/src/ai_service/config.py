from functools import cached_property
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed configuration from environment variables. Invalid configuration fails at startup."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", frozen=True)

    environment: Literal["development", "test", "staging", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # Shared secret that core-api presents on every internal call.
    service_token: SecretStr = Field(min_length=32)

    # Live model access. Without both values the triage endpoint returns 503; nothing is faked.
    openrouter_api_key: SecretStr | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    triage_model: str | None = None

    request_timeout_seconds: float = Field(default=20.0, gt=0, le=120)
    # Below this classification confidence, enquiries are routed to a human.
    auto_reply_min_confidence: float = Field(default=0.75, ge=0, le=1)

    sentry_dsn: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: SecretStr | None = None

    @model_validator(mode="after")
    def _model_requires_key(self) -> "Settings":
        if self.triage_model and not self.openrouter_api_key:
            raise ValueError("TRIAGE_MODEL is set but OPENROUTER_API_KEY is missing")
        return self

    @cached_property
    def live_model_enabled(self) -> bool:
        return bool(self.openrouter_api_key and self.triage_model)

    @cached_property
    def langfuse_enabled(self) -> bool:
        return bool(self.langfuse_public_key and self.langfuse_secret_key)
