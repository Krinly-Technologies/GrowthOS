# syntax=docker/dockerfile:1
# Builds one Next.js app (standalone output) from the monorepo. Build context: repository root.
#   docker build -f infrastructure/docker/next-app.Dockerfile --build-arg APP=merchant-web \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so they are build
# arguments. They are public by design; never pass secrets this way.

ARG NODE_IMAGE=node:22.23.5-bookworm-slim

FROM ${NODE_IMAGE} AS build
ARG APP
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CORE_API_URL
ARG NEXT_PUBLIC_MERCHANT_APP_URL
RUN test -n "${APP}" || (echo "APP build arg is required" && exit 1)
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@krinly/${APP}..."
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter "@krinly/${APP}"

FROM ${NODE_IMAGE} AS runtime
ARG APP
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=:: APP_DIR=apps/${APP}
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/${APP}/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
USER node
# The standalone server reads PORT (injected by Railway) and HOSTNAME.
CMD ["sh", "-c", "exec node \"$APP_DIR/server.js\""]
