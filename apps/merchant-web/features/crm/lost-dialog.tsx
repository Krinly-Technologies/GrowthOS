'use client';

import { Button } from '@krinly/ui/components/button';
import { Choice, Field } from '@krinly/ui/components/field';
import { Input } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import type { Lead } from '@/lib/preview/domain';
import { LOST_REASONS } from '@/lib/preview/sample/scenario';

const DEFAULT_REASON = 'Chose another studio';

/** Why a lead didn't convert, in words — never silently dropped from the pipeline. */
export function LostDialog({
  lead,
  onConfirm,
  onClose,
}: {
  lead: Lead | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>(DEFAULT_REASON);
  const [other, setOther] = useState('');
  const who = lead ? (lead.latinName ?? lead.name) : '';

  return (
    <Dialog
      open={lead !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {lead ? (
        <DialogContent
          title={`Mark ${who} as lost?`}
          description="This moves them out of the open pipeline. You can reopen a lost lead at any time."
          footer={
            <>
              <Button variant="ghost" shape="pill" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                shape="pill"
                onClick={() => {
                  onConfirm(reason === 'Other' ? other.trim() || 'No reason given' : reason);
                  setOther('');
                  setReason(DEFAULT_REASON);
                }}
              >
                Mark as lost
              </Button>
            </>
          }
        >
          <fieldset className="grid gap-0.5">
            <legend className="mb-1 text-xs font-semibold text-ink-3">Reason</legend>
            {LOST_REASONS.map((r) => (
              <Choice
                key={r}
                type="radio"
                name="lost-reason"
                checked={reason === r}
                onChange={() => {
                  setReason(r);
                }}
                label={r}
              />
            ))}
            <Choice
              type="radio"
              name="lost-reason"
              checked={reason === 'Other'}
              onChange={() => {
                setReason('Other');
              }}
              label="Other"
            />
          </fieldset>
          {reason === 'Other' ? (
            <Field label="What happened?" className="mt-3">
              <Input
                value={other}
                onChange={(e) => {
                  setOther(e.target.value);
                }}
              />
            </Field>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
