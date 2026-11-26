'use client';

import { type CSSProperties, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar } from '@/components/avatar';
import { VerifyPaymentDialog } from '@/components/dialogs';
import { Icon } from '@/components/icons';
import { activityIcon, actorName, channelText, SourceLabel } from '@/components/lead-bits';
import type { LeadsModel } from '@/components/models';
import { NoteComposer } from '@/components/note-composer';
import { OwnerMenu } from '@/components/owner-menu';
import { useShellActions } from '@/components/shell-actions';
import { SheetClose, SheetContent, SheetRoot, SheetTitle } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { type Lead, type Payment, PIPELINE, STAGE_LABEL, stageIndex } from '@/lib/domain';
import { ago, dueInfo, fullDate, inDays, inr, time, waited, weekdayDayMonth } from '@/lib/format';
import { paymentsFor, timelineFor } from '@/lib/selectors';
import { SERVICES } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';

export function LeadDrawerA({ m }: { m: LeadsModel }) {
  const lead = m.selected;
  return (
    <SheetRoot
      open={Boolean(lead)}
      onOpenChange={(open) => {
        if (!open) m.closeLead();
      }}
    >
      {lead ? <DrawerBody lead={lead} m={m} /> : null}
    </SheetRoot>
  );
}

function StageThread({ lead, m }: { lead: Lead; m: LeadsModel }) {
  const lost = lead.stage === 'lost';
  const idx = lost ? -1 : stageIndex(lead.stage);
  const reached = idx <= 0 ? 0 : (idx / (PIPELINE.length - 1)) * 100;
  return (
    <div>
      <ol
        className={cn('a-stage-thread grid grid-cols-5', lost && 'opacity-50')}
        style={{ '--reached': `${reached.toString()}%` } as CSSProperties}
        aria-label="Stage"
        data-testid="stage-thread"
      >
        {PIPELINE.map((stage, i) => {
          const current = i === idx;
          return (
            <li key={stage}>
              <button
                type="button"
                onClick={() => {
                  m.changeStage(lead, stage);
                }}
                aria-current={current ? 'step' : undefined}
                aria-label={
                  current ? `${STAGE_LABEL[stage]}, current stage` : `Move to ${STAGE_LABEL[stage]}`
                }
                className="group flex w-full flex-col items-center gap-2 rounded-lg px-1 py-1 hover:bg-canvas"
              >
                <span
                  className="a-stage-node"
                  data-on={i < idx ? 'true' : undefined}
                  data-current={current ? 'true' : undefined}
                />
                <span
                  className={cn(
                    'text-center text-[12px] leading-tight',
                    current ? 'font-semibold text-ink' : 'text-ink-3 group-hover:text-ink',
                  )}
                >
                  {STAGE_LABEL[stage]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {lost ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-critical-soft px-3 py-2 text-[13.5px]">
          <span className="text-critical">
            <span className="font-medium">Lost</span> — {lead.lostReason}
          </span>
          <button
            type="button"
            onClick={() => {
              m.changeStage(lead, 'contacted');
            }}
            className="font-medium text-ink underline underline-offset-4"
          >
            Reopen
          </button>
        </div>
      ) : (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              m.setLostLead(lead);
            }}
            className="rounded-md px-1.5 py-0.5 text-[12.5px] text-ink-3 underline-offset-4 hover:text-critical hover:underline"
          >
            Mark as lost
          </button>
        </div>
      )}
    </div>
  );
}

function DrawerBody({ lead, m }: { lead: Lead; m: LeadsModel }) {
  const { state, dispatch } = useLab();
  const actions = useShellActions();
  const notify = useToast();
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const timeline = timelineFor(state.data, lead.id);
  const payments = paymentsFor(state.data, lead.id);
  const suggestion = timeline.find((a) => a.suggestion?.status === 'open');
  const now = state.now;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const who = lead.latinName ?? lead.name;

  return (
    <SheetContent
      className="sm:w-[560px] sm:border-l sm:border-line sm:shadow-[-24px_0_48px_-24px_rgb(17_28_45/0.25)]"
      label={`Details for ${who}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-line px-5 pt-4 pb-4 sm:px-6">
        <SheetClose
          className="-ml-1 grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 hover:bg-canvas sm:hidden"
          aria-label="Back to leads"
        >
          <Icon name="chevron-left" size={20} />
        </SheetClose>
        <LeadAvatar lead={lead} size={44} className="hidden sm:inline-flex" />
        <div className="min-w-0 flex-1">
          <SheetTitle className="a-title text-[20px] leading-tight text-ink">
            {lead.name}
            {lead.latinName ? (
              <span className="ml-2 text-[15px] font-normal text-ink-3">{lead.latinName}</span>
            ) : null}
          </SheetTitle>
          <p className="mt-1 text-[13px] text-ink-3">
            {lead.phone} · {lead.area}
          </p>
        </div>
        <OwnerMenu lead={lead} />
        <SheetClose
          className="hidden size-9 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-canvas hover:text-ink sm:grid"
          aria-label="Close"
        >
          <Icon name="close" size={18} />
        </SheetClose>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-5 sm:px-6">
          <StageThread lead={lead} m={m} />
        </div>

        {/* Next action */}
        {lead.stage !== 'lost' && (lead.next ?? lead.awaitingReplySince !== undefined) ? (
          <div className="mx-5 mt-5 rounded-xl border border-line p-4 sm:mx-6">
            <p className="text-[12.5px] text-ink-3">Next</p>
            <p className="mt-0.5 text-[15px] font-medium text-ink">
              {lead.next?.label ?? 'Reply to the customer'}
            </p>
            <p
              className={cn(
                'text-[13px]',
                lead.awaitingReplySince !== undefined || due?.tone === 'today'
                  ? 'font-medium text-attention'
                  : due?.tone === 'overdue'
                    ? 'font-medium text-critical'
                    : 'text-ink-3',
              )}
            >
              {lead.awaitingReplySince !== undefined
                ? `Waiting ${waited(lead.awaitingReplySince, now)} for a reply`
                : due?.label}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead.next ? (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'completeNext', leadId: lead.id });
                    notify({
                      title: 'Marked done',
                      action: {
                        label: 'Undo',
                        onClick: () => {
                          dispatch({ type: 'undo' });
                        },
                      },
                    });
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-[13.5px] font-medium text-white hover:bg-ink-2"
                >
                  <Icon name="check" size={15} />
                  Mark done
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'logCall', leadId: lead.id, text: 'Called the customer.' });
                  notify({ title: 'Call logged', description: `${who}’s timeline is updated.` });
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13.5px] font-medium hover:border-ink"
              >
                <Icon name="phone" size={15} />
                Log a call
              </button>
              <button
                type="button"
                onClick={() => {
                  actions.openRecordPayment(lead.id);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13.5px] font-medium hover:border-ink"
              >
                <Icon name="payments" size={15} />
                Record a payment
              </button>
            </div>
          </div>
        ) : null}

        {/* Assistant proposal */}
        {suggestion?.suggestion ? (
          <div
            className="mx-5 mt-4 rounded-xl border border-dashed border-ink-3/50 bg-canvas p-4 sm:mx-6"
            data-testid="suggestion"
          >
            <p className="flex items-center gap-2 text-[12.5px] text-ink-3">
              <Icon name="assistant" size={15} />
              Assistant suggestion · {ago(suggestion.at, now)}
            </p>
            <p className="mt-1.5 text-[14.5px] text-ink">
              Move to <span className="font-semibold">{STAGE_LABEL[suggestion.suggestion.to]}</span>
            </p>
            <p className="mt-0.5 text-[13.5px] text-ink-2">{suggestion.suggestion.reason}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'applySuggestion', activityId: suggestion.id });
                  notify({
                    title: `${who} moved to ${STAGE_LABEL[suggestion.suggestion?.to ?? 'interested']}`,
                    action: {
                      label: 'Undo',
                      onClick: () => {
                        dispatch({ type: 'undo' });
                      },
                    },
                  });
                }}
                className="h-8 rounded-lg bg-ink px-3 text-[13px] font-medium text-white hover:bg-ink-2"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'dismissSuggestion', activityId: suggestion.id });
                }}
                className="h-8 rounded-lg px-3 text-[13px] font-medium text-ink-2 hover:bg-canvas-2"
              >
                Dismiss
              </button>
              <span className="ml-auto text-[12px] text-ink-3">
                Nothing changes until you apply it.
              </span>
            </div>
          </div>
        ) : null}

        {/* Details */}
        <dl className="mx-5 mt-6 grid grid-cols-[120px_1fr] gap-x-4 gap-y-2.5 text-[13.5px] sm:mx-6">
          <dt className="text-ink-3">Interested in</dt>
          <dd>{SERVICES[lead.service].label}</dd>
          {lead.eventDate !== undefined ? (
            <>
              <dt className="text-ink-3">{lead.eventLabel}</dt>
              <dd>
                {fullDate(lead.eventDate)}{' '}
                <span className="text-ink-3">· {inDays(lead.eventDate, now)}</span>
              </dd>
            </>
          ) : null}
          <dt className="text-ink-3">Value</dt>
          <dd className="tnum">{lead.value ? inr(lead.value) : 'Not quoted yet'}</dd>
          <dt className="text-ink-3">Came from</dt>
          <dd>
            <SourceLabel source={lead.source} />
            {lead.sourceDetail ? (
              <span className="block text-[12.5px] text-ink-3">{lead.sourceDetail}</span>
            ) : null}
          </dd>
          <dt className="text-ink-3">First enquiry</dt>
          <dd>
            {weekdayDayMonth(lead.createdAt)}, {time(lead.createdAt)}
          </dd>
        </dl>

        {/* Payments */}
        {payments.length > 0 ? (
          <section aria-labelledby="drawer-payments" className="mx-5 mt-6 sm:mx-6">
            <h3 id="drawer-payments" className="a-title text-[14.5px]">
              Payments
            </h3>
            <ul className="mt-2 divide-y divide-line-soft border-y border-line">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{p.kind}</span>
                    <span className="text-ink-3">
                      {' '}
                      · {p.method} · {weekdayDayMonth(p.recordedAt)}
                    </span>
                  </span>
                  {p.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-verified">
                      <Icon name="seal" size={14} />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifying(p);
                      }}
                      className="inline-flex h-7 items-center rounded-md bg-attention-soft px-2 text-[12.5px] font-medium text-attention hover:brightness-95"
                    >
                      Verify
                    </button>
                  )}
                  <span className="tnum w-20 text-right font-medium">{inr(p.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Timeline */}
        <section aria-labelledby="drawer-timeline" className="mx-5 mt-7 pb-10 sm:mx-6">
          <h3 id="drawer-timeline" className="a-title text-[14.5px]">
            Activity
          </h3>
          <NoteComposer leadId={lead.id} className="mt-3" />
          <ol className="a-timeline mt-5 grid gap-4" data-testid="timeline">
            {timeline.map((activity) => {
              const fromCustomer = activity.by === 'customer';
              return (
                <li key={activity.id} className="relative grid grid-cols-[28px_1fr] gap-3">
                  <span
                    className={cn(
                      'relative z-[1] grid size-7 place-items-center rounded-full ring-4 ring-surface',
                      fromCustomer
                        ? 'bg-mint-soft text-growth'
                        : activity.kind === 'payment'
                          ? 'bg-verified-soft text-verified'
                          : 'bg-canvas-2 text-ink-2',
                    )}
                  >
                    <Icon name={activityIcon(activity)} size={14} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={cn(
                        'text-[13.5px] leading-relaxed',
                        fromCustomer ? 'text-ink' : 'text-ink-2',
                      )}
                    >
                      {fromCustomer ? `“${activity.text}”` : activity.text}
                      {activity.amount && activity.kind === 'quotation' ? (
                        <span className="tnum font-medium text-ink"> · {inr(activity.amount)}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-3">
                      {actorName(activity, lead)}
                      {activity.channel ? ` · ${channelText(activity)}` : ''} ·{' '}
                      {weekdayDayMonth(activity.at)}, {time(activity.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <VerifyPaymentDialog
        payment={verifying}
        lead={lead}
        onOpenChange={(open) => {
          if (!open) setVerifying(null);
        }}
      />
    </SheetContent>
  );
}
