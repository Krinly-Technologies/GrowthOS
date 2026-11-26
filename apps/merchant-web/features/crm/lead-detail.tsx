'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  Tooltip,
  TooltipProvider,
} from '@krinly/ui/components/overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@krinly/ui/components/tabs';
import { InfoGrid } from '@krinly/ui/patterns/signals';
import { ActivityTimeline } from '@krinly/ui/patterns/timeline';
import { Money, VerificationStatus } from '@krinly/ui/patterns/money';
import { ThreadStepper } from '@krinly/ui/patterns/thread';
import { cn } from '@krinly/ui/lib/utils';
import { useState } from 'react';
import { DAY, endOfDay } from '@/lib/preview/clock';
import {
  type Lead,
  type MemberId,
  type NextActionKind,
  PIPELINE,
  type Stage,
  STAGE_LABEL,
  stageIndex,
} from '@/lib/preview/domain';
import {
  dueInfo,
  fullDate,
  inDays,
  inr,
  time,
  waited,
  weekdayDayMonth,
} from '@/lib/preview/format';
import { paymentsFor, sumAmounts, timelineFor } from '@/lib/preview/selectors';
import { SERVICES, SOURCES } from '@/lib/preview/sample/scenario';
import type { CrmModel } from '@/lib/preview/crm-model';
import { activityIcon, actorName, channelText, SOURCE_ICON } from './lead-bits';
import { NoteComposer } from './note-composer';
import { OwnerMenu } from './owner-menu';

