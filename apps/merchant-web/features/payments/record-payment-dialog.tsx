'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import {
  bookingStatus,
  type LabData,
  type Lead,
  type Payment,
  type PaymentKind,
  type PaymentMethod,
} from '@/lib/preview/domain';
import { bookingsFor } from '@/lib/preview/selectors';

const KINDS: PaymentKind[] = ['Advance', 'Balance', 'Full payment'];
const METHODS: PaymentMethod[] = ['UPI', 'Bank transfer', 'Card', 'Cash'];

/**
 * Record a payment the team actually received — either fresh, or fulfilling an earlier request.
 * Recording never marks it verified by itself; that's a separate, deliberate step.
 */
export function RecordPaymentDialog({
  open,
  leads,
  data,
  /** Set when fulfilling an existing request — the customer and amount default from it. */
  request,
  onSave,
  onClose,
}: {
  open: boolean;
  leads: readonly Lead[];
  data: LabData;
  request?: Payment | null;
  onSave: (
    leadId: string,
    amount: number,
    method: PaymentMethod,
    reference: string,
    kind: PaymentKind,
    bookingId: string | undefined,
    requestId: string | undefined,
  ) => void;
  onClose: () => void;
}) {
  const [leadId, setLeadId] = useState(request?.leadId ?? leads[0]?.id ?? '');
  const [bookingId, setBookingId] = useState(request?.bookingId ?? '');
  const [amount, setAmount] = useState(request?.amount ?? 0);
  const [kind, setKind] = useState<PaymentKind>(request?.kind ?? 'Advance');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [reference, setReference] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLeadId(request?.leadId ?? leads[0]?.id ?? '');
      setBookingId(request?.bookingId ?? '');
      setAmount(request?.amount ?? 0);
      setKind(request?.kind ?? 'Advance');
      setMethod('UPI');
      setReference('');
    }
  }

  const bookings = bookingsFor(data, leadId).filter((b) => bookingStatus(b) !== 'cancelled');
  const valid = leadId !== '' && amount > 0 && reference.trim() !== '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title={request ? 'Record the payment received' : 'Record a payment'}
        description="A received, logged payment — it still needs verifying before it counts as revenue."
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
                onSave(
                  leadId,
                  amount,
                  method,
                  reference,
                  kind,
                  bookingId || undefined,
                  request?.id,
                );
                onClose();
              }}
            >
              Record payment
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Customer">
            {request ? (
              <Input value={leads.find((l) => l.id === leadId)?.name ?? ''} disabled />
            ) : (
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
            )}
          </Field>
          {!request ? (
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
          ) : null}
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
          <Field label="Method">
            <Select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value as PaymentMethod);
              }}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reference" hint="Transaction ID or note">
            <Input
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
              }}
            />
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
