'use client';

import { Tabs } from 'radix-ui';
import { useState } from 'react';
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

export function LeadPanelB({ m }: { m: LeadsModel }) {
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

function Panel({ lead, m }: { lead: Lead; m: LeadsModel }) {
  const { state, dispatch } = useLab();
  const actions = useShellActions();
  const notify = useToast();
  const [tab, setTab] = useState('activity');
  const [verifying, setVerifying] = useState<Payment | null>(null);
  const timeline = timelineFor(state.data, lead.id);
  const payments = paymentsFor(state.data, lead.id);
  const suggestion = timeline.find((a) => a.suggestion?.status === 'open');
  const now = state.now;
  const who = lead.latinName ?? lead.name;
  const lost = lead.stage === 'lost';
  const idx = lost ? -1 : stageIndex(lead.stage);
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const signals = m.signals.get(lead.id);

  return (
    <SheetContent
      label={`Details for ${who}`}
      overlayClassName="bg-[rgb(17_28_45/0.45)]"
      className="overflow-hidden bg-canvas sm:inset-y-3 sm:right-3 sm:w-[520px] sm:rounded-[26px] sm:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]"
    >
      {/* Ink header */}
      <div className="on-ink bg-ink px-5 pt-4 pb-5 text-on-ink sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <SheetClose
            className="grid size-10 place-items-center rounded-full bg-ink-raised text-on-ink hover:bg-[#23334d]"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </SheetClose>
          <OwnerMenu
            lead={lead}
            triggerClassName="h-10 rounded-full border-ink-line bg-ink-raised px-3 text-on-ink hover:border-mint"
          />
        </div>
        <div className="mt-4 flex items-center gap-3.5">
          <LeadAvatar lead={lead} size={52} className="ring-[3px] ring-ink-raised" />
          <div className="min-w-0">
            <SheetTitle className="b-heading truncate text-[24px] leading-tight text-white">
              {lead.name}
            </SheetTitle>
            <p className="truncate text-[13.5px] text-on-ink-2">
              {lead.latinName ? `${lead.latinName} · ` : ''}
              {lead.phone} · {lead.area}
            </p>
          </div>
        </div>
        {signals && signals.reasons.length > 0 ? (
          <p className="mt-3 flex flex-wrap gap-1.5" aria-label="Why this lead looks promising">
            {signals.reasons.map((r) => (
              <span
                key={r}
                className="rounded-full bg-ink-raised px-2.5 py-1 text-[12px] font-semibold text-on-ink"
              >
                {r}
              </span>
            ))}
          </p>
        ) : null}

        {/* Segmented stage stepper */}
        <div className="mt-5" data-testid="stage-stepper">
          <div
            role="group"
            aria-label="Stage"
            className={cn(
              'grid grid-cols-5 gap-1 rounded-2xl bg-ink-raised p-1',
              lost && 'opacity-50',
            )}
          >
            {PIPELINE.map((stage, i) => {
              const current = i === idx;
              return (
                <button
                  key={stage}
                  type="button"
                  aria-pressed={current}
                  aria-label={
                    current
                      ? `${STAGE_LABEL[stage]}, current stage`
                      : `Move to ${STAGE_LABEL[stage]}`
                  }
                  onClick={() => {
                    m.changeStage(lead, stage);
                  }}
                  className={cn(
                    'flex min-h-11 items-center justify-center rounded-xl px-0.5 text-center text-[10.5px] leading-tight font-bold break-words transition-colors sm:px-1 sm:text-[11.5px]',
                    current
                      ? 'bg-mint text-ink'
                      : i < idx
                        ? 'text-mint hover:bg-[#23334d]'
                        : 'text-on-ink-2 hover:bg-[#23334d] hover:text-on-ink',
                  )}
                >
                  {i < idx ? (
                    <Icon
                      name="check"
                      size={13}
                      className="mr-0.5 hidden shrink-0 sm:block"
                      strokeWidth={2.4}
                    />
                  ) : null}
                  {STAGE_LABEL[stage]}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-end">
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-5 sm:px-6">
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
                label: 'Record payment',
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
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface px-2 py-3 text-[12.5px] font-bold text-ink shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1.5px_var(--ink)]"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-mint-soft text-growth">
                <Icon name={a.icon} size={18} />
              </span>
              {a.label}
            </button>
          ))}
        </div>

        {/* Next action */}
        {!lost && (lead.next ?? lead.awaitingReplySince !== undefined) ? (
          <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)] sm:mx-6">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-ink-3">Up next</p>
              <p className="b-heading text-[16px] leading-snug">
                {lead.next?.label ?? 'Reply to the customer'}
              </p>
              <p
                className={cn(
                  'text-[13px] font-semibold',
                  lead.awaitingReplySince !== undefined || due?.tone === 'today'
                    ? 'text-attention'
                    : due?.tone === 'overdue'
                      ? 'text-critical'
                      : 'text-ink-3',
                )}
              >
                {lead.awaitingReplySince !== undefined
                  ? `Waiting ${waited(lead.awaitingReplySince, now)}`
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
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[13.5px] font-bold text-white hover:bg-ink-2"
              >
                <Icon name="check" size={16} />
                Done
              </button>
            ) : null}
          </div>
        ) : null}

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

        <Tabs.Root value={tab} onValueChange={setTab} className="mx-5 mt-5 pb-10 sm:mx-6">
          <Tabs.List
            aria-label="Lead details"
            className="inline-flex rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]"
          >
            {(
              [
                ['activity', 'Activity'],
                ['details', 'Details'],
              ] as const
            ).map(([value, label]) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="h-9 rounded-full px-4 text-[13.5px] font-bold text-ink-2 data-[state=active]:bg-ink data-[state=active]:text-white"
              >
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="activity" className="mt-4 outline-none">
            <div id="panel-note">
              <NoteComposer leadId={lead.id} buttonClassName="rounded-full px-4" />
            </div>
            <ol className="mt-5 grid gap-3" data-testid="timeline">
              {timeline.map((activity) => {
                const fromCustomer = activity.by === 'customer';
                return (
                  <li key={activity.id} className={cn('flex gap-3', fromCustomer ? '' : '')}>
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-xl',
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
                        'min-w-0 flex-1 rounded-2xl px-3.5 py-2.5',
                        fromCustomer ? 'bg-surface shadow-[0_0_0_1px_var(--line)]' : '',
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

          <Tabs.Content value="details" className="mt-4 outline-none">
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 rounded-2xl bg-surface p-4 text-[13.5px] shadow-[0_0_0_1px_var(--line)]">
              <dt className="text-ink-3">Interested in</dt>
              <dd className="font-semibold">{SERVICES[lead.service].label}</dd>
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
              <dd className="b-display text-[18px]">
                {lead.value ? inr(lead.value) : 'Not quoted yet'}
              </dd>
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
            {payments.length > 0 ? (
              <section
                aria-labelledby="panel-payments"
                className="mt-4 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]"
              >
                <h3 id="panel-payments" className="b-heading text-[15px]">
                  Payments
                </h3>
                <ul className="mt-2 divide-y divide-line-soft">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">{p.kind}</span>
                        <span className="text-ink-3"> · {p.method}</span>
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
              </section>
            ) : null}
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
