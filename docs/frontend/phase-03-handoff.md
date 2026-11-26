# Phase 03 handoff — from design-system extraction (Phase 02B)

## Status

Phase 02A (A/B prototypes) and Phase 02B (extracting the approved **B+ "Refined Growth Studio"**
direction into `@krinly/ui`) are done and approved. **Phase 03 (building the production screens
against `@krinly/ui`) has not started** — do not begin it from this doc; this is context for
whoever picks it up next.

`@krinly/ui` is the authoritative design system: tokens, components and patterns. Read
`docs/frontend/design-system.md` first — it has the full token/component/pattern reference and the
validation checklist. This doc only covers what that one doesn't: implementation status, unresolved
issues, and constraints.

## Relevant files

- `packages/ui/src/components/` — generic primitives (button, input, field, tabs, badge, card,
  overlay, toast, avatar, icon, table, label, alert, feedback).
- `packages/ui/src/patterns/` — Krinly-specific patterns (money, thread, signals, metric,
  card-stack, comparison-chart, flow-chart, pipeline, timeline, filter-toolbar).
- `packages/ui/src/lib/format.ts`, `lib/utils.ts` — formatters and class-name helpers.
- `packages/ui/src/styles.css` — tokens, Tailwind 4 setup, base styles, motion.
- `apps/design-lab/app/(system)/system/` — the `/system` showcase exercising every token/component.
- `apps/design-lab/concepts/g/` — the approved B+ reference screens (Today, Leads, Flow, shell) —
  **use these as the implementation reference for production screens**, not `concepts/a`/`concepts/b`
  (those are the superseded A/B prototypes).
- `apps/design-lab/scripts/validate/` — reusable browser validation scripts (screenshots, console
  errors, overflow, axe-core, scripted keyboard/focus checks). See its README for usage; reuse
  these against the production implementation rather than writing new ones.
- `docs/frontend/design-system.md` — token/component/pattern reference and validation checklist.

## Unresolved issues / provisional rules

- Stages, "verified" status, first-source attribution, and readiness signals are **provisional**
  product rules (tracked in GitHub issues #7–#12) — they're labelled as such on the design lab's
  `/` index and in `design-system.md`. Confirm the real rules before building screens that depend
  on them; don't treat the prototype's version as final.
- No app has shipped dark mode yet. `@krinly/ui` supports it (`.dark` on `<html>`), but turning it
  on is a product decision for later, not something to default into Phase 03.
- `apps/design-lab` itself must stay until the production screens have been visually validated
  against it (see `apps/design-lab/README.md` → "After a direction is chosen"). Don't delete it as
  part of Phase 03 cleanup until that validation has happened.

## Architectural constraints (from `CLAUDE.md`, unchanged by this work)

- `@krinly/ui` is consumed as source via `transpilePackages`, not published — Phase 03 apps add it
  as a workspace dependency, not an npm install.
- Patterns take business data as props; no sample/business data, stage lists, scoring, or
  per-merchant copy belongs in `packages/ui`.
- AI service output is a proposal only (`Apply`/`Dismiss`); it must never mutate data directly —
  this applies to any AI-surfaced UI built on these patterns in Phase 03.
- Schema, auth, and service-boundary rules in `CLAUDE.md` and
  `docs/architecture/decisions.md` are unaffected by this frontend work and still apply once
  Phase 03 wires these screens to real data.
