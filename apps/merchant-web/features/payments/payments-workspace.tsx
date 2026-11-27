'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card } from '@krinly/ui/components/card';
import { Icon } from '@krinly/ui/components/icon';
import { SearchField } from '@krinly/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@krinly/ui/components/table';
import { FilterToolbar } from '@krinly/ui/patterns/filter-toolbar';
import { Metric } from '@krinly/ui/patterns/metric';
import { useState } from 'react';
import { FilterMenu } from '@/features/common/filter-menu';
import {
  type LabData,
  type Lead,
  type Payment,
  type PaymentKind,
  type PaymentMethod,
  type PaymentStatus,
} from '@/lib/preview/domain';
import { inr, plural, weekdayDayMonth } from '@/lib/preview/format';
import { PAYMENT_STATUSES, type PaymentsModel } from '@/lib/preview/payments-model';
import { CancelRequestDialog } from './cancel-request-dialog';
import { PaymentRequestDialog } from './payment-request-dialog';
import { RecordPaymentDialog } from './record-payment-dialog';

export interface PaymentsActions {
  requestPayment: (leadId: string, amount: number, kind: PaymentKind, bookingId?: string) => void;
  recordPayment: (
    leadId: string,
    amount: number,
    method: PaymentMethod,
    reference: string,
    kind: PaymentKind,
    bookingId: string | undefined,
    requestId: string | undefined,
  ) => void;
  verifyPayment: (paymentId: string) => void;
  cancelRequest: (paymentId: string, reason: string, outcome: 'cancelled' | 'failed') => void;
}

