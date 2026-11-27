'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { type ReactNode, useState } from 'react';

/** A free-text reason before a destructive or reversing action — never silently dropped. */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  fieldLabel = 'Reason',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  fieldLabel?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title={title}
        description={description}
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              shape="pill"
              onClick={() => {
                onConfirm(reason.trim() || 'No reason given');
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <Field label={fieldLabel}>
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
