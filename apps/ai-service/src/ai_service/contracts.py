"""Request/response contracts for the internal API. Published as OpenAPI for core-api."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Intent = Literal["booking_request", "price_enquiry", "support", "complaint", "spam", "other"]
Channel = Literal["whatsapp", "email", "web", "phone"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class TriageRequest(StrictModel):
    organization_id: UUID
    channel: Channel
    message: str = Field(min_length=1, max_length=4000)


class TriageResult(StrictModel):
    """A proposal only. core-api decides whether and how anything is acted on."""

    intent: Intent
    confidence: float = Field(ge=0, le=1)
    summary: str
    outcome: Literal["propose_reply", "needs_human_review"]
    proposed_reply: str | None
    review_reason: str | None


class ErrorDetail(StrictModel):
    code: str
    message: str
    requestId: str  # noqa: N815 - matches the core-api error contract


class ErrorResponse(StrictModel):
    error: ErrorDetail
