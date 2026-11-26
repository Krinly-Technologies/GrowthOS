'use client';

import { Dialog, Popover } from 'radix-ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar } from '@/components/avatar';
import { useConceptScope } from '@/components/concept';
import { VerifyPaymentDialog } from '@/components/dialogs';
import { Icon } from '@/components/icons';
import {
  type AttentionItem,
  buildAttention,
  type TodayModel,
  useTodayModel,
} from '@/components/models';
import { DialogContent } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { HOUR, istParts, startOfDay } from '@/lib/clock';
import type { Payment } from '@/lib/domain';
import { ago, inr, longDate, plural, time } from '@/lib/format';
import { useAnimatedNumber } from '@/lib/motion';
import { RANGE_IDS, resolveRange } from '@/lib/ranges';
import { SOURCES } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';
import { FlowBars, FlowChart } from './flow';

// ─────────────────────────────────────────────────────────────── range

function RangePill({ model }: { model: TodayModel }) {
  const scope = useConceptScope();
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="inline-flex h-9 items-center gap-2 rounded-full bg-ink-raised px-3.5 text-[13.5px] font-semibold text-on-ink hover:bg-[#23334d]">
        <Icon name="calendar" size={15} className="text-on-ink-2" />
        {model.range.label}
        <Icon name="chevron-down" size={14} className="text-on-ink-2" />
        <span className="sr-only">: change date range</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          {...scope}
          align="start"
          sideOffset={8}
          className="lab-pop z-50 w-60 rounded-2xl border border-line bg-surface p-1.5 text-sm text-ink shadow-[0_24px_48px_-20px_rgb(17_28_45/0.45)]"
        >
          <div role="radiogroup" aria-label="Date range" className="grid">
            {RANGE_IDS.map((id) => {
              const r = resolveRange(id, model.now);
              const checked = model.rangeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    model.setRange(id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-canvas"
                >
                  <span className="w-4 text-ink">
                    {checked ? <Icon name="check" size={16} strokeWidth={2.4} /> : null}
                  </span>
                  <span className={cn('flex-1', checked && 'font-bold')}>{r.label}</span>
                  <span className="text-[12px] text-ink-3">
                    vs {r.compareLabel.replace(/ by this (date|time)$/, '')}
                  </span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ─────────────────────────────────────────────────────────────── momentum stack

const TONE: Record<AttentionItem['tone'], string> = {
  attention: 'bg-attention-soft text-attention',
  critical: 'bg-critical-soft text-critical',
  calm: 'bg-canvas text-ink-2',
  good: 'bg-mint-soft text-growth',
};

function MomentumStack({
  items,
  model,
  onVerify,
}: {
  items: AttentionItem[];
  model: TodayModel;
  onVerify: () => void;
}) {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const count = items.length;
  if (count === 0) {
    return (
      <div className="rounded-[18px] bg-surface p-5 text-ink shadow-xl">
        <p className="b-heading text-[18px]">You’re all caught up</p>
        <p className="mt-1 text-sm text-ink-3">New enquiries and follow-ups will land here.</p>
      </div>
    );
  }
  const safe = index % count;
  const go = (step: number) => {
    setIndex((i) => (i + step + count) % count);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Up next"
      className="on-ink"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between text-on-ink">
        <h2 className="b-heading text-[16px]">Up next</h2>
        <div className="flex items-center gap-1.5">
          <span className="tnum mr-1 text-[12.5px] text-on-ink-2" aria-live="polite">
            {safe + 1} of {count}
          </span>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => {
              go(-1);
            }}
            className="grid size-8 place-items-center rounded-full bg-ink-raised text-on-ink hover:bg-[#23334d]"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => {
              go(1);
            }}
            className="grid size-8 place-items-center rounded-full bg-ink-raised text-on-ink hover:bg-[#23334d]"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
      <div className="b-stack mt-9 h-[196px]" data-testid="momentum-stack">
        {items.map((item, i) => {
          const depth = (i - safe + count) % count;
          const leads = item.leadIds
            .map((id) => model.byId.get(id))
            .filter((l) => l !== undefined)
            .slice(0, 4);
          const isTop = depth === 0;
          return (
            <article
              key={item.key}
              data-depth={depth <= 2 ? depth.toString() : 'hidden'}
              aria-hidden={isTop ? undefined : true}
              inert={!isTop}
              className="b-stack-card flex flex-col rounded-[18px] bg-surface p-5 text-ink shadow-[0_24px_48px_-18px_rgb(0_0_0/0.55)]"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl',
                    TONE[item.tone],
                  )}
                >
                  <Icon name={item.icon} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="b-heading text-[19px] leading-snug">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[13.5px] text-ink-3">
                    {item.meta}
                    {item.emphasis ? (
                      <span
                        className={cn(
                          'font-semibold',
                          item.tone === 'critical' ? 'text-critical' : 'text-attention',
                        )}
                      >
                        {' '}
                        · {item.emphasis}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="flex -space-x-2">
                  {leads.map((lead) => (
                    <LeadAvatar
                      key={lead.id}
                      lead={lead}
                      size={30}
                      className="ring-2 ring-surface"
                    />
                  ))}
                </span>
                <div className="flex items-center gap-2">
                  {count > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        go(1);
                      }}
                      className="h-9 rounded-full px-3 text-[13.5px] font-semibold text-ink-2 hover:bg-canvas"
                    >
                      Later
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (item.action.kind === 'link') router.push(item.action.href);
                      else onVerify();
                    }}
                    className="h-9 rounded-full bg-ink px-4 text-[13.5px] font-bold text-white hover:bg-ink-2"
                  >
                    {item.action.label}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── hero

function Hero({ model, onVerify }: { model: TodayModel; onVerify: () => void }) {
  const figure = useAnimatedNumber(model.revenue.total);
  const items = buildAttention(model, 'b');
  const { revenue, range } = model;
  const delta = revenue.delta;
  const chips: { label: string; href?: string; onClick?: () => void; show: boolean }[] = [
    {
      label: `${model.reply.length.toString()} to reply`,
      href: '/b/leads?show=reply',
      show: model.reply.length > 0,
    },
    {
      label: `${model.ready.length.toString()} ready to book`,
      href: '/b/leads?show=ready',
      show: model.ready.length > 0,
    },
    {
      label: `${model.followUps.length.toString()} follow-ups`,
      href: '/b/leads?show=followup',
      show: model.followUps.length > 0,
    },
    {
      label: `${inr(model.awaiting.total)} to verify`,
      onClick: onVerify,
      show: model.awaiting.payments.length > 0,
    },
  ];

  return (
    <section
      aria-labelledby="hero-heading"
      className="on-ink relative grid gap-8 rounded-[24px] bg-ink px-6 pt-6 pb-7 text-on-ink sm:px-8 sm:pt-7 lg:grid-cols-12 lg:gap-10 lg:pb-9"
    >
      <div className="lg:col-span-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 id="hero-heading" className="b-heading text-[15px] text-on-ink-2">
            Today · {longDate(model.now)}
          </h1>
          <RangePill model={model} />
        </div>
        <p
          className="b-display mt-5 text-[56px] leading-[0.92] text-white sm:text-[80px]"
          data-testid="hero-figure"
          aria-label={`${inr(revenue.total)} verified ${range.phrase}`}
        >
          {inr(figure)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[16px]">
          <span className="inline-flex items-center gap-1.5 text-on-ink">
            <Icon name="seal" size={18} className="text-[var(--verified-on-ink)]" />
            verified {range.phrase}
          </span>
          {revenue.compareTotal > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-raised px-3 py-1 text-[13.5px] font-semibold text-on-ink">
              <Icon name={delta >= 0 ? 'arrowUp' : 'arrowDown'} size={14} />
              {inr(Math.abs(delta))} {delta >= 0 ? 'more' : 'less'} than {range.compareLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[14.5px] text-on-ink-2">
          {plural(model.enquiries.count, 'new enquiry', 'new enquiries')} {range.phrase} ·{' '}
          {plural(model.appointments.length, 'appointment')} today
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Jump to">
          {chips
            .filter((c) => c.show)
            .map((chip) => (
              <li key={chip.label}>
                {chip.href ? (
                  <Link
                    href={chip.href}
                    className="inline-flex h-10 items-center rounded-full border border-ink-line px-4 text-[14px] font-semibold text-on-ink hover:border-mint hover:text-mint"
                  >
                    {chip.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={chip.onClick}
                    className="inline-flex h-10 items-center rounded-full border border-ink-line px-4 text-[14px] font-semibold text-on-ink hover:border-mint hover:text-mint"
                  >
                    {chip.label}
                  </button>
                )}
              </li>
            ))}
        </ul>
      </div>
      <div className="lg:col-span-5 lg:pt-1">
        <MomentumStack items={items} model={model} onVerify={onVerify} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── day ribbon

const START_H = 7;
const END_H = 21;

function DayRibbon({ model }: { model: TodayModel }) {
  const { state } = useLab();
  const router = useRouter();
  const dayStart = startOfDay(state.now);
  const span = (END_H - START_H) * HOUR;
  const pos = (t: number) =>
    Math.max(0, Math.min(100, ((t - (dayStart + START_H * HOUR)) / span) * 100));
  const enquiries = state.data.leads.filter(
    (l) => l.createdAt >= dayStart && l.createdAt <= state.now,
  );
  const nowPct = pos(state.now);
  const hours = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);

  return (
    <section aria-labelledby="day-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="day-heading" className="b-heading text-[22px]">
          Your day
        </h2>
        <p className="text-[14px] text-ink-2">
          {plural(model.appointments.length, 'appointment')} ·{' '}
          {plural(enquiries.length, 'new enquiry', 'new enquiries')} so far
        </p>
      </div>

      {/* Desktop and tablet: a timeline */}
      <div className="relative mt-7 hidden h-[132px] sm:block" data-testid="day-ribbon">
        <div className="absolute inset-x-0 top-[46px] h-[64px] rounded-2xl bg-canvas" />
        <div
          className="absolute top-[46px] left-0 h-[64px] rounded-l-2xl bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgb(17_28_45/0.035)_6px_7px)]"
          style={{ width: `${nowPct.toString()}%` }}
          aria-hidden="true"
        />
        {hours.map((h) => (
          <div
            key={h}
            className={cn(
              'absolute top-[114px] text-[11.5px] whitespace-nowrap text-ink-3',
              h === END_H ? '-translate-x-full' : h === START_H ? '' : '-translate-x-1/2',
            )}
            style={{ left: `${(((h - START_H) / (END_H - START_H)) * 100).toString()}%` }}
          >
            {h === 12 ? '12 pm' : h > 12 ? `${(h - 12).toString()} pm` : `${h.toString()} am`}
          </div>
        ))}
        {enquiries.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => {
              router.push(`/b/leads?lead=${lead.id}`);
            }}
            className="group absolute top-[14px] -translate-x-1/2"
            style={{ left: `${pos(lead.createdAt).toString()}%` }}
            aria-label={`New enquiry from ${lead.latinName ?? lead.name} at ${time(lead.createdAt)}, ${SOURCES[lead.source].label}`}
          >
            <span className="block size-3 rounded-full bg-[var(--step-2)] ring-[3px] ring-surface" />
            <span className="pointer-events-none absolute top-5 left-1/2 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[11.5px] font-semibold whitespace-nowrap text-white group-hover:block group-focus-visible:block">
              {lead.latinName ?? lead.name} · {time(lead.createdAt)}
            </span>
          </button>
        ))}
        <p className="absolute top-0 left-0 text-[11.5px] font-semibold text-ink-3">Enquiries</p>
        {model.appointments.map(({ booking, lead }) => {
          const left = pos(booking.start);
          const width = Math.max(pos(booking.start + booking.minutes * 60_000) - left, 10);
          const done = booking.start + booking.minutes * 60_000 < state.now;
          return (
            <button
              key={booking.id}
              type="button"
              onClick={() => {
                router.push(`/b/leads?lead=${lead.id}`);
              }}
              className={cn(
                'absolute top-[54px] flex h-12 flex-col justify-center overflow-hidden rounded-xl px-2.5 text-left',
                done ? 'bg-canvas-2 text-ink-3' : 'bg-ink text-white hover:bg-ink-2',
              )}
              style={{ left: `${left.toString()}%`, width: `${width.toString()}%` }}
            >
              <span className="truncate text-[12.5px] font-bold">
                {(lead.latinName ?? lead.name).split(' ')[0]}
              </span>
              <span className="truncate text-[11.5px] opacity-80">
                {time(booking.start)} · {booking.title}
              </span>
            </button>
          );
        })}
        <div
          className="absolute top-[38px] bottom-[22px] w-0.5 rounded bg-growth"
          style={{ left: `${nowPct.toString()}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full bg-growth px-1.5 text-[10.5px] font-bold text-white">
            Now
          </span>
        </div>
      </div>

      {/* Mobile: an agenda */}
      <ol className="mt-4 grid gap-2 sm:hidden">
        {model.appointments.map(({ booking, lead }) => (
          <li key={booking.id}>
            <Link
              href={`/b/leads?lead=${lead.id}`}
              className="flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3"
            >
              <span className="tnum w-16 text-[13px] font-bold">{time(booking.start)}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{lead.latinName ?? lead.name}</span>
                <span className="block text-[12.5px] text-ink-3">{booking.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-2 hidden text-[12.5px] text-ink-3 sm:block">
        {istParts(state.now).hour < 12 ? 'Morning' : 'Afternoon'} so far:{' '}
        {enquiries.map((l) => (l.latinName ?? l.name).split(' ')[0]).join(', ')} enquired.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── page

export function TodayB() {
  const model = useTodayModel();
  const { state } = useLab();
  const notify = useToast();
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const [review, setReview] = useState(false);
  const openVerify = () => {
    const only = model.awaiting.payments[0];
    if (model.awaiting.payments.length === 1 && only) setVerifying(only);
    else if (model.awaiting.payments.length > 0) setReview(true);
    else notify({ title: 'Nothing to verify' });
  };

  return (
    <div className="px-4 py-4 md:px-6 md:py-5 lg:px-8">
      <Hero model={model} onVerify={openVerify} />

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6">
        <section className="min-w-0 rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-7">
          <div className="hidden md:block">
            <FlowChart
              data={state.data}
              cohort={model.journey.cohort}
              phrase={model.range.phrase}
            />
          </div>
          <div className="md:hidden">
            <h2 className="b-heading text-[20px]">The Flow</h2>
            <p className="mt-1 text-[13.5px] text-ink-2">
              Where {model.range.phrase}’s{' '}
              {plural(model.journey.cohort.length, 'enquiry', 'enquiries')} came from and where they
              are now.
            </p>
            <FlowBars data={state.data} cohort={model.journey.cohort} />
          </div>
        </section>
        <section className="min-w-0 rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-7">
          <DayRibbon model={model} />
        </section>
        <section
          className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-7"
          aria-labelledby="best-sources"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="best-sources" className="b-heading text-[22px]">
              Money by source
            </h2>
            <Link
              href="/b/growth"
              className="text-[13.5px] font-semibold text-growth hover:underline"
            >
              See where your customers came from
            </Link>
          </div>
          {model.sourceInsight ? (
            <p className="mt-1 text-[14px] text-ink-2">{model.sourceInsight}</p>
          ) : null}
          <ul className="mt-5 grid gap-3.5" data-testid="sources">
            {model.sources.map((row) => {
              const max = Math.max(1, ...model.sources.map((s) => s.revenue));
              return (
                <li
                  key={row.source}
                  className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-x-4 sm:grid-cols-[180px_1fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-ink">
                      {SOURCES[row.source].label}
                    </p>
                    <p className="truncate text-[12px] text-ink-3">
                      {plural(row.customers, 'paying customer')} ·{' '}
                      {plural(row.enquiries, 'new enquiry', 'new enquiries')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {row.revenue > 0 ? (
                      <span
                        className="h-5 rounded-r-[4px] bg-[var(--step-3)]"
                        style={{ width: `${((row.revenue / max) * 78).toString()}%` }}
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="b-display shrink-0 text-[17px]">{inr(row.revenue)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[12.5px] text-ink-3">
            Verified {model.range.phrase}, credited to where each customer first came from.
            Attribution rules are still to be agreed.
          </p>
        </section>
      </div>

      <Dialog.Root open={review} onOpenChange={setReview}>
        <DialogContent
          title="Payments to verify"
          description="Recorded by your team. Check each one arrived, then verify it."
        >
          <ul className="divide-y divide-line-soft">
            {model.awaiting.payments.map((p) => {
              const lead = model.byId.get(p.leadId);
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{lead?.latinName ?? lead?.name}</p>
                    <p className="text-[12.5px] text-ink-3">
                      {p.kind} · {p.method} · {ago(p.recordedAt, model.now)}
                    </p>
                  </div>
                  <span className="tnum font-semibold">{inr(p.amount)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReview(false);
                      setVerifying(p);
                    }}
                    className="lab-primary h-9 rounded-full px-3.5 text-[13px] font-bold"
                  >
                    Verify
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog.Root>
      <VerifyPaymentDialog
        payment={verifying}
        lead={verifying ? model.byId.get(verifying.leadId) : undefined}
        onOpenChange={(open) => {
          if (!open) setVerifying(null);
        }}
      />
    </div>
  );
}
