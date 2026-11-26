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
(Supabase, Redis, core-api, merchant-web) — `auth-shell-check.mjs` signs in for real and needs all
of it running.

## Scripts

| Script                 | Usage                                           | What it does                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth-shell-check.mjs` | `node auth-shell-check.mjs <toolsDir> <outDir>` | Signs up a real local test account, confirms via Mailpit, onboards a workspace, and exercises the app shell — navigation, workspace switching, team/invite, command search, responsive layout, sign-out. Captures screenshots, axe-core and overflow results. Creates throwaway `@example.com` accounts/organizations in the local dev database only. |

Output screenshots and `results.json` are throwaway review artifacts — don't commit them.
