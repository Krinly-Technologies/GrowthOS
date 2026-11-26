# Krinly design lab (Phases 02A–02B)

Development-only visual prototypes for choosing Krinly's creative direction. Two concepts —
**A · Quiet Intelligence** and **B · Growth Studio** — each with a working **Today** overview and
**Leads** (list, pipeline, details) inside a full application shell, plus a typography and colour
exploration. Everything uses one fictional business (Kesar Bridal Studio, Jayanagar, Bengaluru) on
a fixed clock: Wednesday 25 November 2026, 10:30 am IST.

## Run it

```bash
cp apps/design-lab/.env.example apps/design-lab/.env.local   # explicit opt-in (gitignored)
pnpm --filter @krinly/design-lab lab                           # http://localhost:3010
```

| URL                    | What                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `/`                    | Index, provisional rules, module status                                                    |
| `/a/today`, `/b/today` | Merchant overview (`?range=today\|7d\|last-month`)                                         |
| `/a/leads`, `/b/leads` | Leads (`?view=board\|list`, `?show=ready`, `?lead=…`)                                      |
| `/g/today`, `/g/leads` | **B+ Refined** — the approved direction (reference)                                        |
| `/type`                | Typefaces measured in the browser; palettes with contrast                                  |
| `/system`              | **`@krinly/ui` showcase** — every token, component and pattern, light/dark (`?theme=dark`) |

Use the prototype bar to switch A ⇄ B on the same screen, or **Reset** to restore the sample data.

## Rules this app follows

- **Never deployed.** No `build`/`start` script (so the repo's Dockerfile cannot package it), no
  Railway config, and the root layout renders nothing unless `NODE_ENV === 'development'` **and**
  `KRINLY_DESIGN_LAB=1`. It is not started by `pnpm dev`.
- **No real data or services.** No API clients, auth, Supabase or network calls. Fonts are
  self-hosted by `next/font`. All people and businesses are fictional; phone numbers are masked;
  emails use `example.com`. No pricing, testimonials, certifications or legal text.
- **Isolated styles.** Concept tokens are scoped under `[data-concept="a"|"b"]` and re-skin the reused
  `@krinly/ui` primitives without editing `packages/ui`.
- **Provisional product rules** (stages, "verified", first-source attribution, readiness signals)
  are labelled on `/` — they do not settle issues #7–#12.

## Layout

```
lib/          domain types, fixed clock, formatters, sample data (story + seeded background),
              selectors (every on-screen number), store, URL state, module registry
components/   shared behaviour: sheets, dialogs, command menu, stage menu, filters, toasts, icons
concepts/a/   Concept A shell, Today, Leads, drawer, revenue chart, CSS
concepts/b/   Concept B shell, Today, Flow, Leads, panel, CSS
concepts/g/   B+ Refined (approved reference): shell, Today, Flow, Leads, panel
app/(lab)/    prototype routes (/a/*, /b/*, /g/*, /type, /) — root layout with prototype CSS
app/(system)/ /system showcase — its own root layout that loads only @krinly/ui/styles.css
```

The two route groups are separate root layouts on purpose: the prototype CSS overrides tokens
globally, so the showcase must never load it. Navigating between them is a full page load.

Screenshots from browser validation land in `screenshots/` (gitignored), with `screenshots/index.html`
as a local A-vs-B contact sheet.

## After a direction is chosen

B+ was chosen and Phase 02B moved its tokens, components and patterns into `packages/ui`
(see `docs/frontend/design-system.md`). Keep `/g` as a visual reference until the production
screens replace it, then delete `apps/design-lab` (and its lockfile importer) entirely.
