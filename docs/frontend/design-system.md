# Krinly design system (`@krinly/ui`)

Direction: **B+ "Refined Growth Studio"** — a navy shell, a mint brand action, light working
surfaces, and calm, precise data. The package is consumed as source by the web apps
(`transpilePackages`). See it all at `/system` in the design lab (development only — see
`apps/design-lab/README.md`).

## Layers

| Import                         | Contains                                                               |
| ------------------------------ | ---------------------------------------------------------------------- |
| `@krinly/ui/styles.css`        | Tailwind 4 + tokens (light, opt-in dark), base styles, motion          |
| `@krinly/ui/lib/format`        | `formatINR` (₹3,01,000), `formatINRCompact` (₹3.01 L), `pluralize`, …  |
| `@krinly/ui/components/<name>` | Generic UI: button, input, field, tabs, badge, card, overlay, toast, … |
| `@krinly/ui/patterns/<name>`   | Krinly patterns: money, thread, signals, metric, card-stack, charts, … |

**What does not belong in the package:** business data, sample data, stage lists, verification or
attribution rules, scoring, copy about a specific merchant. Patterns take these as props (e.g.
`ThreadStepper steps={…}`, `VerificationStatus verifiedLabel={…}`) so product rules stay in the
app and can change without touching the design system. Stages, revenue attribution and
verification are **provisional** (issues #7–#12).

## Tokens

Use semantic utilities only (`bg-surface`, `text-ink-2`, `bg-accent`, `text-verified`…); never
hex values in components.

- **Brand** — `brand` (navy shell), `accent` (mint, the brand action, with navy text),
  `accent-strong` (growth green for emphasis on light). Brand colours never signal status.
- **Surfaces** — `canvas` → `surface`; `line`, `line-soft`; text `ink`, `ink-2`, `ink-3` (all AA on
  surface and canvas).
- **Status** — `verified` (teal + seal icon), `attention` (amber), `critical`, `info`, each with a
  `-soft` fill. Status always pairs colour with an icon or words.
- **Data** — ordinal ramp `step-1…4`, `step-off`, `lost`; charts use `chart-current`,
  `chart-previous`, `chart-grid`.
- **Type** — `font-sans` Manrope (UI), `font-display` / `.display-figure` Bricolage Grotesque
  (headings, hero figures); Noto Sans Devanagari/Tamil fallbacks. Each app loads the fonts with
  `next/font` and sets `--font-manrope`, `--font-bricolage`, `--font-noto-deva`, `--font-noto-tamil`.
  Add `.tnum` wherever numbers align.
- **Shape** — radius `sm 6 · md 8 · lg 10 · xl 16 · 2xl 22px`; shadows `shadow-ring`, `-card`,
  `-raised`, `-floating`, `-overlay`.
- **Motion** — `--duration-fast/base/slow` (140/200/320ms), one `--ease-out`. Everything is
  instant under `prefers-reduced-motion`.
- **Focus** — 2px `--focus` outline with 2px offset on every interactive element.
- **Dark** — opt-in with `.dark` on `<html>`. No app ships dark mode yet; following the OS
  preference is a product decision for later.

## Rules for screens

- One primary action per area. Mint (`variant="brand"`) for the brand action, navy (`default`)
  elsewhere; icon-only buttons use `IconButton` (its `label` is required).
- Native `Select`, checkbox and radio (`Choice`) for forms; wrap controls in `Field` for label,
  hint and error wiring.
- Tables on desktop, `ListRow` lists below `lg`. Long text truncates (`min-w-0` + `truncate`) and
  never causes horizontal scroll at 360px.
- Overlays: `Dialog` for short decisions, `Sheet` (`docked` or `floating`) for record details.
  Both trap focus, close on Escape and return focus to the opener.
- Toasts confirm and offer Undo. Inside a dialog or sheet they render in that layer, so Undo is
  reachable by keyboard and announced. Wrap the app in `ToastProvider` and `TooltipProvider`.
- Charts: 2px lines, hairline grid, legend plus selective direct labels, keyboard crosshair, and a
  table view. A comparison chart receives the **same comparison value the headline uses**
  (`comparison={{ value, label }}`) — never derive it from the previous series' bucket.
- Don't show unexplained scores or meters. Say why something is prioritised, in words.
- AI output is a proposal: show it with Apply/Dismiss; it never changes data by itself.
- Add a shared component only when two screens need it; otherwise keep it in the app.

## Validation

`pnpm --filter @krinly/ui typecheck lint`, the affected apps' `build`, and the browser checks for
`/system` (axe, keyboard Undo in a dialog/sheet, focus return, overflow at 1440–360, light and dark,
reduced motion).

Reusable scripts for the browser checks (screenshots, console errors, overflow, axe-core, scripted
keyboard/focus interactions) live in `apps/design-lab/scripts/validate/` — see that directory's
README for usage. They are standalone (run manually with `node`, not wired into any package
script or CI) and apply equally to the design lab and to the production implementation once it
exists.
