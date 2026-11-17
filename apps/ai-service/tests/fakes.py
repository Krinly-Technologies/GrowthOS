"""Deterministic test double for the ChatModel protocol. Used only by tests."""

import asyncio
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import TypeVar

from pydantic import BaseModel

from ai_service.model import ModelError

TModel = TypeVar("TModel", bound=BaseModel)


@dataclass
class FakeChatModel:
    """Returns scripted outputs per output type and records every call."""

    outputs: Mapping[str, Mapping[str, object] | ModelError] = field(default_factory=dict)
    delay_seconds: float = 0
    calls: list[str] = field(default_factory=list)

    async def generate(self, *, system: str, user: str, output: type[TModel]) -> TModel:
        self.calls.append(output.__name__)
        if self.delay_seconds:
            await asyncio.sleep(self.delay_seconds)
        scripted = self.outputs[output.__name__]
        if isinstance(scripted, ModelError):
            raise scripted
        return output.model_validate(scripted)
