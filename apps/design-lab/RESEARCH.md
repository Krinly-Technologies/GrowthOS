# Visual research — Phase 02A

Captured 25 Nov 2026 with headless Chrome (playwright-core 1.65.1, no logins, no form submissions,
one visit per page, no bot-detection evasion). Screenshots were reviewed visually; they are kept
outside the repository because they are third-party material. Observations describe what was
rendered, not the products' private internals.

## Access

| Source                                                                                                                                                   | Result                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| linear.app, attio.com (+ /platform/data), stripe.com, dub.co (+ /analytics), vercel.com, intercom.com/helpdesk/inbox, cal.com, cal.com/rick, mercury.com | Rendered                                                                       |
| demo.mercury.com/dashboard                                                                                                                               | **Did not render** in headless Chrome — loading indicator only after 20 s      |
| awwwards.com/websites, godly.website, mobbin.com, refero.design                                                                                          | Rendered (public landing only; Mobbin and Refero libraries are behind sign-in) |
| land-book.com, lapa.ninja                                                                                                                                | **Blocked** (Cloudflare 403 challenge) — not retried, not worked around        |
| ui.shadcn.com/blocks, radix-ui.com, reactbits.dev, motion.dev, lucide.dev                                                                                | Rendered                                                                       |

## Findings that shaped the concepts

| Reference (rendered)                                                   | What was seen                                                                                                                                  | Adopted                                                                                 | Avoided                                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [ui.shadcn.com/blocks](https://ui.shadcn.com/blocks)                   | The archetypal dashboard: KPI cards with "+12.5%" chips, an area chart, a data table                                                           | Used as the explicit anti-reference                                                     | The whole pattern — neither Today screen starts with KPI cards                             |
| [attio.com/platform/data](https://attio.com/platform/data)             | Deals table with coloured type/source pills, owner avatars, column footers with count and sum; a contextual action card floating over the list | Group totals (A list headers); a contextual card layered over data (B's momentum stack) | A rainbow of pills — sources stay as plain text with a small glyph                         |
| [linear.app](https://linear.app)                                       | Dark, tight-tracked display type; product shown as real UI; activity rows like "moved from Todo to In Progress"                                | Stage changes as first-class timeline entries                                           | Two-tone headlines and mono uppercase eyebrows (also flagged by the frontend-design skill) |
| [stripe.com](https://stripe.com)                                       | One live, precise number in the hero; product cards with real UI and small precise charts                                                      | Exact figures with a way to see the payments behind them (A "Show them")                | Gradient ribbons as decoration                                                             |
| [dub.co/analytics](https://dub.co/analytics)                           | Funnel metrics as a connected strip (Clicks › Leads › Sales); hairline grid backgrounds                                                        | The journey as one connected sequence — refined into A's Thread and B's Flow            | Tab-strip funnel; grid-paper texture                                                       |
| [intercom.com/helpdesk/inbox](https://www.intercom.com/helpdesk/inbox) | Three panes with view counts and a right-hand attributes panel; product framed on fine-art imagery                                             | Counts only on items that need action                                                   | Bracketed mono labels; art backdrops                                                       |
| [cal.com/rick](https://cal.com/rick)                                   | Availability encoded by fill, selected day solid, today a dot; 12h/24h toggle; timezone shown                                                  | B's day ribbon: past shaded, now-marker, solid blocks for appointments                  | —                                                                                          |
| [mercury.com](https://mercury.com)                                     | Cinematic photography, calm light type, plenty of reassurance copy                                                                             | Calm and reassurance in A                                                               | Stock-style photography (no licensed assets for a prototype)                               |
| [vercel.com](https://vercel.com)                                       | Extreme restraint — monochrome, one geometric mark                                                                                             | Restraint in A's chrome                                                                 | Copying Geist or the monochrome signature                                                  |
| awwwards / godly / mobbin / refero                                     | Current trends: inline images inside headlines, bold kinetic type, purple-glow "AI" aesthetics, 3D renders                                     | One recognisable motif per concept instead of decoration                                | Purple glows, inline-emoji headlines, gratuitous 3D                                        |
| [reactbits.dev](https://www.reactbits.dev)                             | Animated components on dark purple gradients. Licence: **MIT + Commons Clause**                                                                | Nothing (reference only)                                                                | Its code — licence restricts commercial resale                                             |

## Licences checked

- Fonts used: Anek Latin/Devanagari/Tamil, Manrope, Bricolage Grotesque, IBM Plex Sans (+ Devanagari),
  Plus Jakarta Sans, Atkinson Hyperlegible Next, Instrument Sans, Noto Sans Devanagari/Tamil — all
  SIL OFL 1.1 (`google/fonts/ofl/<family>/OFL.txt`).
- Anthropic frontend-design skill: Apache-2.0 (guidance only).
- No third-party code or visual assets were copied into this app.
