# Phase 07 handoff — Bookings, Quotations and Payments

## Status

Bookings (`/preview/bookings`), Quotations (`/preview/quotations`) and Payments
(`/preview/payments`) are **built, interactive and validated**, inside the same development-only
preview as Today, Acquisition, the CRM and Inbox (see `phase-04-handoff.md` for why a preview and
not a workspace route — core-api still has no booking, quotation or payment-verification endpoint).

Read `design-system.md` and `phase-04-handoff.md` first. This doc covers only what is new.

## Domain additions

`lib/preview/domain.ts`: `Payment.status` gained `requested`, `cancelled` and `failed` (alongside
the existing `recorded`/`verified`), plus optional `bookingId`/`cancelReason`. `Booking` gained an
optional `status` (`scheduled | confirmed | completed | cancelled`, via `bookingStatus()` —
defaults to `confirmed` so every booking seeded before this phase needs no fixture change), plus
optional `value`, `cancelReason` and `quotationId`. `Quotation` is new: items, a flat discount,
a validity date, and `quotationEffectiveStatus()`, which reads a `sent` quotation past its
`validUntil` as `expired` without a separate sweep or mutation.

## Store additions

`lib/preview/store.tsx` gained: `createQuotation`, `updateQuotation` (draft only), `duplicateQuotation`,
`sendQuotation`, `respondQuotation`; `createBooking` (explicit `status`: `scheduled` from the
Bookings workspace, `confirmed` from CRM's "Book a trial" and from an accepted quotation),
`updateBooking`, `confirmBooking`, `completeBooking`, `cancelBooking`; `requestPayment`,
`recordPayment` (fresh, or fulfilling an earlier request via `requestId`), `cancelPaymentRequest`.
A confirmed booking moves its lead to the `booked` CRM stage, the same milestone `changeStage`
already represents — no second "booked" concept was added. Every mutating action sets `undo` the
same way the existing ones do.

## Reused, not duplicated

Today's and CRM's view-models (`today-model.ts`, `crm-model.ts`) and selectors
(`appointmentsOn`, `paymentsFor`, `sumAmounts`, …) are unchanged and already read `data.bookings`
and `data.payments` generically, so a booking or payment created here shows up on Today and in
the CRM lead record with no extra wiring — only `today-model.ts`'s appointment filter was taught
to exclude `cancelled` bookings. New selectors (`bookingsFor`, `quotationsFor`, `allAppointments`,
`allQuotations`, `allPaymentRows`, `outstandingForBooking`, `matchesCustomer`) follow the same
"derive everything from one dataset" rule as the rest of `selectors.ts`.

CRM's previously-disabled "Message", "Book a trial" and "Collect payment" buttons
(`features/crm/lead-detail.tsx`) are now live: Message links to the Inbox conversation (shipped in
Phase 06); Book a trial and Collect payment open small CRM-local dialogs that dispatch the same
`createBooking`/`requestPayment`/`recordPayment` actions the Bookings and Payments workspaces use.

## Dependency: react-day-picker

Bookings' calendar uses `react-day-picker` (MIT, `10.0.2`, pinned) for the month grid — styled
entirely through its `classNames`/`components` props to the B+ tokens, not its default look. A
hand-rolled resource-scheduling engine or a second calendar implementation was ruled out as
unnecessary per the reuse-before-building principle (see `CLAUDE.md`); a plain month grid plus the
existing list/table components was enough for "a straightforward calendar, not a scheduling
engine." No PDF renderer was added for quotations — the customer-facing preview is a styled HTML
view triggered by `window.print()`.

## Provisional rules (assumptions, not production policy)

- **Booking status**: new bookings start `scheduled`; CRM's quick "Book a trial" and
  booking-from-an-accepted-quotation both create a `confirmed` booking directly (one explicit
  action already is the confirmation). Only `scheduled` → `confirmed` → `completed` is possible;
  `cancelled` is terminal and always carries a reason.
- **Payment status**: `requested` never counts as collected; `recorded` never counts as verified;
  only `verified` counts as revenue. Verifying is the same `verifyPayment` action Today already
  used for Phase 04 — nothing new was introduced there.
- **Outstanding balance** (`outstandingForBooking`) is a booking's value (or the lead's, if the
  booking has none) minus its `recorded` + `verified` payments — a display figure, not a ledger.
- Creating a booking from an accepted quotation defaults to tomorrow, 2 hours, with the lead's
  owner — a merchant reschedules it from Bookings afterwards; this is explicitly a placeholder,
  not a real-availability suggestion.

## Validation

`pnpm --filter @krinly/merchant-web typecheck lint format:check build` all pass (repo-wide
`pnpm format:check` is clean for every file this phase touched). Browser validation:
`scripts/validate/bookings-quotations-payments-check.mjs` — 12/12 checks passed: quotation
created → sent → accepted, booking created from it and visible in CRM and Bookings, a partial
payment recorded and verified with Today's revenue changing by exactly that amount once (and the
same payment refusing a second verification), 0 axe-core violations on Bookings and Payments, and
clean 1440/390 layouts with no console errors.

## Known limitations

- `react-day-picker`'s month grid compares days using the browser's local timezone; the rest of
  the preview deliberately renders every date as IST regardless of the viewer's machine. A booking
  very close to midnight IST could in principle land on the adjacent day in the calendar grid on a
  non-IST machine — a cosmetic edge case, not a data error (the stored timestamp is unaffected).
- Payments has no per-payment detail sheet (CRM's lead detail and the Payments row already show
  everything recorded) — reviewing one further would mean a sheet with no new information.
- As with every other preview screen, nothing persists: a reload restores the seed fixtures.
