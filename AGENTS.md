# Agent rules

This file is for AI coding agents (Claude Code, Codex, Antigravity, and similar). It covers
workflow and safety rules only. For engineering rules — schema changes, RLS, service boundaries,
AI output constraints — `CLAUDE.md` is authoritative and takes precedence over anything here.

## Rules

- Never push directly to `main`. Work on `feature/<issue>-...`, `fix/<issue>-...`, or
  `chore/<issue>-...` branches and open a pull request (see `CONTRIBUTING.md`).
- Never deploy, or apply migrations to hosted/production databases, without explicit human
  authorization for that specific action.
- Never expose credentials, the Supabase secret key, or any `NEXT_PUBLIC_*` secret.
- Never bypass CI, weaken tests, or skip git hooks (`--no-verify`) to get a change to pass.
- No speculative abstractions or placeholder/half-finished functionality — see CLAUDE.md's
  guidance on avoiding premature abstraction and unused scaffolding.
- Every AI-generated change needs a human engineer as its owner and reviewer before merge. An
  agent opening a PR does not substitute for that review.
