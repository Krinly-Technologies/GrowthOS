'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { cn } from '@krinly/ui/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SourceId } from '@/lib/preview/domain';
import { inr, plural } from '@/lib/preview/format';
import { SOURCES } from '@/lib/preview/sample/scenario';
import type { TodayModel } from '@/lib/preview/today-model';

/** One source as a labelled bar. The bar is decoration; the figure carries the meaning. */
export function SourceBar({
  label,
  caption,
  value,
  share,
  onSelect,
  selectLabel,
}: {
  label: string;
  caption: ReactNode;
  value: ReactNode;
  /** 0–1 of the largest row. */
  share: number;
  onSelect?: () => void;
  selectLabel?: string;
}) {
  const body = (
    <>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">{label}</span>
        <span className="block truncate text-[12px] text-ink-3">{caption}</span>
      </span>
      <span className="flex items-center gap-3">
        {share > 0 ? (
          <span
            aria-hidden="true"
            className="h-5 rounded-r-[4px] bg-step-3"
            style={{ width: `${share * 78}%` }}
          />
        ) : null}
        <span className="display-figure tnum shrink-0 text-[17px] text-ink">{value}</span>
      </span>
    </>
  );
  const grid = 'grid grid-cols-[minmax(0,130px)_1fr] items-center gap-x-4 sm:grid-cols-[180px_1fr]';
  return onSelect ? (
    <button
      type="button"
      onClick={onSelect}
      className={cn(grid, 'w-full rounded-lg py-1 text-left hover:bg-canvas')}
    >
      {body}
      {selectLabel ? <span className="sr-only">: {selectLabel}</span> : null}
    </button>
  ) : (
    <span className={grid}>{body}</span>
  );
}

/**
 * Acquisition performance on Today: verified money credited to where each customer first came
 * from, beside the enquiries that arrived in the same period.
 */
export function SourcesSection({
  model,
  acquisitionHref,
  onDrillSource,
}: {
  model: TodayModel;
  acquisitionHref: string;
  onDrillSource: (source: SourceId) => void;
}) {
  const maxRevenue = Math.max(1, ...model.sources.map((s) => s.revenue));
  const byEnquiries = [...model.sources].sort((a, b) => b.enquiries - a.enquiries);
  const maxEnquiries = Math.max(1, ...byEnquiries.map((s) => s.enquiries));
  const totalEnquiries = byEnquiries.reduce((sum, s) => sum + s.enquiries, 0);
  const payingCustomers = new Set(model.revenue.payments.map((p) => p.leadId)).size;

  return (
    <Card padding="lg" aria-labelledby="sources-heading" className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <CardTitle id="sources-heading" className="text-xl">
          Where your customers came from
        </CardTitle>
        <Link
          href={acquisitionHref}
          className="inline-flex items-center gap-1 rounded-md text-[13.5px] font-semibold text-accent-strong hover:underline"
        >
          Manage acquisition
          <Icon name="arrow-right" size={15} />
        </Link>
      </div>
      <p className="mt-1 max-w-[70ch] text-sm text-ink-2">
        {model.sourceInsight ||
          `No verified revenue ${model.range.phrase} yet, so there is nothing to compare.`}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="by-money">
          <h3 id="by-money" className="text-[13px] font-bold text-ink-3">
            Verified revenue by source
          </h3>
          <ul className="mt-3 grid gap-3" data-testid="revenue-by-source">
            {model.sources.map((row) => (
              <li key={row.source}>
                <SourceBar
                  label={SOURCES[row.source].label}
                  caption={`${plural(row.customers, 'paying customer')} · ${plural(row.payments, 'payment')}`}
                  value={inr(row.revenue)}
                  share={row.revenue / maxRevenue}
                  onSelect={() => {
                    onDrillSource(row.source);
                  }}
                  selectLabel={`see ${SOURCES[row.source].label} in detail`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-ink-3">
            Verified {model.range.phrase} from {plural(payingCustomers, 'customer')}, credited to
            where each customer first came from. Attribution rules are still to be agreed.
          </p>
        </section>

        <section aria-labelledby="by-enquiries">
          <h3 id="by-enquiries" className="text-[13px] font-bold text-ink-3">
            New enquiries by source
          </h3>
          <ul className="mt-3 grid gap-3" data-testid="enquiries-by-source">
            {byEnquiries.map((row) => (
              <li key={row.source}>
                <SourceBar
                  label={SOURCES[row.source].label}
                  caption={
                    row.enquiries > 0
                      ? `${plural(row.booked, 'booked')} so far`
                      : 'nothing new in this period'
                  }
                  value={row.enquiries}
                  share={row.enquiries / maxEnquiries}
                  onSelect={() => {
                    onDrillSource(row.source);
                  }}
                  selectLabel={`see ${SOURCES[row.source].label} in detail`}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-ink-3">
            {plural(totalEnquiries, 'new enquiry', 'new enquiries')} {model.range.phrase}, against{' '}
            {model.enquiries.previous} in the period before.
          </p>
        </section>
      </div>
    </Card>
  );
}
