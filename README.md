# Krinly GrowthOS

India-first, multi-tenant B2B platform. This repository contains the Phase 1 engineering
foundation and the first vertical slice: **identity and multi-tenancy** (sign-up, email
verification, organizations, roles, invitations, operator access, audit, outbox).

Design rationale: [docs/architecture/decisions.md](docs/architecture/decisions.md).

## Layout

| Path                 | What it is                                                              |
| -------------------- | ----------------------------------------------------------------------- |
| `apps/core-api`      | NestJS 12 + Fastify. Authoritative business API (`/v1`).                |
| `apps/core-worker`   | Outbox dispatcher and BullMQ `domain-events` worker.                    |
| `apps/ai-service`    | FastAPI + LangGraph enquiry triage (internal only). Managed by uv.      |
| `apps/merchant-web`  | Next.js 16 merchant app: auth, onboarding, workspace, team.             |
| `apps/admin-web`     | Next.js 16 operator console (access verified by core-api).              |
| `apps/landing-web`   | Next.js 16 public landing page.                                         |
| `packages/database`  | Prisma client + `asUser` RLS transaction helper.                        |
| `packages/contracts` | OpenAPI documents and generated TypeScript types/clients.               |
| `packages/ui`        | shadcn/ui components shared by the web apps.                            |
| `packages/web-auth`  | Supabase SSR session handling shared by merchant-web and admin-web.     |
| `packages/config`    | Shared tsconfig and ESLint configuration.                               |
| `supabase/`          | SQL migrations (schema source of truth), local config, email templates. |
| `infrastructure/`    | Dockerfiles and Railway service configuration.                          |

## Prerequisites

Node.js 22 LTS, pnpm 12 (`corepack enable`), uv, Docker.

## Local development

```bash
pnpm install
uv sync --directory apps/ai-service --all-extras

# One-time: an ES256 key so local Auth signs tokens like hosted Supabase.
echo '[]' > supabase/signing_keys.json
pnpm exec supabase gen signing-key --algorithm ES256 --append

# Supabase (Postgres, Auth, Mailpit) — applies migrations and supabase/seed.sql.
pnpm exec supabase start -x studio,imgproxy,vector,logflare,supavisor,postgres-meta,storage-api,realtime,edge-runtime
docker compose up -d          # Redis

# Environment: copy each app's .env.example to .env (merchant/admin: .env.local).
# The publishable key comes from `pnpm exec supabase status`.

pnpm dev                      # all Node apps
uv run --directory apps/ai-service uvicorn ai_service.main:app --reload --port 8000
```

| Service      | URL                                     |
| ------------ | --------------------------------------- |
| merchant-web | http://localhost:3000                   |
| admin-web    | http://localhost:3001                   |
| landing-web  | http://localhost:3002                   |
| core-api     | http://localhost:4000 (docs at `/docs`) |
| ai-service   | http://localhost:8000                   |
| Mailpit      | http://127.0.0.1:54324 (local emails)   |

Reset the local database (re-applies migrations and seed): `pnpm exec supabase db reset`.
To make a local user a Krinly operator: `update profiles set is_platform_operator = true where email = '...';`
(only the owner role can change this column).

## Checks

| Command                                     | Runs                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm format:check`                         | Prettier                                                                                         |
| `pnpm lint`                                 | ESLint (strict type-checked)                                                                     |
| `pnpm typecheck`                            | TypeScript                                                                                       |
| `pnpm test`                                 | Unit tests                                                                                       |
| `pnpm test:integration`                     | RLS, schema drift, API, worker and cross-service contract tests. Needs Supabase + Redis running. |
| `pnpm py:lint` / `py:typecheck` / `py:test` | Ruff, mypy (strict), pytest                                                                      |
| `pnpm build`                                | All builds                                                                                       |
| `pnpm contracts:generate`                   | Regenerate OpenAPI documents and TypeScript types (commit the result)                            |

CI (`.github/workflows/ci.yml`) runs all of the above plus dependency audits and container builds.

## Database changes

1. `pnpm exec supabase migration new <name>` and write SQL (include RLS and grants for new tables).
2. `pnpm exec supabase db reset` to apply locally.
3. Update `packages/database/prisma/schema.prisma`; the drift test fails until it matches.
4. Apply to hosted environments deliberately: `pnpm exec supabase db push --linked` (staging first).

## Hosted Supabase setup (per environment)

1. Apply migrations (above).
2. Give the runtime roles login passwords from your secret manager (never in a migration):
   `alter role krinly_app with login password '...';` and the same for `krinly_worker`.
3. core-api `DATABASE_URL`: transaction pooler, user `krinly_app.<project-ref>`, port 6543.
   core-worker `WORKER_DATABASE_URL`: same with `krinly_worker`.
4. Auth: enable email confirmations, set the Site URL to merchant-web, add merchant-web and
   admin-web to redirect URLs, switch to asymmetric (ES256) JWT signing keys, and paste the
   templates from `supabase/templates/` into Email Templates.
5. The Supabase secret/service-role key is not used by any app.

## Deployment (Railway)

Create one Railway service per app, each pointing at its config file:

| Service      | Config file                                                                         | Required build/runtime variables                  |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| core-api     | `infrastructure/railway/core-api.railway.json`                                      | `SERVICE=core-api`, see `.env.example`            |
| core-worker  | `infrastructure/railway/core-worker.railway.json`                                   | `SERVICE=core-worker`                             |
| ai-service   | `infrastructure/railway/ai-service.railway.json` (root directory `apps/ai-service`) | see `.env.example`                                |
| merchant-web | `infrastructure/railway/merchant-web.railway.json`                                  | `APP=merchant-web`, `NEXT_PUBLIC_*`               |
| admin-web    | `infrastructure/railway/admin-web.railway.json`                                     | `APP=admin-web`, `NEXT_PUBLIC_*`                  |
| landing-web  | `infrastructure/railway/landing-web.railway.json`                                   | `APP=landing-web`, `NEXT_PUBLIC_MERCHANT_APP_URL` |

Add Railway Redis (with a volume) and set `REDIS_URL` on core-worker from it. Give public domains
only to the three web apps and core-api; reach ai-service over private networking
(`http://ai-service.railway.internal:<port>`). Use separate Railway environments (staging,
production) with separate Supabase projects and secrets. Choose regions per environment; Supabase
and Railway regions are not assumed to match.

## Not yet implemented

- Email delivery of invitations (the inviter receives a single-use link to share).
- Endpoints to grant/revoke operator access (schema and RLS exist; admin-web shows active grants).
- Role changes and member removal.
- Sentry in the Next.js apps (core-api and ai-service initialise it when `SENTRY_DSN` is set);
  a dedicated OTLP exporter (Sentry's SDK provides OpenTelemetry-based tracing today).
