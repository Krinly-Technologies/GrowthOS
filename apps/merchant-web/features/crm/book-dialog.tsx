'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import { DAY } from '@/lib/preview/clock';
import type { Lead, MemberId } from '@/lib/preview/domain';
import type { BookingDraft } from '@/lib/preview/store';
import { MEMBER_IDS, TEAM } from '@/lib/preview/sample/scenario';

function toInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Quick "Book a trial" from a lead's CRM record — one appointment, confirmed immediately. */
export function BookDialog({
  lead,
  now,
  onSave,
  onClose,
}: {
  lead: Lead | null;
  now: number;
  onSave: (leadId: string, draft: BookingDraft) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('Trial appointment');
  const [start, setStart] = useState(now + DAY);
  const [minutes, setMinutes] = useState(60);
  const [withMember, setWithMember] = useState<MemberId>('lakshmi');
  const [wasOpen, setWasOpen] = useState(lead !== null);

  if ((lead !== null) !== wasOpen) {
    setWasOpen(lead !== null);
    if (lead) {
      setTitle('Trial appointment');
      setStart(now + DAY);
      setMinutes(60);
      setWithMember('lakshmi');
    }
  }

  return (
    <Dialog
      open={lead !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title={lead ? `Book a trial for ${lead.latinName ?? lead.name}` : 'Book a trial'}
        description="Simulated scheduling — not connected to real availability."
        footer={
          <>
            <Button variant="ghost" shape="pill" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="brand"
              shape="pill"
              onClick={() => {
                if (!lead) return;
                onSave(lead.id, { kind: 'trial', title, start, minutes, with: withMember });
                onClose();
              }}
            >
              Confirm booking
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
          </Field>
          <Field label="Date & time">
            <Input
              type="datetime-local"
              value={toInputValue(start)}
              onChange={(e) => {
                const ms = new Date(e.target.value).getTime();
                if (!Number.isNaN(ms)) setStart(ms);
              }}
            />
          </Field>
          <Field label="Duration" hint="Minutes">
            <InputGroup
              prefix="min"
              type="number"
              min={15}
              step={15}
              value={minutes}
              onChange={(e) => {
                setMinutes(Math.max(15, Number(e.target.value) || 60));
              }}
            />
          </Field>
          <Field label="With">
            <Select
              value={withMember}
              onChange={(e) => {
                setWithMember(e.target.value as MemberId);
              }}
            >
              {MEMBER_IDS.map((id) => (
                <option key={id} value={id}>
                  {TEAM[id].name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
