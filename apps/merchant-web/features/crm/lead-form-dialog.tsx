'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Input, InputGroup, Select } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import type { LeadDraft } from '@/lib/preview/store';
import type { Lead, MemberId, ServiceId, SourceId } from '@/lib/preview/domain';
import {
  MEMBER_IDS,
  SERVICE_IDS,
  SERVICES,
  SOURCE_IDS,
  SOURCES,
  TEAM,
} from '@/lib/preview/sample/scenario';

const DEFAULT_SERVICE: ServiceId = 'bridal_signature';
const DEFAULT_SOURCE: SourceId = 'walk_in';
const DEFAULT_OWNER: MemberId = 'farah';

function draftFromLead(lead: Lead | null): LeadDraft {
  return {
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    area: lead?.area ?? '',
    service: lead?.service ?? DEFAULT_SERVICE,
    eventLabel: lead?.eventLabel ?? 'Wedding',
    eventDate: lead?.eventDate,
    value: lead?.value ?? 0,
    source: lead?.source ?? DEFAULT_SOURCE,
    sourceDetail: lead?.sourceDetail ?? '',
    owner: lead?.owner ?? DEFAULT_OWNER,
  };
}

/** YYYY-MM-DD for a date input, from epoch ms (UTC — fine for a date-only field). */
function toDateInput(ms: number | undefined): string {
  if (ms === undefined) return '';
  return new Date(ms).toISOString().slice(0, 10);
}

function fromDateInput(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Create or edit a lead by hand. One form, no workflow builder. */
export function LeadFormDialog({
  open,
  lead,
  onSave,
  onClose,
}: {
  open: boolean;
  /** null creates a new lead; a Lead edits it. */
  lead: Lead | null;
  onSave: (draft: LeadDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<LeadDraft>(() => draftFromLead(lead));
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the form each time the dialog opens, adjusted during render rather than in an effect.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(draftFromLead(lead));
  }

  const valid = draft.name.trim() !== '' && draft.phone.trim() !== '';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title={lead ? 'Edit lead' : 'New lead'}
        description={
          lead
            ? 'Update what you know about this customer.'
            : 'Add a customer you heard from outside Krinly — a call, a walk-in, a referral.'
        }
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
                onSave(draft);
                onClose();
              }}
            >
              {lead ? 'Save changes' : 'Add lead'}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) {
              onSave(draft);
              onClose();
            }
          }}
        >
          <Field label="Customer name">
            <Input
              value={draft.name}
              onChange={(e) => {
                setDraft({ ...draft, name: e.target.value });
              }}
              required
            />
          </Field>
          <Field label="Phone">
            <Input
              type="tel"
              value={draft.phone}
              onChange={(e) => {
                setDraft({ ...draft, phone: e.target.value });
              }}
              required
            />
          </Field>
          <Field label="Area">
            <Input
              value={draft.area}
              onChange={(e) => {
                setDraft({ ...draft, area: e.target.value });
              }}
              placeholder="e.g. Jayanagar, Bengaluru"
            />
          </Field>
          <Field label="Interested in">
            <Select
              value={draft.service}
              onChange={(e) => {
                setDraft({ ...draft, service: e.target.value as ServiceId });
              }}
            >
              {SERVICE_IDS.map((id) => (
                <option key={id} value={id}>
                  {SERVICES[id].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Event">
            <Input
              value={draft.eventLabel}
              onChange={(e) => {
                setDraft({ ...draft, eventLabel: e.target.value });
              }}
              placeholder="e.g. Wedding, Engagement"
            />
          </Field>
          <Field label="Event date" hint="Optional">
            <Input
              type="date"
              value={toDateInput(draft.eventDate)}
              onChange={(e) => {
                setDraft({ ...draft, eventDate: fromDateInput(e.target.value) });
              }}
            />
          </Field>
          <Field label="Estimated or quoted value" hint="In rupees">
            <InputGroup
              prefix="₹"
              type="number"
              min={0}
              value={draft.value || ''}
              onChange={(e) => {
                setDraft({ ...draft, value: Number(e.target.value) || 0 });
              }}
            />
          </Field>
          <Field label="Owner">
            <Select
              value={draft.owner}
              onChange={(e) => {
                setDraft({ ...draft, owner: e.target.value as MemberId });
              }}
            >
              {MEMBER_IDS.map((id) => (
                <option key={id} value={id}>
                  {TEAM[id].name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Came from">
            <Select
              value={draft.source}
              onChange={(e) => {
                setDraft({ ...draft, source: e.target.value as SourceId });
              }}
            >
              {SOURCE_IDS.map((id) => (
                <option key={id} value={id}>
                  {SOURCES[id].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source detail" hint="Optional — e.g. referrer's name">
            <Input
              value={draft.sourceDetail ?? ''}
              onChange={(e) => {
                setDraft({ ...draft, sourceDetail: e.target.value });
              }}
            />
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
