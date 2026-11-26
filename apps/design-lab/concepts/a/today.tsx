'use client';

import { Dialog, Popover, ToggleGroup } from 'radix-ui';
import Link from 'next/link';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { useConceptScope } from '@/components/concept';
import { VerifyPaymentDialog } from '@/components/dialogs';
import { Icon } from '@/components/icons';
import {
  type AttentionItem,
  buildAttention,
  type TodayModel,
  useTodayModel,
} from '@/components/models';
import { useShellActions } from '@/components/shell-actions';
import { DialogContent } from '@/components/sheet';
import type { Payment } from '@/lib/domain';
import { ago, dayMonth, inr, longDate, percent, plural } from '@/lib/format';
import { RANGE_IDS, resolveRange } from '@/lib/ranges';
import { SERVICES, SOURCES } from '@/lib/sample/scenario';
import { RevenueChartA } from './revenue-chart';

// ─────────────────────────────────────────────────────────────── range control

function RangeControl({ model }: { model: TodayModel }) {
  return (
    <ToggleGroup.Root
      type="single"
      value={model.rangeId}
      onValueChange={(value) => {
        const next = RANGE_IDS.find((r) => r === value);
        if (next) model.setRange(next);
      }}
      aria-label="Date range"
      className="inline-flex max-w-full overflow-x-auto rounded-lg bg-canvas-2 p-0.5"
    >
      {RANGE_IDS.map((id) => (
        <ToggleGroup.Item
          key={id}
          value={id}
          className="h-8 shrink-0 rounded-md px-3 text-[13px] text-ink-2 hover:text-ink data-[state=on]:bg-surface data-[state=on]:font-medium data-[state=on]:text-ink data-[state=on]:shadow-[0_0_0_1px_var(--line)]"
        >
          {resolveRange(id, model.now).label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

// ─────────────────────────────────────────────────────────────── lede

function PaymentsToVerify({
  model,
  onVerify,
}: {
  model: TodayModel;
  onVerify: (p: Payment) => void;
}) {
  const scope = useConceptScope();
  const count = model.awaiting.payments.length;
  return (
    <Popover.Root>
      <Popover.Trigger className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink">
        Review {plural(count, 'payment')}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          {...scope}
          align="start"
          sideOffset={8}
          className="lab-pop z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-2 text-sm text-ink shadow-[0_16px_40px_-16px_rgb(17_28_45/0.4)]"
        >
          <p className="px-2 pt-1 pb-2 text-[12.5px] text-ink-3">
            Recorded by your team — check the money arrived, then verify.
          </p>
          <ul className="divide-y divide-line-soft">
            {model.awaiting.payments.map((p) => {
              const lead = model.byId.get(p.leadId);
              return (
                <li key={p.id} className="flex items-center gap-3 px-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{lead?.latinName ?? lead?.name}</p>
                    <p className="text-[12.5px] text-ink-3">
                      {p.kind} · {p.method} · {ago(p.recordedAt, model.now)}
                    </p>
                  </div>
                  <span className="tnum font-medium">{inr(p.amount)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      onVerify(p);
                    }}
                    className="h-8 rounded-lg border border-line px-2.5 text-[13px] font-medium hover:border-ink"
                  >
                    Verify
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Lede({ model, onVerify }: { model: TodayModel; onVerify: (p: Payment) => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const { revenue, range, awaiting } = model;
  const comparison =
    revenue.compareTotal === 0
      ? '.'
      : revenue.delta === 0
        ? `, the same as ${range.compareLabel}.`
        : `, ${inr(Math.abs(revenue.delta))} ${revenue.delta > 0 ? 'more' : 'less'} than ${range.compareLabel}.`;

  return (
    <div>
      <h2 id="revenue-heading" className="sr-only">
        Verified revenue {range.phrase}
      </h2>
      <p
        className="a-figure text-[52px] leading-[0.95] text-ink sm:text-[66px]"
        data-testid="hero-figure"
      >
        {inr(revenue.total)}
      </p>
      <p className="mt-3 max-w-[30ch] text-[17px] leading-snug text-ink-2">
        verified {range.phrase}
        {comparison}
      </p>
      <div className="mt-5 grid gap-2.5 text-[14px]">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
          <Icon name="seal" size={17} className="text-verified" />
          <span>From {plural(revenue.payments.length, 'payment')} you have checked.</span>
          {revenue.payments.length > 0 ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => {
                setOpen((o) => !o);
              }}
              className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink"
            >
              {open ? 'Hide them' : 'Show them'}
            </button>
          ) : null}
        </p>
        {awaiting.payments.length > 0 ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-2">
            <span
              aria-hidden="true"
              className="ml-1 mr-0.5 inline-block size-2 rounded-full bg-[#c27c0e]"
            />
            <span>{inr(awaiting.total)} more is recorded but not yet verified.</span>
            <PaymentsToVerify model={model} onVerify={onVerify} />
          </p>
        ) : null}
      </div>
      <div id={listId} hidden={!open} className="mt-4">
        <ul
          className="max-h-64 divide-y divide-line-soft overflow-y-auto border-y border-line text-[13.5px]"
          data-testid="verified-list"
        >
          {revenue.payments.map((p) => {
            const lead = model.byId.get(p.leadId);
            return (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate">
                  {lead?.latinName ?? lead?.name}
                  <span className="text-ink-3">
                    {' '}
                    · {p.kind.toLowerCase()} · {p.method}
                  </span>
                </span>
                <span className="text-[12.5px] text-ink-3">
                  {dayMonth(p.verifiedAt ?? p.recordedAt)}
                </span>
                <span className="tnum w-[84px] text-right font-medium" data-amount={p.amount}>
                  {inr(p.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── needs you

const TONE_RING: Record<AttentionItem['tone'], string> = {
  attention: 'bg-attention-soft text-attention',
  critical: 'bg-critical-soft text-critical',
  calm: 'bg-canvas text-ink-2',
  good: 'bg-mint-soft text-growth',
};

function NeedsYou({
  model,
  onReviewPayments,
}: {
  model: TodayModel;
  onReviewPayments: () => void;
}) {
  const items = buildAttention(model, 'a');
  return (
    <section aria-labelledby="needs-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="needs-heading" className="a-title text-[17px]">
          Needs you
        </h2>
        <p className="text-[13px] text-ink-3">In order of what to do first</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">
          Nothing is waiting on you. New enquiries will appear here.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-line-soft border-y border-line" data-testid="needs-you">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-4 py-3.5">
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full',
                  TONE_RING[item.tone],
                )}
              >
                <Icon name={item.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-snug text-ink">{item.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-ink-3">
                  {item.meta}
                  {item.emphasis ? (
                    <>
                      {' · '}
                      <span
                        className={
                          item.tone === 'critical'
                            ? 'font-medium text-critical'
                            : 'font-medium text-attention'
                        }
                      >
                        {item.emphasis}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              {item.action.kind === 'link' ? (
                <Link
                  href={item.action.href}
                  className="inline-flex h-9 shrink-0 items-center rounded-lg border border-line px-3.5 text-[13.5px] font-medium text-ink hover:border-ink"
                >
                  {item.action.label}
                  <span className="sr-only">: {item.title}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onReviewPayments}
                  className="inline-flex h-9 shrink-0 items-center rounded-lg border border-line px-3.5 text-[13.5px] font-medium text-ink hover:border-ink"
                >
                  {item.action.label}
                  <span className="sr-only">: {item.title}</span>
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── journey

function Journey({ model }: { model: TodayModel }) {
  const { steps, cohort } = model.journey;
  const base = steps[0]?.count ?? 0;
  return (
    <section aria-labelledby="journey-heading">
      <h2 id="journey-heading" className="a-title text-[17px]">
        How customers are moving
      </h2>
      <p className="mt-0.5 text-[13px] text-ink-3">
        The {plural(cohort.length, 'person', 'people')} who enquired {model.range.phrase}
      </p>
      {base === 0 ? (
        <p className="mt-5 text-sm text-ink-3">No enquiries {model.range.phrase} yet.</p>
      ) : (
        <ol className="a-journey mt-4" data-testid="journey">
          {steps.map((step) => {
            const share = base ? step.count / base : 0;
            return (
              <li key={step.id} className="grid grid-cols-[14px_1fr] items-center gap-3 py-[7px]">
                <span
                  className="a-node a-node-lg"
                  aria-hidden="true"
                  style={
                    step.count > 0
                      ? { background: 'var(--thread-reached)', boxShadow: 'none' }
                      : undefined
                  }
                />
                <div>
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className={step.id === 'paid' ? 'font-medium text-ink' : 'text-ink-2'}>
                      {step.label}
                      {step.id === 'paid' ? (
                        <Icon name="seal" size={14} className="ml-1 inline text-verified" />
                      ) : null}
                    </span>
                    <span className="tnum">
                      <span className="font-semibold text-ink">{step.count}</span>
                      <span className="ml-2 inline-block w-9 text-right text-[12px] text-ink-3">
                        {percent(step.count, base)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-[5px] rounded-full bg-canvas-2" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-growth transition-[width] duration-300"
                      style={{
                        width: `${Math.max(share * 100, step.count > 0 ? 2 : 0).toString()}%`,
                        opacity: step.id === 'paid' ? 1 : 0.78,
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {model.journeyInsight ? (
        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
          {model.journeyInsight.text}{' '}
          <Link
            href={`/a/leads?stage=${model.journeyInsight.stage}`}
            className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink"
          >
            See who is waiting
          </Link>
        </p>
      ) : null}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── sources

function Sources({ model }: { model: TodayModel }) {
  const max = Math.max(1, ...model.sources.map((s) => s.revenue));
  return (
    <section aria-labelledby="sources-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="sources-heading" className="a-title text-[17px]">
          Where customers came from
        </h2>
        <Link
          href="/a/growth"
          className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline"
        >
          See where your customers came from over time
        </Link>
      </div>
      {model.sourceInsight ? (
        <p className="mt-1 text-[14px] text-ink-2">{model.sourceInsight}</p>
      ) : null}

      <table className="mt-4 hidden w-full text-[14px] md:table" data-testid="sources">
        <thead>
          <tr className="border-b border-line text-left text-[12.5px] text-ink-3">
            <th scope="col" className="py-2 pr-4 font-medium">
              Source
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              New enquiries
            </th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">
              Paying customers
            </th>
            <th scope="col" className="w-[44%] py-2 font-medium">
              <span className="sr-only">Share of revenue</span>
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              Verified revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {model.sources.map((row) => (
            <tr key={row.source}>
              <th scope="row" className="py-2.5 pr-4 text-left font-medium">
                {SOURCES[row.source].label}
              </th>
              <td className="tnum py-2.5 pr-4 text-right">{row.enquiries}</td>
              <td className="tnum py-2.5 pr-4 text-right text-ink-2">{row.customers}</td>
              <td className="py-2.5 pr-4" aria-hidden="true">
                <div className="h-2 rounded-[4px] bg-transparent">
                  <div
                    className="h-full rounded-r-[4px] bg-growth/85"
                    style={{ width: `${((row.revenue / max) * 100).toString()}%` }}
                  />
                </div>
              </td>
              <td className="tnum py-2.5 text-right font-medium">{inr(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-4 divide-y divide-line-soft border-y border-line md:hidden">
        {model.sources.map((row) => (
          <li key={row.source} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{SOURCES[row.source].label}</span>
              <span className="tnum font-medium">{inr(row.revenue)}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-canvas-2" aria-hidden="true">
              <div
                className="h-full rounded-full bg-growth/85"
                style={{ width: `${((row.revenue / max) * 100).toString()}%` }}
              />
            </div>
            <p className="mt-1.5 text-[13px] text-ink-3">
              {plural(row.enquiries, 'new enquiry', 'new enquiries')} ·{' '}
              {plural(row.customers, 'paying customer')}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12.5px] text-ink-3">
        Enquiries are new {model.range.phrase}. Revenue counts payments verified{' '}
        {model.range.phrase}, credited to where each customer first came from — so it includes
        customers who enquired earlier. Attribution rules are still to be agreed.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────── page

export function TodayA() {
  const model = useTodayModel();
  const actions = useShellActions();
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const firstAwaiting = model.awaiting.payments[0];
  const prevLabel = model.range.compareLabel.replace(/ by this (date|time)$/, '');

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-6 md:px-8 lg:px-10 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="a-title hidden text-[22px] leading-tight md:block">Today</h1>
          <p className="text-[13.5px] text-ink-3">{longDate(model.now)}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <RangeControl model={model} />
          <button
            type="button"
            onClick={() => {
              actions.openRecordPayment();
            }}
            className="hidden h-9 items-center gap-2 rounded-lg bg-ink px-3.5 text-[13.5px] font-medium text-white hover:bg-ink-2 sm:inline-flex"
          >
            <Icon name="plus" size={15} />
            Record a payment
          </button>
        </div>
      </header>

      <section
        aria-labelledby="revenue-heading"
        className="mt-7 grid gap-8 lg:grid-cols-12 lg:gap-12"
      >
        <div className="lg:col-span-5">
          <Lede model={model} onVerify={setVerifying} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <RevenueChartA
            current={model.series.current}
            previous={model.series.previous}
            compareAtSamePoint={model.revenue.compareTotal}
            range={model.range}
            currentLabel={model.range.label}
            previousLabel={prevLabel.charAt(0).toUpperCase() + prevLabel.slice(1)}
          />
        </div>
      </section>

      <div className="mt-10 grid gap-10 border-t border-line pt-8 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-7">
          <NeedsYou
            model={model}
            onReviewPayments={() => {
              if (model.awaiting.payments.length === 1 && firstAwaiting)
                setVerifying(firstAwaiting);
              else setReviewOpen(true);
            }}
          />
        </div>
        <div className="min-w-0 lg:col-span-5">
          <Journey model={model} />
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <Sources model={model} />
      </div>

      <ReviewSheet
        model={model}
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onVerify={(p) => {
          setReviewOpen(false);
          setVerifying(p);
        }}
      />
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

function ReviewSheet({
  model,
  open,
  onOpenChange,
  onVerify,
}: {
  model: TodayModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (p: Payment) => void;
}) {
  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title="Payments to verify">
      <p className="text-sm text-ink-3">
        Recorded by your team. Check each one arrived, then verify it.
      </p>
      <ul className="mt-4 divide-y divide-line-soft border-y border-line">
        {model.awaiting.payments.map((p) => {
          const lead = model.byId.get(p.leadId);
          return (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{lead?.latinName ?? lead?.name}</p>
                <p className="text-[12.5px] text-ink-3">
                  {p.kind} · {p.method} · {p.reference} · {ago(p.recordedAt, model.now)}
                  {lead ? ` · ${SERVICES[lead.service].short}` : ''}
                </p>
              </div>
              <span className="tnum font-medium">{inr(p.amount)}</span>
              <button
                type="button"
                onClick={() => {
                  onVerify(p);
                }}
                className="h-9 rounded-lg border border-line px-3 text-[13px] font-medium hover:border-ink"
              >
                Verify
              </button>
            </li>
          );
        })}
      </ul>
    </DialogShell>
  );
}

function DialogShell({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} className="w-[min(520px,calc(100vw-2rem))]">
        {children}
      </DialogContent>
    </Dialog.Root>
  );
}
