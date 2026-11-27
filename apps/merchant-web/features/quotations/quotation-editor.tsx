'use client';

import { Button } from '@krinly/ui/components/button';
import { Field } from '@krinly/ui/components/field';
import { Icon } from '@krinly/ui/components/icon';
import { Input, InputGroup, Select, Textarea } from '@krinly/ui/components/input';
import { Dialog, DialogContent } from '@krinly/ui/components/overlay';
import { useState } from 'react';
import { DAY } from '@/lib/preview/clock';
import { quotationSubtotal, quotationTotal, type Lead, type Quotation } from '@/lib/preview/domain';
import { inr } from '@/lib/preview/format';
import type { QuotationDraft, QuotationItemDraft } from '@/lib/preview/store';

function toDateInput(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function fromDateInput(value: string): number {
  return Date.parse(`${value}T23:59:59Z`) || Date.now();
}

function draftFrom(quotation: Quotation | null, now: number): QuotationDraft {
  return {
    items: quotation?.items.map((i) => ({ ...i })) ?? [
      { description: '', quantity: 1, unitPrice: 0 },
    ],
    discount: quotation?.discount ?? 0,
    validUntil: quotation?.validUntil ?? now + 14 * DAY,
    note: quotation?.note ?? '',
  };
}

/** Create a quotation, or edit one still in draft. Line items, a flat discount, and a validity date. */
export function QuotationEditorDialog({
  open,
  quotation,
  leads,
  leadId: fixedLeadId,
  now,
  onSave,
  onClose,
}: {
  open: boolean;
  /** null when creating fresh, or editing a draft already tied to a lead. */
  quotation: Quotation | null;
  leads: readonly Lead[];
  /** Pre-selected customer (e.g. opened from a CRM record); omit to let the merchant pick one. */
  leadId?: string;
  now: number;
  onSave: (leadId: string, draft: QuotationDraft) => void;
  onClose: () => void;
}) {
  const [leadId, setLeadId] = useState(fixedLeadId ?? quotation?.leadId ?? leads[0]?.id ?? '');
  const [draft, setDraft] = useState<QuotationDraft>(() => draftFrom(quotation, now));
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLeadId(fixedLeadId ?? quotation?.leadId ?? leads[0]?.id ?? '');
      setDraft(draftFrom(quotation, now));
    }
  }

  const items = draft.items;
  const subtotal = quotationSubtotal({ items: items.map((i) => ({ id: '', ...i })) });
  const total = quotationTotal({
    items: items.map((i) => ({ id: '', ...i })),
    discount: draft.discount,
  });
  const valid =
    leadId !== '' && items.length > 0 && items.every((i) => i.description.trim() !== '');

  function setItem(index: number, patch: Partial<QuotationItemDraft>) {
    setDraft({
      ...draft,
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        size="lg"
        title={quotation ? 'Edit quotation' : 'New quotation'}
        description="Figures are in rupees. Nothing is sent until you choose to send it."
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
              {quotation ? 'Save draft' : 'Create draft'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {fixedLeadId === undefined && !quotation ? (
            <Field label="Customer">
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
          ) : null}

          <div className="grid gap-2">
            <p className="text-xs font-semibold text-ink-3">Line items</p>
            <div className="grid gap-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_72px_112px_32px] items-start gap-2">
                  <Input
                    aria-label="Description"
                    placeholder="e.g. Signature bridal package"
                    value={item.description}
                    onChange={(e) => {
                      setItem(i, { description: e.target.value });
                    }}
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      setItem(i, { quantity: Math.max(1, Number(e.target.value) || 1) });
                    }}
                  />
                  <InputGroup
                    prefix="₹"
                    aria-label="Unit price"
                    type="number"
                    min={0}
                    value={item.unitPrice || ''}
                    onChange={(e) => {
                      setItem(i, { unitPrice: Math.max(0, Number(e.target.value) || 0) });
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove line item"
                    disabled={items.length <= 1}
                    onClick={() => {
                      setDraft({ ...draft, items: items.filter((_, idx) => idx !== i) });
                    }}
                    className="flex size-9 items-center justify-center rounded-lg text-ink-3 hover:bg-canvas-2 hover:text-critical disabled:opacity-30"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              shape="pill"
              className="w-fit"
              onClick={() => {
                setDraft({
                  ...draft,
                  items: [...items, { description: '', quantity: 1, unitPrice: 0 }],
                });
              }}
            >
              <Icon name="plus" size={14} />
              Add line item
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount" hint="Flat amount, in rupees">
              <InputGroup
                prefix="₹"
                type="number"
                min={0}
                value={draft.discount || ''}
                onChange={(e) => {
                  setDraft({ ...draft, discount: Math.max(0, Number(e.target.value) || 0) });
                }}
              />
            </Field>
            <Field label="Valid until">
              <Input
                type="date"
                value={toDateInput(draft.validUntil)}
                onChange={(e) => {
                  setDraft({ ...draft, validUntil: fromDateInput(e.target.value) });
                }}
              />
            </Field>
          </div>

          <Field label="Note" hint="Optional — shown on the customer-facing preview">
            <Textarea
              rows={2}
              value={draft.note ?? ''}
              onChange={(e) => {
                setDraft({ ...draft, note: e.target.value });
              }}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm">
            <span className="text-ink-3">
              Subtotal {inr(subtotal)}
              {draft.discount > 0 ? ` − ${inr(draft.discount)} discount` : ''}
            </span>
            <span className="text-base font-bold">{inr(total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
