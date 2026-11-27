# Krinly GrowthOS — instructions for agents

Read `docs/architecture/decisions.md` before changing data access, auth or service boundaries.

## Non-negotiables

- Schema changes are SQL migrations in `supabase/migrations`. Never `prisma db push` or
  `prisma migrate`. Every new table needs RLS enabled, policies for `krinly_app`, explicit grants,
  and a revoke from `anon, authenticated, service_role`. Update `schema.prisma` to match.
- core-api queries run through `PrismaService.asUser(...)` so RLS applies. Never connect the API
  as `postgres` or any role with `BYPASSRLS`.
- Organization routes use `@RequirePermission('<permission>')`; non-members get 404.
- The runtime role cannot write memberships directly. Privileged multi-table writes belong in a
  narrow `SECURITY DEFINER` function in the `app` schema that derives the user from context.
- AI service output is a proposal. It must never authorize or perform a business mutation.
- Never expose the Supabase secret key to a browser or `NEXT_PUBLIC_*` variable.
- Do not apply migrations to hosted databases or deploy without explicit approval.

## Conventions

- Validate inputs with Zod (`@Body({ schema })`) and return errors through `ApiException`, which
  produces the shared `{ error: { code, message, requestId } }` contract.
- After changing an endpoint or AI contract, run `pnpm contracts:generate` and commit the output.
- Tests exercise behaviour against real Postgres/Auth/Redis (see README "Checks"); do not mock
  the database in integration tests.
- Pin exact versions; pnpm's release-age policy and uv's `exclude-newer` must pass without
  exceptions.
- Prefer framework features over new abstractions; add shared packages only with two consumers.
- Reuse before building: prefer an existing in-repo implementation, then an already-installed
  dependency, then a maintained permissively-licensed library (MIT/Apache-2.0/BSD; avoid AGPL or
  restrictive licenses without explicit approval), then adapting an existing implementation, and
  only then a custom build — for calendars, charting, drag-and-drop, QR/PDF, rich text, data
  tables, forms, dates, workflow canvases and accessibility primitives. Style/compose libraries to
  match the B+ design system rather than shipping their default look. Note significant dependency
  choices briefly in the relevant handoff doc or PR description.

## Commands

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` for quick checks;
`pnpm test:integration` with Supabase and Redis running; `pnpm py:lint py:typecheck py:test`.
