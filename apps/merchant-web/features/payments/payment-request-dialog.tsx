'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import { bookingStatus, type Lead, type PaymentKind } from '@/lib/preview/domain';
import { bookingsFor } from '@/lib/preview/selectors';
import type { LabData } from '@/lib/preview/domain';

const KINDS: PaymentKind[] = ['Advance', 'Balance', 'Full payment'];

/** Raise a payment request against a customer — never counts as collected or verified by itself. */
export function PaymentRequestDialog({
  open,
  leads,
  data,
  onSave,
  onClose,
}: {
  open: boolean;
  leads: readonly Lead[];
  data: LabData;
  onSave: (leadId: string, amount: number, kind: PaymentKind, bookingId?: string) => void;
  onClose: () => void;
}) {
  const [leadId, setLeadId] = useState(leads[0]?.id ?? '');
  const [bookingId, setBookingId] = useState<string>('');
  const [amount, setAmount] = useState(0);
  const [kind, setKind] = useState<PaymentKind>('Advance');
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLeadId(leads[0]?.id ?? '');
      setBookingId('');
      setAmount(0);
      setKind('Advance');
    }
  }

  const bookings = bookingsFor(data, leadId).filter((b) => bookingStatus(b) !== 'cancelled');
  const valid = leadId !== '' && amount > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title="Request a payment"
        description="Simulated — the customer isn't actually notified, and this never counts as collected."
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
                onSave(leadId, amount, kind, bookingId || undefined);
                onClose();
              }}
            >
              Send request
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Customer">
            <Select
              value={leadId}
              onChange={(e) => {
                setLeadId(e.target.value);
                setBookingId('');
              }}
            >
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.latinName ?? lead.name} · {lead.phone}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Booking" hint="Optional">
            <Select
              value={bookingId}
              onChange={(e) => {
                setBookingId(e.target.value);
              }}
            >
              <option value="">Not tied to a booking</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" hint="In rupees">
            <InputGroup
              prefix="₹"
              type="number"
              min={0}
              value={amount || ''}
              onChange={(e) => {
                setAmount(Math.max(0, Number(e.target.value) || 0));
              }}
            />
          </Field>
          <Field label="Kind">
            <Select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as PaymentKind);
              }}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
