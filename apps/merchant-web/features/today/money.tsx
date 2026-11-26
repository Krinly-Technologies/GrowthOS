'use client';

import { Button } from '@krinly/ui/components/button';
import { Card, CardTitle } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { type ChartPoint, ComparisonChart } from '@krinly/ui/patterns/comparison-chart';
import { dayMonth, inr, inrCompact, plural, time } from '@/lib/preview/format';
import type { SeriesPoint } from '@/lib/preview/selectors';
import type { TodayModel } from '@/lib/preview/today-model';
import { comparisonName } from './range-picker';

function points(series: readonly SeriesPoint[], bucket: 'hour' | 'day'): ChartPoint[] {
  return series.map((p) => ({
    label: bucket === 'hour' ? time(p.t) : dayMonth(p.t),
    value: p.total,
  }));
}

/**
 * Verified revenue against the same point in the previous period, with recorded-but-unverified
 * money kept separate. The chart is handed the exact comparison value the headline uses, so the
 * two can never disagree.
 */
export function MoneySection({
  model,
  onReviewPayments,
  onShowPayments,
}: {
  model: TodayModel;
  onReviewPayments: () => void;
  onShowPayments: () => void;
}) {
  const verified = model.revenue.total;
  const waiting = model.awaiting.total;
  const previousLabel = comparisonName(model.range.compareLabel);
  const current = points(model.series.current, model.range.bucket);
  const previous = points(model.series.previous, model.range.bucket);

  return (
    <Card padding="lg" aria-labelledby="money-heading" className="min-w-0">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-4">
          <CardTitle id="money-heading" className="text-xl">
            Money {model.range.phrase}
          </CardTitle>
          <dl className="mt-4 grid gap-3" data-testid="money-split">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon name="seal" size={16} className="text-verified" />
                Verified
              </dt>
              <dd className="display-figure tnum text-[22px] text-ink">{inr(verified)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span aria-hidden="true" className="size-2 rounded-full bg-attention-dot" />
                Recorded, not verified
              </dt>
              <dd className="display-figure tnum text-[22px] text-ink-2">{inr(waiting)}</dd>
            </div>
          </dl>
          {verified + waiting > 0 ? (
            <div className="mt-3 flex h-2.5 gap-[2px]" aria-hidden="true">
              <span className="h-full rounded-l-full bg-step-3" style={{ flex: verified }} />
              {waiting > 0 ? (
                <span
                  className="h-full rounded-r-full bg-attention-dot/50"
                  style={{ flex: waiting }}
                />
              ) : null}
            </div>
          ) : null}
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
            Verified means somebody checked the money arrived; only verified payments count as
            revenue. Payments still waiting for a check are shown whatever their date, so this
            figure does not move when you change the period.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {waiting > 0 ? (
              <Button variant="brand" size="sm" shape="pill" onClick={onReviewPayments}>
                Review {plural(model.awaiting.payments.length, 'payment')}
              </Button>
            ) : null}
            {model.revenue.payments.length > 0 ? (
              <Button variant="outline" size="sm" shape="pill" onClick={onShowPayments}>
                {plural(model.revenue.payments.length, 'verified payment')}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="min-w-0 lg:col-span-8">
          <ComparisonChart
            title={`Verified revenue, ${model.range.phrase}`}
            current={current}
            previous={previous}
            currentLabel={model.range.label}
            previousLabel={previousLabel.charAt(0).toUpperCase() + previousLabel.slice(1)}
            comparison={{ value: model.revenue.compareTotal, label: model.range.compareLabel }}
            formatValue={inr}
            formatAxis={inrCompact}
            xHeading={model.range.bucket === 'hour' ? 'Time' : 'Day'}
          />
        </div>
      </div>
    </Card>
  );
}
