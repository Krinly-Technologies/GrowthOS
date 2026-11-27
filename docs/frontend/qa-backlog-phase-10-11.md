# Frontend QA backlog — for Phases 10 and 11

Consolidates every outstanding browser, accessibility, financial-consistency and authorization
check carried forward from Phases 04, 05, 06 and 07, plus what Phase 08 (Revenue Intelligence,
Automation, Knowledge Base, AI Assistant configuration, Settings, Admin Portal) adds. Nothing
here was re-run or closed out as part of approving Phase 08 — this is the list for Phase 10/11 to
work through, not a report that it's done.

## Carried forward from Phase 04/05 (Today, Acquisition, CRM)

Outstanding backend dependencies before these screens can be shown to a real merchant (see
`phase-04-handoff.md` → "Outstanding backend dependencies" for full detail):

1. Revenue and payments — verified revenue, period-over-period comparison, awaiting-verification
   list, and a real verification mutation. Needs the verification policy settled first.
2. Enquiries, cohorts and the journey — needs issue #7 (data model) and the stage list.
3. Attribution — the rule crediting verified revenue to a source is still provisional.
4. Appointments — today's bookings with real status.
5. Acquisition sources — a per-workspace list with capture state, create/toggle.
6. Lead capture forms — storage, a public submission endpoint with spam protection, public
   hosting.
7. Tracking links — redirect with click counting, carrying the source onto the enquiry.

Constraints that still apply regardless of phase: `packages/ui` patterns stay data-free; AI
output stays Apply/Dismiss only; schema/auth/service-boundary rules in `CLAUDE.md` and
`docs/architecture/decisions.md` are untouched by any preview work.

## Carried forward from Phase 06 (Inbox, AI sales assistant)

- The AI classification is a deterministic hash, not real sentiment analysis — needs a real
  triage model/endpoint before this ships.
- `inboxAssignee`/`inboxReadAt`/`inboxClosed` are in-memory per tab; needs real persistence.
- No real WhatsApp/Instagram/website messaging integration exists yet.

## Carried forward from Phase 07 (Bookings, Quotations, Payments)

- `react-day-picker`'s month grid compares days in the browser's local timezone while the rest
  of the preview renders IST; a booking very close to midnight IST could land on the adjacent day
  in the calendar grid on a non-IST machine. Cosmetic, not a data error — confirm before this
  reaches a real calendar.
- Payments has no per-payment detail sheet.
- Nothing in the preview persists across a reload (by design, but worth re-stating as a backend
  dependency: real bookings/quotations/payments need real storage).

## New from Phase 08 — not yet run

**Browser/accessibility** (no `scripts/validate/*.mjs` script was written or run for these
screens, unlike Phases 04–07; this is the main gap to close first in Phase 10/11):

- Growth (`/preview/growth`): axe-core pass, keyboard access to the source-performance table and
  its sort/filter controls, 1440/390 layout check, CSV export tested in a real browser (only
  exercised via code review here).
- Automation (`/preview/automation`): focus trap/Escape/return-focus in the workflow editor
  dialog, keyboard access to add/remove condition and action rows, axe-core pass, 1440/390 layout.
- Knowledge Base (`/preview/knowledge`): axe-core pass on the entry list and editor dialog,
  keyboard access to search/category filters, simulated upload's status transition announced to
  assistive tech (currently a visual-only badge change).
- AI Assistant configuration (`/preview/assistant`): axe-core pass, keyboard access to the
  qualification-question and handoff-condition list editors (add/remove/reorder).
- Preview Settings (`/preview/settings`) and the real `/o/[orgId]/settings`: axe-core pass;
  the real page has not been checked against an authenticated session or a non-member account —
  only `typecheck`/`lint`/`build` ran, no logged-in browser check.
- Admin-web support preview (`/preview` in `admin-web`): axe-core pass, keyboard access to the
  workspace picker, 1440/390 layout, and no screenshots were captured for any of the 8 the
  original brief asked for.

**Financial consistency:**

- Growth's revenue overview (verified / recorded-unverified / outstanding / avg. transaction) was
  traced through `selectors.ts` by inspection, but there is no scripted check (in the style of
  `bookings-quotations-payments-check.mjs`) asserting these figures agree with Today's and
  Payments' numbers for the same period after a live mutation (e.g., verifying a payment and
  confirming Growth's total moves by exactly that amount, the way Phase 07's script did for
  Today).
- `outstandingTotal` sums every non-cancelled booking regardless of reporting period — confirm
  this is the intended semantics (a point-in-time figure, not period-scoped) before Phase 10/11
  treats it as authoritative.

**Authorization:**

- `/o/[orgId]/settings` relies on the existing session/membership check in
  `app/o/[orgId]/layout.tsx` (core-api's 404 for non-members) but this was never exercised with a
  real non-member account in a browser this phase — only read by code review.
- The admin-web support preview's layout gate (`isAdminPreviewEnabled()` **and** a real operator
  session) has not been exercised end-to-end with a genuine non-operator account to confirm it
  404s rather than leaking the fictional workspace list.
- Production build output was checked to confirm `/preview` routes are stripped/404 in both apps
  (`next build` output), but nobody has hit a deployed production build directly to confirm the
  same.

## Explicitly deferred, not a bug

- Automation, Knowledge Base and Assistant configuration state live in a new, separate
  `WorkspaceConfigProvider` (`lib/preview/workspace-config.tsx`) — in-memory per tab, same as the
  rest of the preview. No backend exists for any of it yet.
- The admin-web support dashboard (per-workspace activity, tickets, audit) is entirely fictional;
  core-api exposes only `GET /v1/operator/session`.