/** The customer's record: identity, journey, next step, and the full activity history. */
export function LeadDetailSheet({
  lead,
  model,
  onClose,
  onEdit,
  onChangeStage,
  onReopen,
  onLost,
  onAssignOwner,
  onAddNote,
  onLogCall,
  onCompleteFollowUp,
  onSetFollowUp,
}: {
  lead: Lead | undefined;
  model: CrmModel;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  onChangeStage: (lead: Lead, stage: Stage) => void;
  onReopen: (lead: Lead) => void;
  onLost: (lead: Lead) => void;
  onAssignOwner: (lead: Lead, owner: MemberId) => void;
  onAddNote: (lead: Lead, text: string) => void;
  onLogCall: (lead: Lead) => void;
  onCompleteFollowUp: (lead: Lead) => void;
  onSetFollowUp: (lead: Lead, label: string, due: number, kind: NextActionKind) => void;
}) {
  return (
    <Sheet
      open={lead !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {lead ? (
        <Panel
          lead={lead}
          model={model}
          onEdit={onEdit}
          onChangeStage={onChangeStage}
          onReopen={onReopen}
          onLost={onLost}
          onAssignOwner={onAssignOwner}
          onAddNote={onAddNote}
          onLogCall={onLogCall}
          onCompleteFollowUp={onCompleteFollowUp}
          onSetFollowUp={onSetFollowUp}
        />
      ) : null}
    </Sheet>
  );
}

function Panel({
  lead,
  model,
  onEdit,
  onChangeStage,
  onReopen,
  onLost,
  onAssignOwner,
  onAddNote,
  onLogCall,
  onCompleteFollowUp,
  onSetFollowUp,
}: {
  lead: Lead;
  model: CrmModel;
  onEdit: (lead: Lead) => void;
  onChangeStage: (lead: Lead, stage: Stage) => void;
  onReopen: (lead: Lead) => void;
  onLost: (lead: Lead) => void;
  onAssignOwner: (lead: Lead, owner: MemberId) => void;
  onAddNote: (lead: Lead, text: string) => void;
  onLogCall: (lead: Lead) => void;
  onCompleteFollowUp: (lead: Lead) => void;
  onSetFollowUp: (lead: Lead, label: string, due: number, kind: NextActionKind) => void;
}) {
  const [tab, setTab] = useState('activity');
  const { now, data } = model;
  const timeline = timelineFor(data, lead.id);
  const payments = paymentsFor(data, lead.id);
  const verified = sumAmounts(payments.filter((p) => p.status === 'verified'));
  const awaiting = payments.filter((p) => p.status === 'recorded');
  const who = lead.latinName ?? lead.name;
  const due = lead.next ? dueInfo(lead.next.due, now) : null;
  const signals = model.signals.get(lead.id);
  const waiting = lead.awaitingReplySince !== undefined;

  return (
    <SheetContent variant="floating" width="lg" label={`Details for ${who}`}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Avatar name={who} seed={lead.id} size={44} />
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate font-display text-lg font-semibold tracking-tight">
                {lead.name}
              </SheetTitle>
              <p className="truncate text-[13px] text-ink-3">
                {lead.latinName ? `${lead.latinName} · ` : ''}
                {lead.phone} · {lead.area}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => {
                onEdit(lead);
              }}
            >
              Edit
            </Button>
            <SheetClose
              aria-label="Close"
              className="-mt-1 -mr-1 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
            >
              <Icon name="close" size={18} />
            </SheetClose>
          </div>
          {signals && signals.reasons.length > 0 ? (
            <p className="mt-3 text-[13px] text-ink-2">
              <span className="font-semibold text-accent-strong">Why it looks promising:</span>{' '}
              {signals.reasons.join(' · ')}
            </p>
          ) : null}

          {lead.stage === 'lost' ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-critical-soft px-3.5 py-2.5 text-[13px]">
              <span>
                <span className="font-bold text-critical">Lost</span> — {lead.lostReason}
              </span>
              <Button
                variant="ghost"
                size="sm"
                shape="pill"
                onClick={() => {
                  onReopen(lead);
                }}
              >
                Reopen
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <ThreadStepper
                steps={PIPELINE.map((s) => ({ id: s, label: STAGE_LABEL[s] }))}
                current={stageIndex(lead.stage)}
                label="Stage"
                onSelect={(step) => {
                  const stage = step.id as Stage;
                  onChangeStage(lead, stage);
                }}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onLost(lead);
                  }}
                  className="rounded-full px-2 py-0.5 text-[12.5px] font-semibold text-ink-3 hover:text-critical"
                >
                  Mark as lost
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {lead.stage !== 'lost' && (lead.next ?? waiting) ? (
            <div className="rounded-2xl bg-canvas p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-ink-3">Up next</p>
                  <p className="font-display text-base font-semibold leading-snug">
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
                  <Button
                    size="sm"
                    shape="pill"
                    onClick={() => {
                      onCompleteFollowUp(lead);
                    }}
                  >
                    <Icon name="check" size={15} />
                    Done
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <TooltipProvider>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                onClick={() => {
                  onLogCall(lead);
                }}
              >
                <Icon name="phone" size={15} />
                Log a call
              </Button>
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                onClick={() => {
                  setTab('activity');
                  requestAnimationFrame(() => {
                    document
                      .getElementById('crm-note-composer')
                      ?.querySelector('textarea')
                      ?.focus();
                  });
                }}
              >
                <Icon name="note" size={15} />
                Add a note
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" shape="pill">
                    <Icon name="clock" size={15} />
                    Set a follow-up
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(
                    [
                      { label: 'Tomorrow', days: 1 },
                      { label: 'In 3 days', days: 3 },
                      { label: 'Next week', days: 7 },
                    ] as const
                  ).map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onSelect={() => {
                        onSetFollowUp(
                          lead,
                          'Follow up',
                          endOfDay(now + option.days * DAY),
                          'follow_up',
                        );
                      }}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip content="Arrives with messaging — not built yet.">
                <span>
                  <Button variant="outline" size="sm" shape="pill" disabled>
                    <Icon name="message" size={15} />
                    Message
                  </Button>
                </span>
              </Tooltip>
              <Tooltip content="Arrives with Bookings — not built yet.">
                <span>
                  <Button variant="outline" size="sm" shape="pill" disabled>
                    <Icon name="calendar" size={15} />
                    Book a trial
                  </Button>
                </span>
              </Tooltip>
              <Tooltip content="Arrives with Payments — not built yet.">
                <span>
                  <Button variant="outline" size="sm" shape="pill" disabled>
                    <Icon name="payments" size={15} />
                    Collect payment
                  </Button>
                </span>
              </Tooltip>
            </div>
          </TooltipProvider>

          <InfoGrid
            className="mt-5 rounded-2xl bg-canvas p-4"
            columns={2}
            items={[
              { label: 'Value', value: lead.value ? inr(lead.value) : 'Not quoted' },
              {
                label: lead.eventLabel,
                value:
                  lead.eventDate !== undefined
                    ? `${fullDate(lead.eventDate)} (${inDays(lead.eventDate, now)})`
                    : 'Date not set',
              },
              {
                label: 'Came from',
                value: (
                  <>
                    <Icon
                      name={SOURCE_ICON[lead.source]}
                      size={13}
                      className="mr-1 inline -translate-y-px text-ink-3"
                    />
                    {SOURCES[lead.source].label}
                    {lead.sourceDetail ? (
                      <span className="block text-xs font-normal text-ink-3">
                        {lead.sourceDetail}
                      </span>
                    ) : null}
                  </>
                ),
              },
              {
                label: 'Interested in',
                value: (
                  <>
                    {SERVICES[lead.service].label}
                    <span className="block text-xs font-normal text-ink-3">
                      First enquiry {weekdayDayMonth(lead.createdAt)}
                    </span>
                  </>
                ),
              },
              {
                label: 'Owner',
                value: (
                  <OwnerMenu
                    owner={lead.owner}
                    onAssign={(owner) => {
                      onAssignOwner(lead, owner);
                    }}
                  />
                ),
              },
              {
                label: 'Payments',
                value:
                  payments.length === 0 ? (
                    'None yet'
                  ) : (
                    <>
                      <VerificationStatus verified verifiedLabel={`${inr(verified)} verified`} />
                      {awaiting.length > 0 ? (
                        <span className="block text-xs font-semibold text-attention">
                          {inr(sumAmounts(awaiting))} to verify
                        </span>
                      ) : null}
                    </>
                  ),
              },
            ]}
          />

          <Tabs value={tab} onValueChange={setTab} className="mt-5">
            <TabsList aria-label="Lead history">
              <TabsTrigger value="activity">Activity · {timeline.length}</TabsTrigger>
              <TabsTrigger value="payments">Payments · {payments.length}</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <div id="crm-note-composer">
                <NoteComposer
                  onAddNote={(text) => {
                    onAddNote(lead, text);
                  }}
                />
              </div>
              <ActivityTimeline
                className="mt-5"
                label={`Activity for ${who}`}
                items={timeline.map((activity) => ({
                  id: activity.id,
                  icon: activityIcon(activity),
                  title: (
                    <>
                      {activity.text}
                      {activity.amount && activity.kind === 'quotation' ? (
                        <span className="tnum font-bold"> · {inr(activity.amount)}</span>
                      ) : null}
                    </>
                  ),
                  meta: `${actorName(activity, lead)}${
                    activity.channel ? ` · ${channelText(activity)}` : ''
                  } · ${weekdayDayMonth(activity.at)}, ${time(activity.at)}`,
                  highlight: activity.by === 'customer',
                }))}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {payments.length === 0 ? (
                <p className="rounded-2xl bg-canvas p-4 text-[13.5px] text-ink-3">
                  No payments yet. Collecting payment arrives with the Payments module.
                </p>
              ) : (
                <ul className="divide-y divide-line-soft rounded-2xl bg-canvas px-4">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 py-3 text-[13.5px]">
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">{p.kind}</span>
                        <span className="block text-xs text-ink-3">
                          {p.method} · {p.reference} · {weekdayDayMonth(p.recordedAt)}
                        </span>
                      </span>
                      <VerificationStatus
                        verified={p.status === 'verified'}
                        unverifiedLabel="Awaiting verification"
                      />
                      <Money amount={p.amount} className="w-20 text-right font-bold" />
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SheetContent>
  );
}
