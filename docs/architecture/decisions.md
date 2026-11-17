# Architecture decisions

Each entry records a decision that is not obvious from the code, and why it was made.

## 1. SQL migrations are the schema source of truth; Prisma is the typed client

`supabase/migrations/*.sql` owns the schema, applied by the Supabase CLI. RLS policies, grants,
check constraints, partial indexes, `SECURITY DEFINER` functions and the trigger on `auth.users`
cannot be expressed in Prisma's schema language, and `prisma migrate` cannot diff a schema with a
foreign key into Supabase's `auth` schema.

`packages/database/prisma/schema.prisma` is maintained by hand to match. Drift is caught by
`schema-drift.integration.test.ts`, which compares every mapped table's columns and nullability
with the migrated database in both directions. `prisma db push` and `prisma migrate` are not used.

## 2. Tenant isolation is enforced twice: NestJS guards and RLS as a non-owner role

- core-api connects as `krinly_app`: `NOBYPASSRLS`, not a superuser, owns no tables. Supabase's
  recommended Prisma user has `BYPASSRLS`, which would silently disable every policy, so it is
  deliberately not used.
- Every request runs in a transaction that first sets `app.user_id` with
  `set_config(..., true)` (transaction-local). Policies read it via `app.current_user_id()`.
  Because the setting dies with the transaction, the pattern is safe with Supabase's
  transaction-mode pooler (port 6543).
- `OrgAccessGuard` checks membership and permission before handlers run, and returns 404 to
  non-members so organization IDs are not disclosed.
- The database layer limits the blast radius of an application bug (a missing `where` clause);
  it does not defend against a compromised API process, which can set any `app.user_id`.

Both layers are tested independently: `packages/database/src/rls.integration.test.ts` connects
as `krinly_app` directly; `apps/core-api/test` exercises the HTTP API. A deliberately broken guard
was confirmed to be caught by the API tests.

## 3. Bootstrap writes go through narrow `SECURITY DEFINER` functions

Creating an organization and accepting an invitation happen before the caller is a member, so
RLS cannot authorize them. `app.create_organization` and `app.accept_invitation` take only the
data they need, derive the user from the transaction context, and write the organization or
membership, the audit entry and the outbox event atomically. The runtime role has no direct
`INSERT`/`UPDATE` privilege on memberships, so the only way to gain a membership is through these
functions. Invitation replay is prevented by a conditional `UPDATE ... WHERE status = 'pending'`,
which only one concurrent transaction can win (tested).

## 4. A single role model, platform-defined

`organization_memberships.role_id` is the only role reference; there is no free-text role column.
Roles (`owner`, `admin`, `member`) and permissions are platform-defined reference data. A role can
be granted only if it is `is_assignable` and all its permissions are held by the granter
(`app.can_grant_role`); the same function backs both the API's 403 and the RLS insert policy.
Per-organization custom roles are not supported until there is a requirement for them.

## 5. Supabase Auth tokens are verified with JWKS (asymmetric keys only)

core-api verifies `ES256`/`RS256` signatures against the project's JWKS, plus issuer, audience
(`authenticated`), expiry, and that the subject is a UUID and not anonymous. Symmetric `HS256`
tokens are rejected. The local stack signs with an ES256 key (`supabase/signing_keys.json`,
generated per developer, gitignored) so local and hosted behave the same.

## 6. Nest-native Standard Schema validation with Zod 4

NestJS 12 validates `@Body({ schema })`/`@Param({ schema })` with any Standard Schema, and
`@nestjs/swagger` 12 converts Standard JSON Schema to OpenAPI. Zod 4 implements both, so request
validation and OpenAPI generation use framework features with no adapter library (`nestjs-zod`
does not support NestJS 12).

## 7. Generated contracts, committed and checked

Both services publish OpenAPI (`packages/contracts/openapi/*.json`); TypeScript types are
generated from them. Web apps call core-api through a typed `openapi-fetch` client. core-api's
runtime Zod schema for the AI response is annotated with the generated type, so a Python contract
change fails TypeScript compilation. CI regenerates contracts and fails on any diff.

## 8. AI output is a proposal, never an authorization

The AI service has no database access and no credentials beyond its model key. Its triage graph
classifies a message and only drafts a reply when the intent is safe and confidence is above a
threshold; complaints and spam always go to a human. core-api validates the response shape and
returns it as a proposal; nothing is sent or stored. The graph runs to completion per request, so
it has no checkpointer; an interruptible workflow must add a durable Postgres checkpointer first.
Live OpenRouter calls are disabled unless an API key and model are configured (503 otherwise).

## 9. Transactional outbox with idempotent dispatch

State changes write an `outbox_events` row in the same transaction. core-worker (as
`krinly_worker`, which can only read and mark outbox rows) locks pending rows with
`FOR UPDATE SKIP LOCKED`, enqueues them to the single `domain-events` BullMQ queue with
`jobId = event id`, and marks them dispatched. If Redis is unavailable the row stays pending with
exponential backoff. Re-dispatch after a crash is deduplicated by the job ID. Redis is never a
source of truth. Phase 1 has no downstream consumers, so the processor validates and logs events;
modules subscribe there when they exist.

## 10. Deployment shape

Six independently deployable Railway services built from three Dockerfiles (Node service, Next.js
app, Python service), each with a schema-validated `infrastructure/railway/*.railway.json`
(watch paths, health checks, restart policy). Supabase hosts Postgres and Auth; Railway hosts
compute and Redis. The AI service and worker get no public domain. Regions are not hard-coded.
Migrations are applied deliberately with the Supabase CLI, never automatically on deploy.

## 11. Dependency supply-chain policy

pnpm 12 enforces a minimum release age and an explicit allow-list for install scripts
(`pnpm-workspace.yaml`). Python uses uv's `exclude-newer` cutoff for the same effect. Versions
were chosen to satisfy these policies rather than adding exceptions.
