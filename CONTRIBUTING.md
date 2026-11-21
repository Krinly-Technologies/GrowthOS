# Contributing

This covers the Git workflow and PR process. For engineering rules (schema changes, RLS, AI
service boundaries, etc.), `CLAUDE.md` is authoritative — read it first.

## Branches

`main` is the protected integration branch. There is no permanent `develop` branch.

Branch names: `feature/<issue-number>-<short-description>`, `fix/<issue-number>-<short-description>`,
`chore/<issue-number>-<short-description>`. Example: `fix/1-outbox-cold-start`.

## Workflow

1. Open or claim a GitHub issue before starting work.
2. Branch off `main` using the naming convention above.
3. Run the checks locally before pushing (README "Checks" section):
   `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`, plus
   `pnpm test:integration` and `pnpm py:lint py:typecheck py:test` when relevant.
4. Open a pull request against `main` using the PR template. Link the issue.
5. All CI checks must pass and review conversations must be resolved before merge.
6. Merge with **squash merge** once approved. Delete the branch after merge.

## What CI enforces

See `.github/workflows/ci.yml` for the authoritative job list. As of this writing: TypeScript
(format, lint, types, unit tests, build, contracts drift), Python (ruff, mypy, pytest, audit),
integration tests against real Postgres/Auth/Redis, a secret scan, and container image builds.

## Reviews

One human approval is required once the team has reviewer access configured. Do not approve your
own PR. Do not merge with unresolved review conversations.

## Database changes

Schema changes are SQL migrations in `supabase/migrations`, never `prisma db push`/`prisma migrate`.
See `CLAUDE.md` and `docs/architecture/decisions.md` before touching data access, auth, or service
boundaries.

## AI-assisted contributions

If an AI coding tool (Claude Code, Codex, Antigravity, etc.) authored part of a change, the human
opening the PR owns it: they are responsible for review, testing, and the consequences of merging
it. See `AGENTS.md` for the rules AI agents follow in this repo.
