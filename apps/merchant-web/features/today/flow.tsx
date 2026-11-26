'use client';

import { Card } from '@krinly/ui/components/card';
import { FlowChart, type FlowLink, type FlowTarget } from '@krinly/ui/patterns/flow-chart';
import { CohortProgression } from '@/features/common/cohort-progression';
import { useMemo } from 'react';
import { SOURCE_IDS, SOURCES } from '@/lib/preview/sample/scenario';
import { dayMonth, inr, plural } from '@/lib/preview/format';
import type { TodayModel } from '@/lib/preview/today-model';

const TARGETS: readonly FlowTarget[] = [
  { id: 'paid', label: 'Paid & verified', color: 'var(--step-4)' },
  { id: 'booked', label: 'Booked, not paid yet', color: 'var(--step-3)' },
  { id: 'deciding', label: 'Still deciding', color: 'var(--step-1)' },
  { id: 'lost', label: 'Lost', color: 'var(--lost)' },
];

/** The cohort this chart is about, said in words. */
export function cohortPeriod(model: TodayModel): string {
  const from = dayMonth(model.range.start);
  const to = dayMonth(model.range.end);
  return from === to ? `on ${from}` : `between ${from} and ${to}`;
}

/**
 * The Flow: a named cohort — the people who first enquired in the chosen period — from where
 * they came from to where they are now. Counts are people, never money, and the cohort is
 * defined on the face of the chart so nobody has to guess what it includes.
 */
export function FlowSection({ model }: { model: TodayModel }) {
  const { cohort, steps } = model.journey;

  const { sources, links, paidRevenue } = useMemo(() => {
    // A cohort member counts as paid whenever any payment of theirs is verified, not only the
    // ones verified inside the reporting period — the cohort is a set of people, not a ledger.
    const verifiedByLead = new Map<string, number>();
    for (const payment of model.allPayments) {
      if (payment.status !== 'verified') continue;
      verifiedByLead.set(
        payment.leadId,
        (verifiedByLead.get(payment.leadId) ?? 0) + payment.amount,
      );
    }
    const counts = new Map<string, number>();
    const seen = new Set<string>();
    let revenue = 0;
    for (const lead of cohort) {
      const paid = verifiedByLead.get(lead.id);
      const outcome =
        paid !== undefined
          ? 'paid'
          : lead.stage === 'booked'
            ? 'booked'
            : lead.stage === 'lost'
              ? 'lost'
              : 'deciding';
      counts.set(`${lead.source}|${outcome}`, (counts.get(`${lead.source}|${outcome}`) ?? 0) + 1);
      seen.add(lead.source);
      revenue += paid ?? 0;
    }
    return {
      sources: SOURCE_IDS.filter((id) => seen.has(id)).map((id) => ({
        id,
        label: SOURCES[id].label,
      })),
      links: [...counts].flatMap(([key, value]): FlowLink[] => {
        const [source, target] = key.split('|');
        return source !== undefined && target !== undefined ? [{ source, target, value }] : [];
      }),
      paidRevenue: revenue,
    };
  }, [cohort, model.allPayments]);

  return (
    <Card padding="lg" className="min-w-0" aria-labelledby="flow-heading">
      <FlowChart
        title="The Flow"
        description={
          <>
            {plural(cohort.length, 'person', 'people')} who first enquired {cohortPeriod(model)} —
            where they came from and where they are now. Each person appears once, in the furthest
            place they reached.
          </>
        }
        sources={sources}
        targets={TARGETS}
        links={links}
        sourceHeading="First source"
        targetExtra={(id) => (id === 'paid' && paidRevenue > 0 ? inr(paidRevenue) : undefined)}
        emptyText={`Nobody enquired ${model.range.phrase}.`}
        note="First-source attribution and what counts as verified are provisional product rules (issues #7–#12)."
      />

      <div className="mt-6 border-t border-line-soft pt-5">
        <CohortProgression
          steps={steps}
          headingId="progression-heading"
          insight={model.journeyInsight}
        />
      </div>
      <h2 id="flow-heading" className="sr-only">
        The customer journey
      </h2>
    </Card>
  );
}
