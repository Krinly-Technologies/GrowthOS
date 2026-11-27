'use client';

import { Avatar } from '@krinly/ui/components/avatar';
import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Icon } from '@krinly/ui/components/icon';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@krinly/ui/components/overlay';
import Link from 'next/link';
import {
  quotationTotal,
  type Lead,
  type Quotation,
  type QuotationStatus,
} from '@/lib/preview/domain';
import { fullDate, inr } from '@/lib/preview/format';

export const QUOTATION_STATUS_TONE: Record<
  QuotationStatus,
  'neutral' | 'info' | 'verified' | 'critical' | 'attention'
> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'verified',
  declined: 'critical',
  expired: 'attention',
};

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export function QuotationDetailSheet({
  quotation,
  lead,
  status,
  onClose,
  onEdit,
  onDuplicate,
  onPreview,
  onSend,
  onRespond,
  onCreateBooking,
}: {
  quotation: Quotation | undefined;
  lead: Lead | undefined;
  status: QuotationStatus | undefined;
  onClose: () => void;
  onEdit: (quotation: Quotation) => void;
  onDuplicate: (quotation: Quotation) => void;
  onPreview: (quotation: Quotation, lead: Lead) => void;
  onSend: (quotation: Quotation) => void;
  onRespond: (quotation: Quotation, status: 'accepted' | 'declined') => void;
  onCreateBooking: (quotation: Quotation, lead: Lead) => void;
}) {
  const open = quotation !== undefined && lead !== undefined && status !== undefined;
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {open ? (
        <SheetContent variant="floating" width="md" label={`Quotation for ${lead.name}`}>
          <Panel
            quotation={quotation}
            lead={lead}
            status={status}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onPreview={onPreview}
            onSend={onSend}
            onRespond={onRespond}
            onCreateBooking={onCreateBooking}
          />
        </SheetContent>
      ) : null}
    </Sheet>
  );
}

function Panel({
  quotation,
  lead,
  status,
  onEdit,
  onDuplicate,
  onPreview,
  onSend,
  onRespond,
  onCreateBooking,
}: {
  quotation: Quotation;
  lead: Lead;
  status: QuotationStatus;
  onEdit: (quotation: Quotation) => void;
  onDuplicate: (quotation: Quotation) => void;
  onPreview: (quotation: Quotation, lead: Lead) => void;
  onSend: (quotation: Quotation) => void;
  onRespond: (quotation: Quotation, status: 'accepted' | 'declined') => void;
  onCreateBooking: (quotation: Quotation, lead: Lead) => void;
}) {
  const who = lead.latinName ?? lead.name;
  const total = quotationTotal(quotation);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <Avatar name={who} seed={lead.id} size={44} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate font-display text-lg font-semibold tracking-tight">
              Quotation for {who}
            </SheetTitle>
            <p className="truncate text-[13px] text-ink-3">
              {quotation.id.toUpperCase()} · Valid until {fullDate(quotation.validUntil)}
            </p>
          </div>
          <SheetClose
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-full p-1.5 text-ink-3 hover:bg-canvas-2 hover:text-ink"
          >
            <Icon name="close" size={18} />
          </SheetClose>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Badge tone={QUOTATION_STATUS_TONE[status]}>{QUOTATION_STATUS_LABEL[status]}</Badge>
          <span className="tnum text-sm font-bold">{inr(total)}</span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <ul className="divide-y divide-line-soft rounded-2xl bg-canvas px-4">
          {quotation.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-[13.5px]">
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{item.description}</span>
                <span className="block text-xs text-ink-3">
                  {item.quantity} × {inr(item.unitPrice)}
                </span>
              </span>
              <span className="tnum font-semibold">{inr(item.quantity * item.unitPrice)}</span>
            </li>
          ))}
        </ul>
        {quotation.note ? <p className="mt-3 text-[13px] text-ink-3">{quotation.note}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" shape="pill">
            <Link href={`/preview/crm?lead=${lead.id}`}>
              <Icon name="list" size={15} />
              Open CRM record
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            onClick={() => {
              onPreview(quotation, lead);
            }}
          >
            <Icon name="note" size={15} />
            Preview
          </Button>
          {quotation.status === 'draft' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                onClick={() => {
                  onEdit(quotation);
                }}
              >
                <Icon name="note" size={15} />
                Edit draft
              </Button>
              <Button
                size="sm"
                shape="pill"
                onClick={() => {
                  onSend(quotation);
                }}
              >
                <Icon name="message" size={15} />
                Send to customer
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              onClick={() => {
                onDuplicate(quotation);
              }}
            >
              <Icon name="layers" size={15} />
              Duplicate
            </Button>
          )}
          {status === 'sent' ? (
            <>
              <Button
                size="sm"
                shape="pill"
                onClick={() => {
                  onRespond(quotation, 'accepted');
                }}
              >
                <Icon name="check" size={15} />
                Mark accepted
              </Button>
              <Button
                variant="ghost"
                size="sm"
                shape="pill"
                className="text-critical hover:bg-critical-soft"
                onClick={() => {
                  onRespond(quotation, 'declined');
                }}
              >
                <Icon name="close" size={15} />
                Mark declined
              </Button>
            </>
          ) : null}
          {status === 'accepted' && !quotation.bookingId ? (
            <Button
              variant="brand"
              size="sm"
              shape="pill"
              onClick={() => {
                onCreateBooking(quotation, lead);
              }}
            >
              <Icon name="calendar" size={15} />
              Create booking
            </Button>
          ) : null}
          {quotation.bookingId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-3 py-1.5 text-[13px] font-semibold text-verified">
              <Icon name="seal" size={14} />
              Booked
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
