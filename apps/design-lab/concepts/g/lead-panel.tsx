'use client';

import { Tabs } from 'radix-ui';
import { type CSSProperties, useState } from 'react';
import { cn } from '@krinly/ui/lib/utils';
import { LeadAvatar } from '@/components/avatar';
import { VerifyPaymentDialog } from '@/components/dialogs';
import { Icon } from '@/components/icons';
import { activityIcon, actorName, channelText, SOURCE_ICON } from '@/components/lead-bits';
import type { LeadsModel } from '@/components/models';
import { NoteComposer } from '@/components/note-composer';
import { OwnerMenu } from '@/components/owner-menu';
import { useShellActions } from '@/components/shell-actions';
import { SheetClose, SheetContent, SheetRoot, SheetTitle } from '@/components/sheet';
import { useToast } from '@/components/toast';
import { type Lead, type Payment, PIPELINE, STAGE_LABEL, stageIndex } from '@/lib/domain';
import { ago, dueInfo, fullDate, inDays, inr, time, waited, weekdayDayMonth } from '@/lib/format';
import { paymentsFor, sumAmounts, timelineFor } from '@/lib/selectors';
import { SERVICES, SOURCES } from '@/lib/sample/scenario';
import { useLab } from '@/lib/store';

export function LeadPanelG({ m }: { m: LeadsModel }) {
  const lead = m.selected;
  return (
    <SheetRoot
      open={Boolean(lead)}
      onOpenChange={(open) => {
        if (!open) m.closeLead();
      }}
    >
      {lead ? <Panel lead={lead} m={m} /> : null}
    </SheetRoot>
  );
}

