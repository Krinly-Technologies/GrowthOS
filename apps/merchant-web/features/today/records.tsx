'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import {
  Dialog,
  DialogContent,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@krinly/ui/components/overlay';
import { ListRow } from '@krinly/ui/components/table';
import { InfoGrid } from '@krinly/ui/patterns/signals';
import { Money, VerificationStatus } from '@krinly/ui/patterns/money';
import type { ReactNode } from 'react';
import { STAGE_LABEL, type Lead, type Payment, type SourceId } from '@/lib/preview/domain';
import { ago, dueInfo, fullDate, inDays, inr, plural, time, waited } from '@/lib/preview/format';
import { SERVICES, SOURCES, TEAM } from '@/lib/preview/sample/scenario';
import type { AttentionGroup, TodayModel } from '@/lib/preview/today-model';

const GROUP_COPY: Record<AttentionGroup, { title: string; description: string }> = {
  reply: {
    title: 'Waiting for your reply',
    description: 'Oldest first. Replying happens in the conversation, which arrives with Inbox.',
  },
  ready: {
    title: 'Ready to book',
    description: 'They have a quotation and said yes. Collect the advance to confirm the date.',
  },
  followup: {
    title: 'Follow-ups due',
    description: 'Something you said you would do, due today or earlier.',
  },
  appointments: {
    title: 'Today’s appointments',
    description: 'Trials, consultations and event-day bookings for today.',
  },
};

/** A panel shaped like the shared sheet: title, description, scrolling body. */
function Panel({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <SheetTitle className="font-display text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>
          {description ? <p className="mt-1 text-[13px] text-ink-3">{description}</p> : null}
        </div>
        <SheetClose
          aria-label="Close"
          className="-mt-1 -mr-1 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
        >
          <Icon name="close" size={18} />
        </SheetClose>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
    </>
  );
}

function leadSubtitle(lead: Lead, group: AttentionGroup, now: number): string {
  if (group === 'reply' && lead.awaitingReplySince !== undefined)
    return `Waiting ${waited(lead.awaitingReplySince, now)} · ${SOURCES[lead.source].label}`;
  if (group === 'followup' && lead.next)
    return `${lead.next.label} · ${dueInfo(lead.next.due, now).label}`;
  return `${SERVICES[lead.service].label} · ${STAGE_LABEL[lead.stage]}`;
}

