# Browser validation scripts

Standalone Node scripts for validating merchant-web in a real browser against the local dev
stack. Not wired into any package script or CI — run manually with `node`.

## Requirements

Each script takes a `toolsDir` as its first argument: a directory with its own `package.json` that
has `playwright-core` and `axe-core` installed, e.g.

```bash
mkdir -p /tmp/merchant-web-tools && cd /tmp/merchant-web-tools
npm init -y
npm install playwright-core axe-core
```

Scripts launch `channel: 'chrome'` (your installed Chrome), so no Playwright browser download is
needed. Start the full local stack first, per the root README's "Local development" section
(Supabase, Redis, core-api, merchant-web) — both scripts sign in for real. `auth-shell-check.mjs`
exercises workspace pages and needs all of it; `preview-check.mjs` only needs Supabase and
merchant-web, because the preview makes no API calls.

`axe-core` is resolved from `<toolsDir>` when it is installed there; otherwise set
`AXE_CORE_PATH` to an `axe.min.js` (one ships inside this repo's pnpm store).

## Scripts

| Script                 | Usage                                           | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth-shell-check.mjs` | `node auth-shell-check.mjs <toolsDir> <outDir>` | Signs up a real local test account, confirms via Mailpit, onboards a workspace, and exercises the app shell — navigation, workspace switching, team/invite, command search, responsive layout, sign-out. Captures screenshots, axe-core and overflow results. Creates throwaway `@example.com` accounts/organizations in the local dev database only.                                                                                                                                                                                                                                                       |
| `preview-check.mjs`    | `node preview-check.mjs <toolsDir> <outDir>`    | Validates the Today and Acquisition development preview at `/preview`: reporting periods, the action queue, chart and source drill-downs, verifying a payment and Undo, source filtering and search, form creation with the live customer preview, tracking links and QR download, copy feedback, keyboard access, and the 1440/390 layouts. Captures screenshots, axe-core and overflow results. Needs `KRINLY_MERCHANT_PREVIEW=1` in `.env.local`; signs up a throwaway local account because the preview adds no auth bypass. `PREVIEW_BASE` points it at another port, `AXE_CORE_PATH` at an axe build. |

Output screenshots and `results.json` are throwaway review artifacts — don't commit them.