/** Concept A's Thread on B's ink: the stage control shows the journey, not just a choice. */
function ThreadStepper({ lead, m }: { lead: Lead; m: LeadsModel }) {
  const lost = lead.stage === 'lost';
  const idx = lost ? -1 : stageIndex(lead.stage);
  const reached = idx <= 0 ? 0 : (idx / (PIPELINE.length - 1)) * 100;
  return (
    <div className="mt-5" data-testid="stage-stepper">
      <ol
        aria-label="Stage"
        className={cn('g-stepper grid grid-cols-5', lost && 'opacity-45')}
        style={{ '--reached': `${reached.toString()}%` } as CSSProperties}
      >
        {PIPELINE.map((stage, i) => {
          const current = i === idx;
          return (
            <li key={stage}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-label={
                  current ? `${STAGE_LABEL[stage]}, current stage` : `Move to ${STAGE_LABEL[stage]}`
                }
                onClick={() => {
                  m.changeStage(lead, stage);
                }}
                className="group flex w-full flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 hover:bg-ink-raised"
              >
                <span
                  className="g-step-node"
                  data-on={i < idx ? 'true' : undefined}
                  data-current={current ? 'true' : undefined}
                />
                <span
                  className={cn(
                    'text-center text-[11px] leading-tight font-bold sm:text-[11.5px]',
                    current
                      ? 'text-mint'
                      : i < idx
                        ? 'text-on-ink'
                        : 'text-on-ink-2 group-hover:text-on-ink',
                  )}
                >
                  {STAGE_LABEL[stage]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-1.5 flex justify-end">
        {lost ? (
          <p className="flex w-full items-center justify-between rounded-xl bg-[#3a2024] px-3 py-2 text-[13px] text-[#ffc9c2]">
            <span>
              <span className="font-bold">Lost</span> — {lead.lostReason}
            </span>
            <button
              type="button"
              onClick={() => {
                m.changeStage(lead, 'contacted');
              }}
              className="font-bold text-white underline underline-offset-4"
            >
              Reopen
            </button>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              m.setLostLead(lead);
            }}
            className="rounded-full px-2 py-0.5 text-[12.5px] font-semibold text-on-ink-2 hover:text-[#ffb4aa]"
          >
            Mark as lost
          </button>
        )}
      </div>
    </div>
  );
}

function Panel({ lead, m }: { lead: Lead; m: LeadsModel }) {
  const { state, dispatch } = useLab();
  const actions = useShellActions();
  const notify = useToast();
  const [tab, setTab] = useState('activity');
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const timeline = timelineFor(state.data, lead.id);
  const payments = paymentsFor(state.data, lead.id);
  const verified = sumAmounts(payments.filter((p) => p.status === 'verified'));
  const awaiting = payments.filter((p) => p.status === 'recorded');
  const suggestion = timeline.find((a) => a.suggestion?.status === 'open');
  const now = state.now;
  const who = lead.latinName ?? lead.name;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const signals = m.signals.get(lead.id);
  const waiting = lead.awaitingReplySince !== undefined;

  return (
    <SheetContent
      label={`Details for ${who}`}
      overlayClassName="bg-[rgb(17_28_45/0.45)]"
      className="overflow-hidden bg-canvas sm:inset-y-3 sm:right-3 sm:w-[520px] sm:rounded-[26px] sm:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
    >
      {/* Ink header: who, how to reach them, where they are */}
      <div className="on-ink bg-ink px-5 pt-4 pb-4 text-on-ink sm:px-6">
        <div className="flex items-start gap-3">
          <LeadAvatar lead={lead} size={44} className="ring-[3px] ring-ink-raised" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="b-heading truncate text-[21px] leading-tight text-white">
              {lead.name}
            </SheetTitle>
            <p className="truncate text-[13px] text-on-ink-2">
              {lead.latinName ? `${lead.latinName} · ` : ''}
              {lead.phone} · {lead.area}
            </p>
          </div>
          <SheetClose
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-raised text-on-ink hover:bg-[#23334d]"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </SheetClose>
        </div>
        {signals && signals.reasons.length > 0 ? (
          <p className="mt-3 text-[13px] text-on-ink-2">
            <span className="font-semibold text-mint">Why it looks promising:</span>{' '}
            {signals.reasons.join(' · ')}
          </p>
        ) : null}
        <ThreadStepper lead={lead} m={m} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Next step and quick actions */}
        {lead.stage !== 'lost' && (lead.next ?? waiting) ? (
          <div className="mx-5 mt-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:mx-6">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink-3">Up next</p>
                <p className="b-heading text-[16px] leading-snug">
                  {lead.next?.label ?? 'Reply to the customer'}
                </p>
                <p
                  className={cn(
                    'text-[13px] font-semibold',
                    waiting || due?.tone === 'today'
                      ? 'text-attention'
                      : due?.tone === 'overdue'
                        ? 'text-critical'
                        : 'text-ink-3',
                  )}
                >
                  {waiting && lead.awaitingReplySince !== undefined
                    ? `Waiting ${waited(lead.awaitingReplySince, now)} for a reply`
                    : due?.label}
                </p>
              </div>
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
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-bold text-white hover:bg-ink-2"
                >
                  <Icon name="check" size={15} />
                  Done
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="mx-5 mt-3 flex flex-wrap gap-2 sm:mx-6">
          {(
            [
              {
                label: 'Log a call',
                icon: 'phone',
                run: () => {
                  dispatch({ type: 'logCall', leadId: lead.id, text: 'Called the customer.' });
                  notify({ title: 'Call logged' });
                },
              },
              {
                label: 'Add a note',
                icon: 'note',
                run: () => {
                  setTab('activity');
                  requestAnimationFrame(() => {
                    document.getElementById('panel-note')?.querySelector('textarea')?.focus();
                  });
                },
              },
              {
                label: 'Record a payment',
                icon: 'payments',
                run: () => {
                  actions.openRecordPayment(lead.id);
                },
              },
            ] as const
          ).map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.run}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[13px] font-bold text-ink shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1.5px_var(--ink)]"
            >
              <Icon name={a.icon} size={15} className="text-growth" />
              {a.label}
            </button>
          ))}
        </div>

        {/* Assistant proposal */}
        {suggestion?.suggestion ? (
          <div
            className="mx-5 mt-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:mx-6"
            data-testid="suggestion"
          >
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink-3">
              <span className="grid size-6 place-items-center rounded-lg bg-ink text-mint">
                <Icon name="assistant" size={14} />
              </span>
              Assistant suggests · {ago(suggestion.at, now)}
            </p>
            <p className="mt-2 text-[15px] text-ink">
              Move to <span className="font-bold">{STAGE_LABEL[suggestion.suggestion.to]}</span>
            </p>
            <p className="mt-0.5 text-[13.5px] text-ink-2">{suggestion.suggestion.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                className="lab-primary h-9 rounded-full px-4 text-[13px] font-bold"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'dismissSuggestion', activityId: suggestion.id });
                }}
                className="h-9 rounded-full px-3 text-[13px] font-bold text-ink-2 hover:bg-canvas"
              >
                Dismiss
              </button>
              <span className="text-[12px] text-ink-3">Nothing changes until you apply it.</span>
            </div>
          </div>
        ) : null}

        {/* Key facts: always visible, no tab switch needed */}
        <dl
          className="mx-5 mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-[13px] shadow-[0_0_0_1px_var(--line)] sm:mx-6"
          data-testid="lead-facts"
        >
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">Value</dt>
            <dd className="b-display text-[18px]">{lead.value ? inr(lead.value) : 'Not quoted'}</dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">{lead.eventLabel}</dt>
            <dd className="font-semibold">
              {lead.eventDate !== undefined ? fullDate(lead.eventDate) : 'Date not set'}
              {lead.eventDate !== undefined ? (
                <span className="block text-[12px] font-normal text-ink-3">
                  {inDays(lead.eventDate, now)}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">Came from</dt>
            <dd className="font-semibold">
              <Icon
                name={SOURCE_ICON[lead.source]}
                size={13}
                className="mr-1 inline -translate-y-px text-ink-3"
              />
              {SOURCES[lead.source].label}
              {lead.sourceDetail ? (
                <span className="block text-[12px] font-normal text-ink-3">
                  {lead.sourceDetail}
                </span>
              ) : null}
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">Interested in</dt>
            <dd className="font-semibold">
              {SERVICES[lead.service].label}
              <span className="block text-[12px] font-normal text-ink-3">
                First enquiry {weekdayDayMonth(lead.createdAt)}
              </span>
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">Owner</dt>
            <dd className="mt-0.5">
              <OwnerMenu lead={lead} triggerClassName="h-8 rounded-full" />
            </dd>
          </div>
          <div className="bg-surface px-4 py-3">
            <dt className="text-[12px] text-ink-3">Payments</dt>
            <dd className="font-semibold">
              {payments.length === 0 ? (
                'None yet'
              ) : (
                <>
                  <span className="text-verified">{inr(verified)} verified</span>
                  {awaiting.length > 0 ? (
                    <span className="block text-[12px] font-semibold text-attention">
                      {inr(sumAmounts(awaiting))} to verify
                    </span>
                  ) : null}
                </>
              )}
            </dd>
          </div>
        </dl>

        <Tabs.Root value={tab} onValueChange={setTab} className="mx-5 mt-5 pb-10 sm:mx-6">
          <Tabs.List
            aria-label="Lead history"
            className="inline-flex rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]"
          >
            {(
              [
                ['activity', `Activity · ${timeline.length.toString()}`],
                ['payments', `Payments · ${payments.length.toString()}`],
              ] as const
            ).map(([value, label]) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="h-9 rounded-full px-4 text-[13px] font-bold text-ink-2 data-[state=active]:bg-ink data-[state=active]:text-white"
              >
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="activity" className="mt-4 outline-none">
            <div id="panel-note">
              <NoteComposer leadId={lead.id} buttonClassName="rounded-full px-4" />
            </div>
            <ol className="g-timeline mt-5 grid gap-3" data-testid="timeline">
              {timeline.map((activity) => {
                const fromCustomer = activity.by === 'customer';
                return (
                  <li key={activity.id} className="relative flex gap-3">
                    <span
                      className={cn(
                        'relative z-[1] grid size-8 shrink-0 place-items-center rounded-xl ring-4 ring-canvas',
                        fromCustomer
                          ? 'bg-mint-soft text-growth'
                          : activity.kind === 'payment'
                            ? 'bg-verified-soft text-verified'
                            : 'bg-surface text-ink-2 shadow-[0_0_0_1px_var(--line)]',
                      )}
                    >
                      <Icon name={activityIcon(activity)} size={15} />
                    </span>
                    <div
                      className={cn(
                        'min-w-0 flex-1',
                        fromCustomer
                          ? 'rounded-2xl bg-surface px-3.5 py-2.5 shadow-[0_0_0_1px_var(--line)]'
                          : 'pt-1',
                      )}
                    >
                      <p className="text-[13.5px] leading-relaxed text-ink">
                        {activity.text}
                        {activity.amount && activity.kind === 'quotation' ? (
                          <span className="tnum font-bold"> · {inr(activity.amount)}</span>
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
          </Tabs.Content>

          <Tabs.Content value="payments" className="mt-4 outline-none">
            {payments.length === 0 ? (
              <p className="rounded-2xl bg-surface p-4 text-[13.5px] text-ink-3 shadow-[0_0_0_1px_var(--line)]">
                No payments yet. Use Record a payment when money arrives outside Krinly.
              </p>
            ) : (
              <ul className="divide-y divide-line-soft rounded-2xl bg-surface px-4 shadow-[0_0_0_1px_var(--line)]">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3 text-[13.5px]">
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{p.kind}</span>
                      <span className="block text-[12px] text-ink-3">
                        {p.method} · {p.reference} · {weekdayDayMonth(p.recordedAt)}
                      </span>
                    </span>
                    {p.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-verified">
                        <Icon name="seal" size={14} />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifying(p);
                        }}
                        className="h-8 rounded-full bg-attention-soft px-3 text-[12.5px] font-bold text-attention"
                      >
                        Verify
                      </button>
                    )}
                    <span className="tnum w-20 text-right font-bold">{inr(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Tabs.Content>
        </Tabs.Root>
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