const STATUS_TONE: Record<PaymentStatus, 'neutral' | 'attention' | 'verified' | 'critical'> = {
  requested: 'neutral',
  recorded: 'attention',
  verified: 'verified',
  cancelled: 'critical',
  failed: 'critical',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  requested: 'Requested',
  recorded: 'Awaiting verification',
  verified: 'Verified',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

/**
 * Payments: what's outstanding, what's recorded but not yet verified, and what's verified as
 * revenue — kept as three distinct figures so a payment is never counted twice.
 */
export function PaymentsWorkspace({
  model,
  leads,
  data,
  actions,
}: {
  model: PaymentsModel;
  leads: readonly Lead[];
  data: LabData;
  actions: PaymentsActions;
}) {
  const [requesting, setRequesting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [fulfilling, setFulfilling] = useState<Payment | null>(null);
  const [cancelling, setCancelling] = useState<Payment | null>(null);

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hidden font-display text-[28px] leading-tight md:block">Payments</h1>
          <p className="text-sm text-ink-3">{plural(model.all.length, 'payment record')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            shape="pill"
            onClick={() => {
              setRecording(true);
            }}
          >
            <Icon name="note" size={16} />
            Record payment
          </Button>
          <Button
            variant="brand"
            shape="pill"
            onClick={() => {
              setRequesting(true);
            }}
          >
            <Icon name="plus" size={16} />
            Request payment
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <Metric label="Outstanding requests" value={inr(model.totals.requested)} />
        </Card>
        <Card padding="md">
          <Metric
            label="Awaiting verification"
            value={inr(model.totals.recorded)}
            context="Received, not yet counted as revenue"
          />
        </Card>
        <Card padding="md">
          <Metric label="Verified revenue" value={inr(model.totals.verified)} context="All time" />
        </Card>
      </div>

      <FilterToolbar
        start={
          <SearchField
            label="Search payments"
            placeholder="Search by customer name, phone or area"
            value={model.q}
            onChange={(e) => {
              model.setQ(e.target.value);
            }}
          />
        }
        filters={
          <FilterMenu<PaymentStatus>
            label="Status"
            options={PAYMENT_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            selected={model.statuses}
            onChange={model.setStatuses}
          />
        }
        resultSummary={plural(model.filtered.length, 'payment')}
      />

      {model.filtered.length === 0 ? (
        <Card padding="lg" className="items-center text-center text-sm text-ink-3">
          No payments match yet.
        </Card>
      ) : (
        <>
          <Card padding="none" className="hidden lg:flex">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Method / reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead numeric>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {model.filtered.map(({ payment, lead }) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <span className="font-semibold">{lead.latinName ?? lead.name}</span>
                      <span className="block text-xs text-ink-3">{lead.phone}</span>
                    </TableCell>
                    <TableCell>{payment.kind}</TableCell>
                    <TableCell>
                      {payment.status === 'requested' ? (
                        <span className="text-ink-3">Not yet received</span>
                      ) : (
                        <>
                          {payment.method}
                          <span className="block text-xs text-ink-3">{payment.reference}</span>
                        </>
                      )}
                    </TableCell>
                    <TableCell>{weekdayDayMonth(payment.recordedAt)}</TableCell>
                    <TableCell numeric>{inr(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[payment.status]}>
                        {STATUS_LABEL[payment.status]}
                      </Badge>
                      {payment.cancelReason ? (
                        <span className="block text-xs text-ink-3">{payment.cancelReason}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <PaymentRowActions
                        payment={payment}
                        onRecord={setFulfilling}
                        onCancel={setCancelling}
                        onVerify={actions.verifyPayment}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="grid gap-3 lg:hidden">
            {model.filtered.map(({ payment, lead }) => (
              <Card key={payment.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{lead.latinName ?? lead.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      {payment.kind} ·{' '}
                      {payment.status === 'requested' ? 'Not yet received' : payment.method} ·{' '}
                      {weekdayDayMonth(payment.recordedAt)}
                    </p>
                  </div>
                  <span className="tnum shrink-0 font-bold">{inr(payment.amount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Badge tone={STATUS_TONE[payment.status]}>{STATUS_LABEL[payment.status]}</Badge>
                  <PaymentRowActions
                    payment={payment}
                    onRecord={setFulfilling}
                    onCancel={setCancelling}
                    onVerify={actions.verifyPayment}
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <PaymentRequestDialog
        open={requesting}
        leads={leads}
        data={data}
        onSave={actions.requestPayment}
        onClose={() => {
          setRequesting(false);
        }}
      />
      <RecordPaymentDialog
        open={recording}
        leads={leads}
        data={data}
        request={null}
        onSave={(leadId, amount, method, reference, kind, bookingId, requestId) => {
          actions.recordPayment(leadId, amount, method, reference, kind, bookingId, requestId);
        }}
        onClose={() => {
          setRecording(false);
        }}
      />
      <RecordPaymentDialog
        open={fulfilling !== null}
        leads={leads}
        data={data}
        request={fulfilling}
        onSave={(leadId, amount, method, reference, kind, bookingId, requestId) => {
          actions.recordPayment(leadId, amount, method, reference, kind, bookingId, requestId);
        }}
        onClose={() => {
          setFulfilling(null);
        }}
      />
      <CancelRequestDialog
        payment={cancelling}
        onConfirm={actions.cancelRequest}
        onClose={() => {
          setCancelling(null);
        }}
      />
    </div>
  );
}

function PaymentRowActions({
  payment,
  onRecord,
  onCancel,
  onVerify,
}: {
  payment: Payment;
  onRecord: (payment: Payment) => void;
  onCancel: (payment: Payment) => void;
  onVerify: (paymentId: string) => void;
}) {
  if (payment.status === 'requested') {
    return (
      <div className="flex gap-1.5">
        <Button
          size="sm"
          shape="pill"
          onClick={() => {
            onRecord(payment);
          }}
        >
          Record
        </Button>
        <Button
          variant="ghost"
          size="sm"
          shape="pill"
          className="text-critical hover:bg-critical-soft"
          onClick={() => {
            onCancel(payment);
          }}
        >
          Close
        </Button>
      </div>
    );
  }
  if (payment.status === 'recorded') {
    return (
      <Button
        size="sm"
        shape="pill"
        onClick={() => {
          onVerify(payment.id);
        }}
      >
        <Icon name="seal" size={14} />
        Verify
      </Button>
    );
  }
  return null;
}
