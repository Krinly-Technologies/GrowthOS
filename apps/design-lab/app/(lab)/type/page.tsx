import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { contrastRatio, wcagLevel } from '@/lib/contrast';
import {
  anekDevanagari,
  anekLatin,
  anekTamil,
  atkinson,
  bricolage,
  instrumentSans,
  jakarta,
  manrope,
  notoDevanagari,
  notoTamil,
  plexSans,
} from '@/lib/fonts';
import { PALETTES, type Swatch } from '@/lib/palettes';
import { FontChecks, type Probes } from './font-checks';
import { isLabEnabled } from '@/lib/lab-guard';

export const metadata: Metadata = { title: 'Typography and colour' };

const first = (font: { style: { fontFamily: string } }) =>
  font.style.fontFamily.split(',')[0]?.trim() ?? '';

// Two different web fonts that both contain each script: widths only match when the tested
// family draws the glyphs itself.
const PROBES: Probes = {
  devanagari: [first(anekDevanagari), first(notoDevanagari)],
  tamil: [first(anekTamil), first(notoTamil)],
};

const PAIRINGS = [
  {
    id: 'a',
    name: 'Anek Latin — text and semi-condensed figures',
    used: 'Concept A',
    ui: '--font-anek',
    display: '--font-anek',
    displayStyle: { fontStretch: '84%', fontWeight: 600 },
    indic: 'var(--font-anek-deva), var(--font-anek-tamil)',
    indicName: 'Anek Devanagari / Anek Tamil',
    fonts: [
      { key: 'Anek Latin', family: first(anekLatin) },
      { key: 'Instrument Sans (rejected)', family: first(instrumentSans) },
    ],
    notes:
      'One superfamily from an Indian foundry (Ek Type) with sister families for ten Indian scripts, so a customer’s name in Tamil or Devanagari keeps the same voice as the interface. Its width axis gives calm text at 100% and editorial figures at 84%. Instrument Sans was the first choice for text, but the check above shows it has no rupee glyph — every ₹ would come from a different font — so it was dropped.',
  },
  {
    id: 'b',
    name: 'Manrope + Bricolage Grotesque',
    used: 'Concept B',
    ui: '--font-manrope',
    display: '--font-bricolage',
    displayStyle: { fontWeight: 700, fontVariationSettings: '"opsz" 96' },
    indic: 'var(--font-noto-deva), var(--font-noto-tamil)',
    indicName: 'Noto Sans Devanagari / Tamil',
    fonts: [
      { key: 'Manrope', family: first(manrope) },
      { key: 'Bricolage Grotesque', family: first(bricolage) },
    ],
    notes:
      'Bricolage’s optical-size axis gives large figures real character (ink traps, tight joins) while staying calm at small sizes. Manrope is very readable but common in generated dashboards — Bricolage carries the distinctiveness here.',
  },
  {
    id: 'c',
    name: 'IBM Plex Sans + Anek Latin',
    used: 'Phase 01 proposal',
    ui: '--font-plex',
    display: '--font-anek',
    displayStyle: { fontStretch: '86%', fontWeight: 600 },
    indic: 'var(--font-plex-deva), var(--font-anek-tamil)',
    indicName: 'IBM Plex Sans Devanagari / Anek Tamil',
    fonts: [
      { key: 'IBM Plex Sans', family: first(plexSans) },
      { key: 'Anek Latin', family: first(anekLatin) },
    ],
    notes:
      'Trustworthy and engineered, with a matching Devanagari family. It leans technical, which works against “intelligent without feeling technical”.',
  },
  {
    id: 'd',
    name: 'Plus Jakarta Sans + Atkinson Hyperlegible Next',
    used: 'Comparison',
    ui: '--font-atkinson',
    display: '--font-jakarta',
    displayStyle: { fontWeight: 700 },
    indic: 'var(--font-noto-deva), var(--font-noto-tamil)',
    indicName: 'Noto Sans Devanagari / Tamil',
    fonts: [
      { key: 'Plus Jakarta Sans', family: first(jakarta) },
      { key: 'Atkinson Hyperlegible Next', family: first(atkinson) },
    ],
    notes:
      'Atkinson was designed for low-vision readers: every figure and letter is unambiguous (1 l I, 0 O). Excellent for amounts; its quirky forms are harder to make feel premium. Jakarta headings are pleasant but generic.',
  },
] as const;

const ROWS = [
  { name: 'Harpreet Kaur', source: 'Wedding fair', value: '₹85,000' },
  { name: 'अनन्या मिश्रा', source: 'Instagram ads', value: '₹48,000' },
  { name: 'செல்வி ராஜன்', source: 'Google search', value: '₹18,000' },
  { name: 'Ritu Menon', source: 'Referral', value: '₹65,000' },
];

function SwatchRow({ swatch }: { swatch: Swatch }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span
        className="size-9 shrink-0 rounded-lg border border-black/10"
        style={{ background: swatch.hex }}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">
          {swatch.name} <span className="font-normal text-ink-3">{swatch.hex}</span>
        </span>
        <span className="block text-xs text-ink-3">{swatch.role}</span>
      </span>
    </li>
  );
}

