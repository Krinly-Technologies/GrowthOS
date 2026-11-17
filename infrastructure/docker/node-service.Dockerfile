# syntax=docker/dockerfile:1
# Builds one Node.js backend service from the monorepo. Build context: repository root.
#   docker build -f infrastructure/docker/node-service.Dockerfile --build-arg SERVICE=core-api .
# SERVICE is core-api or core-worker (on Railway, set it as a service variable).

ARG NODE_IMAGE=node:22.23.5-bookworm-slim

FROM ${NODE_IMAGE} AS build
ARG SERVICE
RUN test -n "${SERVICE}" || (echo "SERVICE build arg is required" && exit 1)
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@krinly/${SERVICE}..."
RUN pnpm turbo run build --filter "@krinly/${SERVICE}"
# A self-contained copy of the service with production dependencies only.
RUN pnpm deploy --filter "@krinly/${SERVICE}" --prod /out

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
# Each service's `start` script is its production entrypoint.
CMD ["node", "--run", "start"]
