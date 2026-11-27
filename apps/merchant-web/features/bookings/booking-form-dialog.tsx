'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import type { Appointment } from '@/lib/preview/selectors';
import type { Booking, Lead, MemberId } from '@/lib/preview/domain';
import type { BookingDraft } from '@/lib/preview/store';
import { MEMBER_IDS, TEAM } from '@/lib/preview/sample/scenario';

const KINDS: Booking['kind'][] = ['trial', 'consultation', 'event'];
const KIND_LABEL: Record<Booking['kind'], string> = {
  trial: 'Trial',
  consultation: 'Consultation',
  event: 'Event',
};

function toInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function draftFrom(appointment: Appointment | null, now: number): BookingDraft {
  const booking = appointment?.booking;
  return {
    kind: booking?.kind ?? 'trial',
    title: booking?.title ?? 'Appointment',
    start: booking?.start ?? now + 24 * 60 * 60_000,
    minutes: booking?.minutes ?? 60,
    with: booking?.with ?? 'lakshmi',
    value: booking?.value,
  };
}

/**
 * Create or edit a booking. Creating from the Bookings workspace needs a customer; editing an
 * existing booking already has one. Scheduling is simulated — it never checks real availability.
 */
export function BookingFormDialog({
  open,
  appointment,
  leads,
  now,
  onSave,
  onClose,
}: {
  open: boolean;
  /** null when creating fresh from the workspace. */
  appointment: Appointment | null;
  /** Every lead, for the customer picker when creating. */
  leads: readonly Lead[];
  now: number;
  onSave: (leadId: string, draft: BookingDraft) => void;
  onClose: () => void;
}) {
  const [leadId, setLeadId] = useState(appointment?.lead.id ?? leads[0]?.id ?? '');
  const [draft, setDraft] = useState<BookingDraft>(() => draftFrom(appointment, now));
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLeadId(appointment?.lead.id ?? leads[0]?.id ?? '');
      setDraft(draftFrom(appointment, now));
    }
  }

  const valid = leadId !== '' && draft.title.trim() !== '' && draft.minutes > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title={appointment ? 'Edit booking' : 'New booking'}
        description="Simulated scheduling — not connected to real availability."
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="brand"
              shape="pill"
              disabled={!valid}
              onClick={() => {
                onSave(leadId, draft);
                onClose();
              }}
            >
              {appointment ? 'Save changes' : 'Create booking'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {appointment ? (
            <Field label="Customer" className="sm:col-span-2">
              <Input value={appointment.lead.latinName ?? appointment.lead.name} disabled />
            </Field>
          ) : (
            <Field label="Customer" className="sm:col-span-2">
              <Select
                value={leadId}
                onChange={(e) => {
                  setLeadId(e.target.value);
                }}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.latinName ?? lead.name} · {lead.phone}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Kind">
            <Select
              value={draft.kind}
              onChange={(e) => {
                setDraft({ ...draft, kind: e.target.value as Booking['kind'] });
              }}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input
              value={draft.title}
              onChange={(e) => {
                setDraft({ ...draft, title: e.target.value });
              }}
            />
          </Field>
          <Field label="Date & time">
            <Input
              type="datetime-local"
              value={toInputValue(draft.start)}
              onChange={(e) => {
                const ms = new Date(e.target.value).getTime();
                if (!Number.isNaN(ms)) setDraft({ ...draft, start: ms });
              }}
            />
          </Field>
          <Field label="Duration" hint="Minutes">
            <InputGroup
              prefix="min"
              type="number"
              min={15}
              step={15}
              value={draft.minutes}
              onChange={(e) => {
                setDraft({ ...draft, minutes: Math.max(15, Number(e.target.value) || 60) });
              }}
            />
          </Field>
          <Field label="With">
            <Select
              value={draft.with}
              onChange={(e) => {
                setDraft({ ...draft, with: e.target.value as MemberId });
              }}
            >
              {MEMBER_IDS.map((id) => (
                <option key={id} value={id}>
                  {TEAM[id].name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Booking value" hint="Optional — in rupees, defaults to the lead's value">
            <InputGroup
              prefix="₹"
              type="number"
              min={0}
              value={draft.value ?? ''}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDraft({ ...draft, value: e.target.value === '' ? undefined : value });
              }}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