export default function TypePage() {
  // Each segment refuses to render outside an enabled dev server, so no lab content is sent.
  if (!isLabEnabled()) notFound();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-ink">
      <Link href="/" className="text-sm text-ink-3 hover:text-ink">
        Design lab
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Typography and colour</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-2">
        Each pairing sets the same specimen. The checks underneath are measured live in this browser
        — a glyph counts as native only when two very different fallback fonts give identical
        widths. All families are SIL Open Font License 1.1.
      </p>

      <section aria-labelledby="pairings" className="mt-10">
        <h2 id="pairings" className="sr-only">
          Typeface pairings
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {PAIRINGS.map((p) => {
            const uiFont = `var(${p.ui}), ${p.indic}, system-ui, sans-serif`;
            const displayFont = `var(${p.display}), ${p.indic}, system-ui, sans-serif`;
            return (
              <article
                key={p.id}
                aria-labelledby={`pair-${p.id}`}
                className="rounded-2xl border border-line bg-surface p-6"
                style={{ fontFamily: uiFont }}
              >
                <div
                  className="flex items-baseline justify-between gap-4"
                  style={{ fontFamily: 'var(--ui-font)' }}
                >
                  <h3 id={`pair-${p.id}`} className="text-base font-semibold">
                    {p.name}
                  </h3>
                  <span className="text-xs text-ink-3">{p.used}</span>
                </div>
                <p
                  className="mt-6 leading-none tnum"
                  style={{ fontFamily: displayFont, fontSize: 56, ...p.displayStyle }}
                >
                  ₹3,42,500
                </p>
                <p className="mt-3 text-lg leading-snug">
                  verified this month — ₹41,200 more than October by this date.
                </p>
                <table className="mt-5 w-full text-sm">
                  <tbody className="divide-y divide-line">
                    {ROWS.map((row) => (
                      <tr key={row.name}>
                        <td className="py-2 font-medium">{row.name}</td>
                        <td className="py-2 text-ink-3">{row.source}</td>
                        <td className="py-2 text-right tnum">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-5 grid gap-1 text-ink-2">
                  <p className="text-[12px]">
                    12 · Follow up with Ritu — quotation sent 3 days ago
                  </p>
                  <p className="text-[13px]">
                    13 · Follow up with Ritu — quotation sent 3 days ago
                  </p>
                  <p className="text-[14px]">
                    14 · Follow up with Ritu — quotation sent 3 days ago
                  </p>
                  <p className="text-[16px]">
                    16 · Follow up with Ritu — quotation sent 3 days ago
                  </p>
                  <p className="text-[16px] tracking-wide">Il1 0O 6 8 9 · ₹ 1,11,111</p>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <span className="inline-flex h-9 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white">
                    Record payment
                  </span>
                  <span className="text-sm text-ink-3">Waiting 16 h</span>
                </div>
                <div
                  className="mt-6 border-t border-line pt-4"
                  style={{ fontFamily: 'var(--ui-font)' }}
                >
                  <FontChecks fonts={[...p.fonts]} indicFallback={p.indicName} probes={PROBES} />
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{p.notes}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="colour" className="mt-16">
        <h2 id="colour" className="text-2xl font-semibold tracking-tight">
          Colour
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">
          Brand colours never carry status. Verified money is teal with a seal glyph; attention is
          amber; critical is red — and every status also has a label, so meaning never depends on
          colour alone. Ratios are WCAG 2.x contrast, computed from the hex values.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {PALETTES.map((palette) => (
            <article
              key={palette.concept}
              aria-labelledby={`pal-${palette.concept}`}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <h3 id={`pal-${palette.concept}`} className="text-base font-semibold">
                Concept {palette.concept} — {palette.title}
              </h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-ink-3">Brand</p>
                  <ul>
                    {palette.brand.map((s) => (
                      <SwatchRow key={s.name} swatch={s} />
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-ink-3">Neutral</p>
                  <ul>
                    {palette.neutral.map((s) => (
                      <SwatchRow key={s.name} swatch={s} />
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-ink-3">Semantic (shared)</p>
                  <ul>
                    {palette.semantic.map((s) => (
                      <SwatchRow key={s.name} swatch={s} />
                    ))}
                  </ul>
                </div>
              </div>
              <table className="mt-6 w-full text-left text-sm">
                <caption className="pb-2 text-left text-xs text-ink-3">
                  Contrast of text-bearing pairs
                </caption>
                <tbody className="divide-y divide-line">
                  {palette.pairs.map((pair) => {
                    const ratio = contrastRatio(pair.fg, pair.bg);
                    const level = wcagLevel(ratio);
                    return (
                      <tr key={pair.label}>
                        <td className="py-1.5 pr-3">
                          <span
                            className="inline-flex h-7 w-12 items-center justify-center rounded-md border border-black/10 text-xs font-semibold"
                            style={{ background: pair.bg, color: pair.fg }}
                          >
                            Aa
                          </span>
                        </td>
                        <td className="py-1.5 pr-3">{pair.label}</td>
                        <td className="py-1.5 pr-3 text-right tnum">{ratio.toFixed(2)}:1</td>
                        <td
                          className={`py-1.5 text-right text-xs font-medium ${level === 'Fail' ? 'text-critical' : 'text-verified'}`}
                        >
                          {level === 'Fail' ? 'Fill only' : level}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
