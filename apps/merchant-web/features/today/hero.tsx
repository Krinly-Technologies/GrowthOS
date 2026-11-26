'use client';

import { Button } from '@krinly/ui/components/button';
import { Card } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { Delta } from '@krinly/ui/patterns/money';
import { Metric } from '@krinly/ui/patterns/metric';
import { inr, longDate, plural, weekdayDayMonth } from '@/lib/preview/format';
import type { AttentionGroup, AttentionItem, TodayModel } from '@/lib/preview/today-model';
import { comparisonName, RangePicker } from './range-picker';
import { QueueToggle, UpNext } from './up-next';

/**
 * The one number the day is about — verified revenue for the chosen period — next to the single
 * most important thing to do. Recorded-but-unverified money is stated separately and never
 * folded into the figure.
 */
export function TodayHero({
  model,
  items,
  onAct,
  onReviewPayments,
  onOpenGroup,
  queueOpen,
  onToggleQueue,
}: {
  model: TodayModel;
  items: readonly AttentionItem[];
  onAct: (item: AttentionItem) => void;
  onReviewPayments: () => void;
  onOpenGroup: (group: AttentionGroup) => void;
  queueOpen: boolean;
  onToggleQueue: () => void;
}) {
  const { revenue, range, awaiting } = model;
  const chips: { group: AttentionGroup; label: string; show: boolean }[] = [
    { group: 'reply', label: `${model.reply.length} to reply`, show: model.reply.length > 0 },
    {
      group: 'ready',
      label: `${model.ready.length} ready to book`,
      show: model.ready.length > 0,
    },
    {
      group: 'followup',
      label: plural(model.followUps.length, 'follow-up'),
      show: model.followUps.length > 0,
    },
  ];

  return (
    <Card
      variant="brand"
      padding="none"
      aria-labelledby="today-heading"
      className="grid gap-6 px-5 py-5 sm:gap-8 sm:px-8 sm:py-7 lg:grid-cols-12 lg:gap-10"
    >
      <div className="lg:col-span-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="today-heading" className="font-display text-[15px] font-semibold text-on-brand-2">
            <span className="sm:hidden">{weekdayDayMonth(model.now)}</span>
            <span className="hidden sm:inline">Today · {longDate(model.now)}</span>
          </h1>
          <RangePicker value={model.rangeId} now={model.now} onChange={model.setRange} />
        </div>

        <Metric
          className="mt-4 sm:mt-5"
          tone="on-brand"
          size="hero"
          label={<span className="sr-only">Verified revenue {range.phrase}</span>}
          value={<span data-testid="today-hero-figure">{inr(revenue.total)}</span>}
          context={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
              <span className="inline-flex items-center gap-1.5 text-on-brand">
                <Icon name="seal" size={18} className="text-verified-on-brand" />
                verified {range.phrase}
              </span>
              {revenue.compareTotal > 0 ? (
                <Delta
                  value={revenue.delta}
                  comparisonLabel={comparisonName(range.compareLabel)}
                  tone="on-brand"
                />
              ) : null}
            </div>
          }
        />

        {awaiting.payments.length > 0 ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-relaxed text-on-brand-2">
            <span aria-hidden="true" className="size-2 rounded-full bg-attention-dot" />
            <span>
              <span className="tnum font-semibold text-on-brand">{inr(awaiting.total)}</span> more
              recorded, not counted until verified
            </span>
            <button
              type="button"
              onClick={onReviewPayments}
              className="rounded-md font-semibold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              Review {plural(awaiting.payments.length, 'payment')}
            </button>
          </p>
        ) : null}

        <ul className="mt-6 hidden flex-wrap gap-2 sm:flex" aria-label="Jump to">
          {chips
            .filter((chip) => chip.show)
            .map((chip) => (
              <li key={chip.group}>
                <Button
                  variant="on-brand"
                  size="sm"
                  shape="pill"
                  className="bg-transparent shadow-[inset_0_0_0_1px_var(--brand-line)] hover:bg-brand-raised"
                  onClick={() => {
                    onOpenGroup(chip.group);
                  }}
                >
                  {chip.label}
                </Button>
              </li>
            ))}
        </ul>
      </div>

      <div className="lg:col-span-5 lg:pt-1">
        <UpNext items={items} onAct={onAct} />
        {items.length > 1 ? (
          <QueueToggle open={queueOpen} count={items.length} onToggle={onToggleQueue} />
        ) : null}
      </div>
    </Card>
  );
}
