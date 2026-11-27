'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { SearchField } from '@krinly/ui/components/input';
import {
  ListRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@krinly/ui/components/table';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { useState } from 'react';
import { ConfirmDialog } from '@/features/common/confirm-dialog';
import { FilterMenu } from '@/features/common/filter-menu';
import { DAY } from '@/lib/preview/clock';
import {
  quotationTotal,
  type Lead,
  type Quotation,
  type QuotationStatus,
} from '@/lib/preview/domain';
import { fullDate, inr, plural } from '@/lib/preview/format';
import { QUOTATION_STATUSES, type QuotationsModel } from '@/lib/preview/quotations-model';
import type { BookingDraft, QuotationDraft } from '@/lib/preview/store';
import {
  QUOTATION_STATUS_LABEL,
  QUOTATION_STATUS_TONE,
  QuotationDetailSheet,
} from './quotation-detail';
import { QuotationEditorDialog } from './quotation-editor';
import { QuotationPreviewDialog } from './quotation-print';

export interface QuotationsActions {
  createQuotation: (leadId: string, draft: QuotationDraft) => void;
  updateQuotation: (quotationId: string, draft: QuotationDraft) => void;
  duplicateQuotation: (quotationId: string) => void;
  sendQuotation: (quotationId: string) => void;
  respondQuotation: (quotationId: string, status: 'accepted' | 'declined') => void;
  createBooking: (leadId: string, draft: BookingDraft, quotationId: string) => void;
}

/**
 * Quotations: draft, sent, accepted, declined and expired quotations for CRM customers, a
 * printable customer-facing preview, and the explicit step from an accepted quote to a booking.
 */
export function QuotationsWorkspace({
  model,
  leads,
  actions,
}: {
  model: QuotationsModel;
  leads: readonly Lead[];
  actions: QuotationsActions;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Quotation | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<{
    quotation: Quotation;
    lead: Lead;
  } | null>(null);

  const selected = model.filtered.find((r) => r.quotation.id === selectedId);
  const previewLead = previewing ? (leads.find((l) => l.id === previewing.leadId) ?? null) : null;

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hidden font-display text-[28px] leading-tight md:block">Quotations</h1>
          <p className="text-sm text-ink-3">{plural(model.all.length, 'quotation')} total</p>
        </div>
        <Button
          variant="brand"
          shape="pill"
          onClick={() => {
            setCreating(true);
          }}
        >
          <Icon name="plus" size={16} />
          New quotation
        </Button>
      </header>

      <FilterToolbar
        start={
          <SearchField
            label="Search quotations"
            placeholder="Search by customer name, phone or area"
            value={model.q}
            onChange={(e) => {
              model.setQ(e.target.value);
            }}
          />
        }
        filters={
          <FilterMenu<QuotationStatus>
            label="Status"
            options={QUOTATION_STATUSES.map((s) => ({
              value: s,
              label: QUOTATION_STATUS_LABEL[s],
            }))}
            selected={model.statuses}
            onChange={model.setStatuses}
          />
        }
        resultSummary={plural(model.filtered.length, 'quotation')}
      />

      {model.filtered.length === 0 ? (
        <Card padding="lg" className="items-center text-center text-sm text-ink-3">
          No quotations match yet.
        </Card>
      ) : (
        <>
          <Card padding="none" className="hidden lg:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead numeric>Total</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {model.filtered.map(({ quotation, lead, status }) => (
                  <TableRow
                    key={quotation.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedId(quotation.id);
                    }}
                  >
                    <TableCell>
                      <span className="font-semibold">{lead.latinName ?? lead.name}</span>
                      <span className="block text-xs text-ink-3">{lead.phone}</span>
                    </TableCell>
                    <TableCell>
                      {plural(quotation.items.length, 'item')} ·{' '}
                      {quotation.items[0]?.description ?? ''}
                      {quotation.items.length > 1 ? ' …' : ''}
                    </TableCell>
                    <TableCell numeric>{inr(quotationTotal(quotation))}</TableCell>
                    <TableCell>{fullDate(quotation.validUntil)}</TableCell>
                    <TableCell>
                      <Badge tone={QUOTATION_STATUS_TONE[status]}>
                        {QUOTATION_STATUS_LABEL[status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="divide-y divide-line-soft overflow-hidden rounded-2xl bg-surface shadow-ring lg:hidden">
            {model.filtered.map(({ quotation, lead, status }) => (
              <button
                key={quotation.id}
                type="button"
                onClick={() => {
                  setSelectedId(quotation.id);
                }}
                className="block w-full text-left"
              >
                <ListRow
                  title={lead.latinName ?? lead.name}
                  subtitle={`${plural(quotation.items.length, 'item')} · ${inr(quotationTotal(quotation))}`}
                  trailing={
                    <Badge tone={QUOTATION_STATUS_TONE[status]}>
                      {QUOTATION_STATUS_LABEL[status]}
                    </Badge>
                  }
                />
              </button>
            ))}
          </div>
        </>
      )}

      <QuotationDetailSheet
        quotation={selected?.quotation}
        lead={selected?.lead}
        status={selected?.status}
        onClose={() => {
          setSelectedId(null);
        }}
        onEdit={(q) => {
          setSelectedId(null);
          setEditing(q);
        }}
        onDuplicate={(q) => {
          actions.duplicateQuotation(q.id);
          setSelectedId(null);
        }}
        onPreview={(q) => {
          setPreviewing(q);
        }}
        onSend={(q) => {
          actions.sendQuotation(q.id);
        }}
        onRespond={(q, status) => {
          actions.respondQuotation(q.id, status);
        }}
        onCreateBooking={(q, lead) => {
          setSelectedId(null);
          setConfirmingBooking({ quotation: q, lead });
        }}
      />

      <QuotationEditorDialog
        open={creating}
        quotation={null}
        leads={leads}
        now={model.now}
        onSave={actions.createQuotation}
        onClose={() => {
          setCreating(false);
        }}
      />
      <QuotationEditorDialog
        open={editing !== null}
        quotation={editing}
        leads={leads}
        leadId={editing?.leadId}
        now={model.now}
        onSave={(_leadId, draft) => {
          if (editing) actions.updateQuotation(editing.id, draft);
        }}
        onClose={() => {
          setEditing(null);
        }}
      />

      <QuotationPreviewDialog
        quotation={previewing}
        lead={previewLead}
        onClose={() => {
          setPreviewing(null);
        }}
      />

      <ConfirmDialog
        open={confirmingBooking !== null}
        title="Create a booking from this quotation?"
        description={
          confirmingBooking
            ? `This books ${confirmingBooking.lead.latinName ?? confirmingBooking.lead.name} for ${inr(
                quotationTotal(confirmingBooking.quotation),
              )}. You can reschedule it afterwards in Bookings.`
            : undefined
        }
        confirmLabel="Create booking"
        onConfirm={() => {
          if (!confirmingBooking) return;
          const { quotation, lead } = confirmingBooking;
          actions.createBooking(
            lead.id,
            {
              kind: 'event',
              title: quotation.items[0]?.description ?? 'Booked appointment',
              start: model.now + DAY,
              minutes: 120,
              with: lead.owner,
              value: quotationTotal(quotation),
            },
            quotation.id,
          );
        }}
        onClose={() => {
          setConfirmingBooking(null);
        }}
      />
    </div>
  );
}
