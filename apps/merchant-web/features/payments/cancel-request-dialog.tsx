'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import type { Payment } from '@/lib/preview/domain';

/** Close out a payment request that didn't come through — cancelled by the merchant, or failed. */
export function CancelRequestDialog({
  payment,
  onConfirm,
  onClose,
}: {
  payment: Payment | null;
  onConfirm: (paymentId: string, reason: string, outcome: 'cancelled' | 'failed') => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(payment !== null);

  if ((payment !== null) !== wasOpen) {
    setWasOpen(payment !== null);
    if (payment) setReason('');
  }

  return (
    <Dialog
      open={payment !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title="Close this payment request"
        description="Choose whether it was cancelled or failed, with a short reason."
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Keep it open
            </Button>
            <Button
              variant="outline"
              shape="pill"
              onClick={() => {
                if (payment) onConfirm(payment.id, reason.trim() || 'No reason given', 'cancelled');
                onClose();
              }}
            >
              Mark cancelled
            </Button>
            <Button
              variant="destructive"
              shape="pill"
              onClick={() => {
                if (payment) onConfirm(payment.id, reason.trim() || 'No reason given', 'failed');
                onClose();
              }}
            >
              Mark failed
            </Button>
          </>
        }
      >
        <Field label="Reason">
          <Input
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
            }}
            autoFocus
          />
        </Field>
      </DialogContent>
    </Dialog>
  );
}
