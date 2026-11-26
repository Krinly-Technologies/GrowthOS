# Browser validation scripts

Standalone Node scripts used during Phases 02A/02B to validate the design lab (`/a`, `/b`, `/g`)
and the `@krinly/ui` showcase (`/system`) in a real browser: screenshots, console-error capture,
horizontal-overflow checks, axe-core accessibility scans, and scripted keyboard/focus interactions.

Kept here for reuse in Phase 03 (validating the production implementation against the same
checks). They are **not wired into any package script, workspace dependency, or CI job** — run
them manually with `node`.

## Requirements

Each script takes a `toolsDir` as its first argument: a directory with its own `package.json` that
has `playwright-core` and (for the axe-based scripts) `axe-core` installed, e.g.

```bash
mkdir -p /tmp/lab-tools && cd /tmp/lab-tools
npm init -y
npm install playwright-core axe-core
```

Scripts launch `channel: 'chrome'` (your installed Chrome), so no Playwright browser download is
needed. The design lab must be running first: `pnpm --filter @krinly/design-lab lab`
(http://localhost:3010).

## Scripts

| Script                 | Usage                                                              | What it does                                                                     |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `lab-shot.mjs`          | `node lab-shot.mjs <toolsDir> <url> <out.png> [w] [h] [full] [sel]` | Screenshots one URL; reports console errors and horizontal overflow.             |
| `recapture.mjs`         | `node recapture.mjs <toolsDir> <outDir> <slug> <url> <waitMs> <shots> [w] [h] [full]` | Re-captures one page with a longer settle time (animations, fonts, chart layout). |
| `lab-capture.mjs`       | `node lab-capture.mjs <toolsDir> <outDir>`                          | Captures every prototype (A/B) state at every supported viewport width.          |
| `lab-interactions.mjs` | `node lab-interactions.mjs <toolsDir> <out.json>`                   | Scripted interaction tests across both concepts (filters, drawers, forms, axe).  |
| `g-capture.mjs`         | `node g-capture.mjs <toolsDir> <outDir>`                            | Captures the approved B+ (`/g`) deliverables and runs overflow checks.           |
| `g-chart.mjs`           | `node g-chart.mjs <toolsDir> <base>`                                | Diffs the comparison-chart screen-reader value between `/a` and `/g`.            |
| `axe-region.mjs`        | `node axe-region.mjs <toolsDir> <url>`                              | Runs an axe-core scan against one URL and prints violations.                     |
| `system-check.mjs`      | `node system-check.mjs <toolsDir> <base> <outDir>`                  | Validates `/system`: console errors, overflow, axe, dialog/sheet focus trap and Undo, chart comparison value, reduced motion, truncation; captures screenshots. |
| `contact-sheet.mjs`     | `node contact-sheet.mjs <toolsDir> <out.png> <img1> [img2] [img3] [img4]` | Composites up to 4 screenshots into a 2x2 sheet for faster review.                |

Output screenshots are throwaway review artifacts (gitignored under `apps/design-lab/screenshots/`)
— never commit them.
