## Linked issue

Closes #

## Summary

<!-- What changed and why. -->

## Scope and exclusions

<!-- What this PR deliberately does NOT do, and why (e.g. follow-up ticket, out of scope). -->

## Testing performed

<!-- Commands run and their result. See README "Checks" for the full list. -->

- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
- [ ] `pnpm test:integration` (Supabase + Redis running), if this PR touches the database, RLS, or
      cross-service contracts
- [ ] `pnpm py:lint py:typecheck py:test`, if this PR touches `apps/ai-service`

## Security and tenant-isolation impact

<!-- Does this change touch auth, RLS, org membership/roles, the AI proposal boundary, or secrets?
     If none of the above apply, say so explicitly rather than leaving this blank. -->

## Database migration impact

<!-- New/changed tables or columns, RLS policies, grants, and whether `schema.prisma` was updated
     to match. Write "None" if this PR has no migration. -->

## Screenshots

<!-- Required for UI changes. Delete this section if not applicable. -->

## Reviewer checklist

- [ ] Changes match the linked issue's acceptance criteria
- [ ] New/changed tables have RLS enabled, policies, explicit grants, and a revoke from
      `anon, authenticated, service_role` (see `CLAUDE.md`)
- [ ] No direct `postgres`/`BYPASSRLS` connections introduced in core-api
- [ ] AI service output is still treated as a proposal, not a mutation
- [ ] No secrets, service-role keys, or `NEXT_PUBLIC_*` leaks introduced
- [ ] `pnpm contracts:generate` was run and committed if an endpoint or AI contract changed
- [ ] Tests exercise real Postgres/Auth/Redis where applicable, not mocks
- [ ] All conversations on this PR are resolved
