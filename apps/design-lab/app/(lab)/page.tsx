import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MODULES, STATUS_LABEL } from '@/lib/modules';
import { isLabEnabled } from '@/lib/lab-guard';

export const metadata: Metadata = { title: 'Index' };

const SCREENS = [
  { href: '/today', label: 'Today' },
  { href: '/leads', label: 'Leads — list' },
  { href: '/leads?view=board', label: 'Leads — pipeline' },
  { href: '/leads?lead=ld-harpreet', label: 'Lead details' },
];

const CONCEPTS = [
  {
    id: 'a',
    name: 'Concept A — Quiet Intelligence',
    idea: 'A calm, editorial daily brief. Its signature is the Thread: one fine line with a node for each step of the customer journey, used in the navigation, the journey chart, every lead row and the lead timeline.',
  },
  {
    id: 'b',
    name: 'Concept B — Growth Studio',
    idea: 'An expressive, action-first studio. Its signatures are the Flow — customers streaming from sources to verified revenue — and layered sheets on a deep ink backdrop.',
  },
  {
    id: 'g',
    name: 'B+ — Growth Studio, refined (chosen direction)',
    idea: 'Concept B’s look with Concept A’s efficiency: the revenue comparison chart and verified-versus-recorded split, a full prioritised action queue behind Up next, a denser leads list with the Thread, a reorganised lead panel and a compact mobile layout.',
  },
];

const RULES = [
  'Stages (New · Contacted · Interested · Ready to book · Booked · Lost) are provisional until issue #7 settles them.',
  '“Verified” means the business confirmed the money arrived. The real verification policy is undecided.',
  'Revenue by source credits each customer’s first source. Attribution rules are undecided.',
  '“Promising” uses three plain rules — stage, a customer message in the last 48 hours, an event within 90 days — shown as reasons, never as an AI score.',
  'The Assistant suggestion on Kritika Bansal’s lead is a proposal. Applying it is a person’s decision.',
];

export default function LabIndexPage() {
  // Each segment refuses to render outside an enabled dev server, so no lab content is sent.
  if (!isLabEnabled()) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-14 text-ink">
      <p className="text-sm text-ink-3">Krinly GrowthOS · Phase 02A</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Design lab</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">
        Two working visual concepts for the merchant overview and leads, built on the same fictional
        business — Kesar Bridal Studio in Jayanagar, Bengaluru — on a fixed clock of Wednesday 25
        November 2026, 10:30 am. Everything here is sample data held in memory: nothing is saved,
        sent or connected. Reload or use Reset to start again.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2 xl:grid-cols-3">
        {CONCEPTS.map((concept) => (
          <section key={concept.id} aria-labelledby={`concept-${concept.id}`}>
            <h2 id={`concept-${concept.id}`} className="text-lg font-semibold">
              {concept.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{concept.idea}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
              {SCREENS.map((screen) => (
                <li key={screen.href}>
                  <Link
                    href={`/${concept.id}${screen.href}`}
                    className="flex items-center justify-between py-2.5 hover:text-growth"
                  >
                    {screen.label}
                    <span aria-hidden="true" className="text-ink-3">
                      /{concept.id}
                      {screen.href}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="system-heading">
        <h2 id="system-heading" className="text-lg font-semibold">
          Design system (Phase 02B)
        </h2>
        <p className="mt-2 text-sm text-ink-2">
          Every token, component and pattern in <code>@krinly/ui</code>, light and dark, rendered
          with the package styles only.{' '}
          {/* A plain link: /system has its own root layout, so this is a full page load. */}
          <a href="/system" className="font-medium text-growth underline underline-offset-4">
            Open the showcase
          </a>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="type-heading">
        <h2 id="type-heading" className="text-lg font-semibold">
          Typography and colour
        </h2>
        <p className="mt-2 text-sm text-ink-2">
          Four typeface pairings measured in the browser (rupee glyph, tabular figures, Indic
          fallbacks) and both palettes with computed contrast.{' '}
          <Link href="/type" className="font-medium text-growth underline underline-offset-4">
            Open the exploration
          </Link>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="text-lg font-semibold">
          Provisional rules used by the prototype
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="text-lg font-semibold">
          What is documented, proposed or unconfirmed
        </h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-ink-3">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 font-medium">
                Module
              </th>
              <th scope="col" className="py-2 font-medium">
                Status
              </th>
              <th scope="col" className="py-2 font-medium">
                Basis
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {Object.values(MODULES).map((m) => (
              <tr key={m.slug}>
                <td className="py-2.5 pr-4 font-medium">{m.label}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-ink-2">
                  {STATUS_LABEL[m.status]}
                </td>
                <td className="py-2.5 text-ink-2">{m.basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
