# syntax=docker/dockerfile:1
# Build context: apps/ai-service (the service is independent of the Node.js workspace).
FROM python:3.13.18-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.9.15 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_NO_DEV=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Dependencies first, for layer caching.
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-install-project --extra langfuse
COPY src ./src
RUN uv sync --locked --extra langfuse

RUN useradd --system --uid 10001 app
USER app

# Railway injects PORT. '::' listens on IPv4 and IPv6 for private networking.
CMD ["sh", "-c", "exec /app/.venv/bin/uvicorn ai_service.main:app --host :: --port ${PORT:-8000} --proxy-headers --timeout-graceful-shutdown 20"]