/** The people behind one queue item. Read-only: lead management arrives with the CRM phase. */
export function LeadGroupSheet({
  group,
  model,
  onOpenLead,
  onClose,
}: {
  group: AttentionGroup | null;
  model: TodayModel;
  onOpenLead: (leadId: string) => void;
  onClose: () => void;
}) {
  const copy = group ? GROUP_COPY[group] : null;
  const leads: Lead[] =
    group === 'reply'
      ? model.reply
      : group === 'ready'
        ? model.ready
        : group === 'followup'
          ? model.followUps
          : group === 'appointments'
            ? model.appointments.map((a) => a.lead)
            : [];

  return (
    <Sheet
      open={group !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {copy ? (
        <SheetContent variant="floating" width="md" label={copy.description}>
          <Panel title={copy.title} description={copy.description}>
            <ul className="divide-y divide-line-soft">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <ListRow
                    className="px-0"
                    leading={<Avatar name={lead.latinName ?? lead.name} seed={lead.id} />}
                    title={lead.latinName ?? lead.name}
                    subtitle={group ? leadSubtitle(lead, group, model.now) : ''}
                    trailing={
                      <Button
                        variant="outline"
                        size="sm"
                        shape="pill"
                        onClick={() => {
                          onOpenLead(lead.id);
                        }}
                      >
                        Open
                        <span className="sr-only">: {lead.latinName ?? lead.name}</span>
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          </Panel>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

/** One customer's record, as far as Today needs it. */
export function LeadSheet({
  lead,
  model,
  onClose,
}: {
  lead: Lead | undefined;
  model: TodayModel;
  onClose: () => void;
}) {
  const payments = model.allPayments.filter((p) => p.leadId === lead?.id);
  return (
    <Sheet
      open={lead !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {lead ? (
        <SheetContent variant="floating" width="md" label={`Details for ${lead.name}`}>
          <Panel
            title={lead.latinName ?? lead.name}
            description={`${SERVICES[lead.service].label} · ${lead.area}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={lead.stage === 'lost' ? 'neutral' : 'brand'}>
                {STAGE_LABEL[lead.stage]}
              </Badge>
              <Badge tone="outline">{SOURCES[lead.source].label}</Badge>
            </div>
            <InfoGrid
              className="mt-5"
              items={[
                { label: 'Phone', value: lead.phone },
                { label: 'Owner', value: TEAM[lead.owner].name },
                {
                  label: lead.eventLabel,
                  value:
                    lead.eventDate !== undefined
                      ? `${fullDate(lead.eventDate)} · ${inDays(lead.eventDate, model.now)}`
                      : 'No date yet',
                },
                { label: 'Quoted value', value: inr(lead.value) },
                { label: 'First enquired', value: ago(lead.createdAt, model.now) },
                {
                  label: 'Next step',
                  value: lead.next
                    ? `${lead.next.label} · ${dueInfo(lead.next.due, model.now).label}`
                    : 'Nothing scheduled',
                },
              ]}
            />
            {payments.length > 0 ? (
              <section className="mt-6">
                <h3 className="text-[13px] font-bold text-ink-3">Payments</h3>
                <ul className="mt-2 divide-y divide-line-soft">
                  {payments.map((payment) => (
                    <li key={payment.id} className="flex items-center gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {payment.kind} · {payment.method}
                        </span>
                        <VerificationStatus
                          verified={payment.status === 'verified'}
                          verifiedLabel={`Verified ${payment.verifiedAt !== undefined ? ago(payment.verifiedAt, model.now).toLowerCase() : ''}`}
                          unverifiedLabel="Recorded, not verified"
                        />
                      </span>
                      <Money amount={payment.amount} className="text-sm font-semibold" />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <p className="mt-6 rounded-lg bg-canvas px-3.5 py-3 text-[12.5px] text-ink-3">
              Messaging, notes and stage changes live in Inbox and Leads, which are later phases.
              This panel is read-only.
            </p>
          </Panel>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

/** Verified payments behind the headline figure. */
export function VerifiedPaymentsSheet({
  open,
  model,
  onClose,
}: {
  open: boolean;
  model: TodayModel;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {open ? (
        <SheetContent variant="floating" width="md" label="Payments behind this figure">
          <Panel
            title={`Verified ${model.range.phrase}`}
            description={`${plural(model.revenue.payments.length, 'payment')} adding up to ${inr(model.revenue.total)}.`}
          >
            <ul className="divide-y divide-line-soft">
              {model.revenue.payments.map((payment) => {
                const lead = model.byId.get(payment.leadId);
                return (
                  <li key={payment.id}>
                    <ListRow
                      className="px-0"
                      title={lead?.latinName ?? lead?.name ?? 'Unknown customer'}
                      subtitle={`${payment.kind} · ${payment.method} · ${payment.reference}`}
                      trailing={<Money amount={payment.amount} className="text-sm font-semibold" />}
                    />
                  </li>
                );
              })}
            </ul>
          </Panel>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

/** How one source performed, and who came from it. */
export function SourceSheet({
  source,
  model,
  onOpenLead,
  onClose,
}: {
  source: SourceId | null;
  model: TodayModel;
  onOpenLead: (leadId: string) => void;
  onClose: () => void;
}) {
  const row = model.sources.find((s) => s.source === source);
  const cohort = source
    ? model.journey.cohort.filter((lead) => lead.source === source)
    : ([] as Lead[]);
  return (
    <Sheet
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {source && row ? (
        <SheetContent variant="floating" width="md" label={`${SOURCES[source].label} in detail`}>
          <Panel title={SOURCES[source].label} description={`Figures for ${model.range.phrase}.`}>
            <InfoGrid
              columns={2}
              items={[
                { label: 'New enquiries', value: row.enquiries },
                { label: 'Of those, booked', value: row.booked },
                { label: 'Verified revenue', value: inr(row.revenue) },
                { label: 'Paying customers', value: row.customers },
              ]}
            />
            <h3 className="mt-6 text-[13px] font-bold text-ink-3">
              {plural(cohort.length, 'person', 'people')} who first enquired in this period
            </h3>
            <ul className="mt-2 divide-y divide-line-soft">
              {cohort.map((lead) => (
                <li key={lead.id}>
                  <ListRow
                    className="px-0"
                    leading={<Avatar name={lead.latinName ?? lead.name} seed={lead.id} />}
                    title={lead.latinName ?? lead.name}
                    subtitle={`${STAGE_LABEL[lead.stage]} · enquired ${ago(lead.createdAt, model.now)}`}
                    trailing={
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="pill"
                        onClick={() => {
                          onOpenLead(lead.id);
                        }}
                      >
                        Open
                        <span className="sr-only">: {lead.latinName ?? lead.name}</span>
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
            {cohort.length === 0 ? (
              <p className="mt-2 text-sm text-ink-3">Nobody new enquired from here.</p>
            ) : null}
          </Panel>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

/* ── Verifying payments ──────────────────────────────────────────────────── */

/** The list of payments waiting for a check. */
export function ReviewPaymentsDialog({
  open,
  model,
  onPick,
  onClose,
}: {
  open: boolean;
  model: TodayModel;
  onPick: (payment: Payment) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title="Payments to verify"
        description="Recorded by your team. Check each one arrived, then verify it — only verified payments count as revenue."
      >
        <ul className="divide-y divide-line-soft">
          {model.awaiting.payments.map((payment) => {
            const lead = model.byId.get(payment.leadId);
            return (
              <li key={payment.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {lead?.latinName ?? lead?.name ?? 'Unknown customer'}
                  </p>
                  <p className="text-[12.5px] text-ink-3">
                    {payment.kind} · {payment.method} · recorded{' '}
                    {ago(payment.recordedAt, model.now).toLowerCase()} by{' '}
                    {TEAM[payment.recordedBy].firstName}
                  </p>
                </div>
                <Money amount={payment.amount} className="text-sm font-semibold" />
                <Button
                  variant="brand"
                  size="sm"
                  shape="pill"
                  onClick={() => {
                    onPick(payment);
                  }}
                >
                  Verify
                  <span className="sr-only">
                    : {inr(payment.amount)} from {lead?.latinName ?? lead?.name ?? 'this customer'}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** Confirming one payment arrived. */
export function VerifyPaymentDialog({
  payment,
  model,
  onConfirm,
  onClose,
}: {
  payment: Payment | null;
  model: TodayModel;
  onConfirm: (payment: Payment) => void;
  onClose: () => void;
}) {
  const lead = payment ? model.byId.get(payment.leadId) : undefined;
  return (
    <Dialog
      open={payment !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {payment ? (
        <DialogContent
          title={`Verify ${inr(payment.amount)}?`}
          description="Confirm the money reached your account. Once verified it counts as revenue for the day it was verified."
          footer={
            <>
              <Button variant="ghost" shape="pill" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="brand"
                shape="pill"
                onClick={() => {
                  onConfirm(payment);
                }}
              >
                Yes, it arrived
              </Button>
            </>
          }
        >
          <InfoGrid
            items={[
              { label: 'Customer', value: lead?.latinName ?? lead?.name ?? 'Unknown' },
              { label: 'Kind', value: payment.kind },
              { label: 'Method', value: payment.method },
              { label: 'Reference', value: payment.reference },
              {
                label: 'Recorded',
                value: `${time(payment.recordedAt)} · ${TEAM[payment.recordedBy].name}`,
              },
              { label: 'Amount', value: inr(payment.amount) },
            ]}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
