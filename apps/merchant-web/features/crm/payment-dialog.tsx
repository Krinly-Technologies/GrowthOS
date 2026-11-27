'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import type { Lead, PaymentKind, PaymentMethod } from '@/lib/preview/domain';
import { inr } from '@/lib/preview/format';

const KINDS: PaymentKind[] = ['Advance', 'Balance', 'Full payment'];
const METHODS: PaymentMethod[] = ['UPI', 'Bank transfer', 'Card', 'Cash'];

/** Quick "Collect payment" from a lead's CRM record — request it, or record one already received. */
export function CollectPaymentDialog({
  lead,
  onRequest,
  onRecord,
  onClose,
}: {
  lead: Lead | null;
  onRequest: (leadId: string, amount: number, kind: PaymentKind) => void;
  onRecord: (
    leadId: string,
    amount: number,
    method: PaymentMethod,
    reference: string,
    kind: PaymentKind,
  ) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'request' | 'record'>('request');
  const [amount, setAmount] = useState(0);
  const [kind, setKind] = useState<PaymentKind>('Advance');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [reference, setReference] = useState('');
  const [wasOpen, setWasOpen] = useState(lead !== null);

  if ((lead !== null) !== wasOpen) {
    setWasOpen(lead !== null);
    if (lead) {
      setMode('request');
      setAmount(0);
      setKind('Advance');
      setMethod('UPI');
      setReference('');
    }
  }

  const valid = amount > 0 && (mode === 'request' || reference.trim() !== '');

  return (
    <Dialog
      open={lead !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title={lead ? `Collect payment from ${lead.latinName ?? lead.name}` : 'Collect payment'}
        description="Simulated payments — never connects to a real gateway or moves real money."
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
                if (!lead || !valid) return;
                if (mode === 'request') onRequest(lead.id, amount, kind);
                else onRecord(lead.id, amount, method, reference, kind);
                onClose();
              }}
            >
              {mode === 'request' ? `Request ${amount > 0 ? inr(amount) : ''}` : 'Record payment'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'request' ? 'brand' : 'outline'}
              size="sm"
              shape="pill"
              onClick={() => {
                setMode('request');
              }}
            >
              Request from customer
            </Button>
            <Button
              type="button"
              variant={mode === 'record' ? 'brand' : 'outline'}
              size="sm"
              shape="pill"
              onClick={() => {
                setMode('record');
              }}
            >
              Record one received
            </Button>
          </div>
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
          {mode === 'record' ? (
            <>
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
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
