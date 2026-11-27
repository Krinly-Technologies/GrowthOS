'use client';

import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { type ChartPoint, ComparisonChart } from '@krinly/ui/patterns/comparison-chart';
import { Metric } from '@krinly/ui/patterns/metric';
import { dayMonth, inr, inrCompact, time } from '@/lib/preview/format';
import type { SeriesPoint } from '@/lib/preview/selectors';
import type { GrowthModel } from '@/lib/preview/growth-model';
import { RangePicker } from '@/features/today/range-picker';

function points(series: readonly SeriesPoint[], bucket: 'hour' | 'day') {
  return series.map((p): ChartPoint => ({
    label: bucket === 'hour' ? time(p.t) : dayMonth(p.t),
    value: p.total,
  }));
}

/**
 * Revenue overview: what's verified, what's recorded but unverified, what's still outstanding,
 * and the trend against the same length of the previous period. Nothing here is quoted or
 * potential revenue — only verified payments ever count as collected.
 */
export function RevenueOverview({
  model,
  onReviewPayments,
}: {
  model: GrowthModel;
  onReviewPayments: () => void;
}) {
  const { revenue, range } = model;
  const current = points(model.series.current, range.bucket);
  const previous = points(model.series.previous, range.bucket);

  return (
    <Card padding="lg" aria-labelledby="growth-revenue-heading" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle id="growth-revenue-heading" className="text-xl">
          Revenue overview
        </CardTitle>
        <RangePicker
          value={model.rangeId}
          now={model.now}
          onChange={model.setRange}
          tone="surface"
        />
      </div>
      <p className="mt-1 text-sm text-ink-2">
        {range.phrase.charAt(0).toUpperCase() + range.phrase.slice(1)} ({dayMonth(range.start)} –{' '}
        {dayMonth(range.end)}), compared with {range.compareLabel}.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Verified revenue"
          value={inr(revenue.verified)}
          size="hero"
          context={
            <span className="flex items-center gap-1.5">
              <Icon
                name={revenue.delta >= 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                className={revenue.delta >= 0 ? 'text-verified' : 'text-critical'}
              />
              {inr(Math.abs(revenue.delta))} {revenue.delta >= 0 ? 'more' : 'less'} than{' '}
              {range.compareLabel}
            </span>
          }
        />
        <Metric
          label="Recorded, not verified"
          value={inr(revenue.unverified)}
          context={
            model.awaitingCount > 0 ? (
              <button type="button" onClick={onReviewPayments} className="text-ink underline">
                Review {model.awaitingCount} payment{model.awaitingCount === 1 ? '' : 's'}
              </button>
            ) : (
              'Nothing waiting on a check'
            )
          }
        />
        <Metric
          label="Outstanding"
          value={inr(revenue.outstanding)}
          context="Still owed against bookings that aren't cancelled"
        />
        <Metric
          label="Avg. verified transaction"
          value={inr(revenue.avgTransaction)}
          context={`across this period's verified payments`}
        />
      </div>

      <div className="mt-6">
        <ComparisonChart
          title={`Verified revenue, ${range.phrase}`}
          current={current}
          previous={previous}
          currentLabel={range.label}
          previousLabel={range.compareLabel}
          comparison={{ value: revenue.compareTotal, label: range.compareLabel }}
          formatValue={inr}
          formatAxis={inrCompact}
          xHeading={range.bucket === 'hour' ? 'Time' : 'Day'}
        />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
        Only verified payments count as revenue. Recorded-but-unverified and outstanding amounts are
        shown separately and never added into the verified figure.
      </p>
    </Card>
  );
}
