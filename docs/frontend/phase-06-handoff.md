# Phase 06 handoff — Unified inbox and AI sales assistant

## Status

The Inbox is **built, interactive and validated** at `/preview/inbox`, inside the same
development-only preview as Today, Acquisition and the CRM (see `phase-04-handoff.md` for why a
preview and not a workspace route — the same reasons apply: no messaging, triage or AI-service
endpoint exists in `@krinly/contracts` yet, and the enquiry data model is still provisional).

Read `design-system.md` and `phase-04-handoff.md` first. This doc covers only what is new.

## What a conversation is

There is no separate inbox fixture. A conversation is simply a lead's existing `enquiry` /
`message_in` / `message_out` activities (already seeded for Today, Acquisition and the CRM),
read as a chat thread — `lib/preview/inbox.ts`. This keeps every conversation linked to the same
CRM customer; there is no independent fictional customer database.

## The simulated AI sales assistant

`computeAiAssist()` in `lib/preview/inbox.ts` is a small, deterministic, rule-based classifier —
**not a model call**. Given a lead, it derives an intent, a confidence, a summary, missing
information and a draft reply, purely from that lead's existing fields (stage, value, event date,
source). The intent union and the review policy (`complaint`/`spam` always need a human; low
confidence needs a human) deliberately mirror `apps/ai-service/src/ai_service/contracts.py` and
`triage.py`, so the shapes line up when a real triage endpoint exists. Every output is labelled
"Simulated development preview" on screen and only ever reaches the data through
Accept/Edit-and-send — never automatically.

## Store additions

`lib/preview/store.tsx` gained `inboxAssignee`, `inboxReadAt`, `inboxClosed` and
`inboxSuggestion` plus actions: `openConversation`, `sendReply`, `assignConversation`,
`resolveConversation`, `reopenConversation`, `regenerateSuggestion`, `dismissSuggestion`,
`escalateSuggestion`, `applyAiFact`. `sendReply` clears `awaitingReplySince` and a pending
`reply` follow-up exactly like `logCall`/`completeFollowUp` already did, so a reply from the Inbox
updates Today's action queue and the CRM lead detail with no extra wiring. `assignConversation`
also updates the lead's CRM owner, and "Approve — move to Ready to book" (shown when the AI reads
a conversation as ready to book) dispatches the existing `changeStage` action — no new CRM
mutation path was added.

## Layout

Three-panel desktop layout (`features/inbox/inbox-workspace.tsx`): conversation list, workspace,
and a collapsible right column with AI assist and Customer as tabs (so a 4th column was never
needed). Below `md` it becomes list-then-conversation, with AI assist and Customer reachable as a
full-screen sheet. The panel's height is measured at runtime (`useFillRemainingHeight`) rather
than guessed from a viewport-minus-chrome calc, because the shared banner above it has no fixed
height — a guessed calc either left a gap or let the list run under the fixed mobile bottom nav.

## Validation

`pnpm --filter @krinly/merchant-web typecheck lint format:check build` all pass. Browser
validation: `scripts/validate/inbox-check.mjs` (same conventions as `preview-check.mjs` — see that
script's header) — 24/24 checks passed: opening and switching conversations, accepting/editing a
suggested reply, a needs-review handoff and requesting human assistance, assigning a conversation
(and the CRM record picking up the new owner), resolving (and the Closed filter), keyboard access,
and the 1440/390 layouts with no horizontal overflow or console errors.

## Known limitations

- The AI classification is a deterministic hash of the lead id, not real sentiment analysis — two
  different leads with similar messages can get different simulated intents.
- `inboxAssignee`/`inboxReadAt`/`inboxClosed` are in-memory per tab, like the rest of the preview
  store: a reload resets them.
- No real WhatsApp/Instagram/website messaging exists; "channel" is read from the same source data
  Today and Acquisition already use.
