# Phase 04 handoff — Today dashboard and customer acquisition

## Status

Today and Acquisition are **built, interactive and validated**, and they run in a
**development-only preview** at `/preview` inside merchant-web. They are not in merchant
navigation, because core-api has no endpoint behind them.

Read `design-system.md` first for tokens, components and patterns. This doc covers what that one
does not: where the screens live, what is real, what is simulated, and what has to exist before
they can ship.

## Why a preview and not a workspace route

`packages/contracts/openapi/core-api.json` exposes organizations, members, invitations and
enquiry triage. There is no revenue, payment-verification, journey, source, form or tracking
endpoint, and first-source attribution plus what counts as "verified" are still open product
questions (issues #7–#12). Every figure on these screens would therefore be invented.

So:

- The **models are provisional** and deliberately live outside `@krinly/contracts`
  (`apps/merchant-web/lib/preview/`). Generated production contracts stay the only statement of
  what the API supports.
- The **screens are production components** (`apps/merchant-web/features/`). Each takes one
  view-model and emits every change through a callback, so connecting them to a real API means
  replacing the caller — not rebuilding the interface. There is no second implementation.
- The **preview is gated**: `NODE_ENV === 'development'` **and** `KRINLY_MERCHANT_PREVIEW=1`
  (`lib/preview/guard.ts`). A production build prerenders `/preview`, `/preview/today` and
  `/preview/acquisition` with status 404 and no visible content; `/preview/f/[slug]` is dynamic
  and 404s per request.
- There is **no authentication bypass**. The preview sits behind the same session and middleware
  as every other route, so a signed-in local account is needed to open it.

## Relevant files

| Path                                      | What                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/merchant-web/features/today/`       | Today: hero, Up next, action queue, money, the day, the Flow, sources, sheets |
| `apps/merchant-web/features/acquisition/` | Overview, sources, forms + editor, customer form, links, QR encoder           |
| `apps/merchant-web/features/common/`      | Shared between the two (`CohortProgression`)                                  |
| `apps/merchant-web/lib/preview/`          | Provisional models, fictional fixtures, selectors, view-models, store         |
| `apps/merchant-web/app/preview/`          | Routes: the guard, the previewed workspace, the isolated customer form        |
| `apps/merchant-web/scripts/validate/`     | `preview-check.mjs` — the browser validation for these screens                |

The fixtures are the design lab's dataset (Kesar Bridal Studio, fixed clock Wednesday
25 November 2026 10:30 IST), copied into `lib/preview/` rather than imported: `apps/design-lab`
is never built, so merchant-web cannot depend on it.

## Running it

```bash
echo 'KRINLY_MERCHANT_PREVIEW=1' >> apps/merchant-web/.env.local
pnpm --filter @krinly/merchant-web dev        # sign in, then http://localhost:3000/preview
```

| URL                    | What                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `/preview`             | What the preview is, and what is still simulated                        |
| `/preview/today`       | Today (`?range=today\|7d\|month\|last-month`)                           |
| `/preview/acquisition` | Acquisition (`?tab=overview\|sources\|forms\|links`, `?form=<id>\|new`) |
| `/preview/f/<slug>`    | The customer-facing form on its own, outside the shell                  |

## Implemented vs simulated

**Real, and will survive the move to an API**

- Every Today figure derives from one dataset through `lib/preview/selectors.ts`, so the
  headline, the money split, the chart's comparison value, the Flow and the source tables cannot
  disagree. Changing the reporting period moves all of them together.
- Verifying a payment mutates shared state: the headline grows, the unverified total shrinks, the
  queue item disappears, and Undo reverses it. The same store backs Acquisition, so a form or
  source edited there is reflected on Today.
- The QR codes are genuine (`features/acquisition/qr-encode.ts`: byte mode, error correction M,
  versions 1–10, written here rather than added as a dependency). They scan — to a development
  address on the machine running the preview, which every screen says plainly.
- Copy uses the real clipboard; Share uses the Web Share sheet where the browser has one and
  falls back to copying.

**Simulated, and labelled as such on screen**

- All data is fictional and lives in memory for the tab. "Reset fixtures" restores it.
- Instagram, Instagram ads, WhatsApp and Google capture nothing. Each row says whether Krinly
  captures it, somebody types it in, or it needs an integration that has not been built, and
  names the missing integration.
- Lead forms never submit. Opens, submissions and link clicks are fixture counters.
- Replying, notes and stage changes are read-only pointers to Inbox and the CRM phase.

## Outstanding backend dependencies

Before these screens can be shown to a merchant:

1. **Revenue and payments** — verified revenue for a period, the comparison value at the same
   point in the previous period, payments awaiting verification, and a verification mutation.
   Needs the verification policy settled first.
2. **Enquiries, cohorts and the journey** — enquiries in a period with their first source, and
   the stage each one reached. Needs issue #7 (data model) and the stage list.
3. **Attribution** — the rule that credits verified revenue to a source. Today and Acquisition
   both state on screen that this is provisional.
4. **Appointments** — today's bookings with their status.
5. **Acquisition sources** — a per-workspace list with its capture state, plus create/toggle.
6. **Lead capture forms** — storage, a public submission endpoint with spam protection, and a
   public hosting address. Until that exists the customer form stays isolated in the preview.
7. **Tracking links** — redirect with click counting, and carrying the source onto the enquiry.

Each of these is a view-model field today; the shapes in `lib/preview/` are a starting point for
the contract discussion, not a proposal to freeze.

## Changes to shared code

`@krinly/ui` changed in four small ways, all surfaced by validating these screens:

- `ComparisonChart` lays out responsively (see `design-system.md`).
- `Table`, `FlowChart`'s table view and `ComparisonChart`'s table view are keyboard-scrollable.
- `FilterToolbar`'s rows can shrink, so a wide control scrolls inside instead of widening the page.

`AppShell` gained `navItems`, `chrome` and `banner` so the preview reuses the production shell
instead of a copy; `chrome="preview"` removes the workspace switcher, account menu and sign-out,
which have nothing behind them there. `components/shell/nav-items.ts` is unchanged apart from its
comment: provisional modules must not appear in it.

## Constraints that still apply

- Patterns in `packages/ui` take business data as props; no sample data, stage lists, scoring or
  per-merchant copy belongs there.
- AI output is a proposal (`Apply`/`Dismiss`) and never mutates data.
- `apps/design-lab` stays until these screens have been visually compared against `/g`.
- Schema, auth and service-boundary rules in `CLAUDE.md` and `docs/architecture/decisions.md` are
  untouched by this work and still apply once these screens are wired to real data.
