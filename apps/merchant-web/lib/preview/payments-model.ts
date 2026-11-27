'use client';

import { useMemo, useState } from 'react';
import type { PaymentStatus } from './domain';
import { allPaymentRows, matchesCustomer, sumAmounts } from './selectors';
import { usePreview } from './store';

export const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'requested',
  'recorded',
  'verified',
  'cancelled',
  'failed',
];

// One view-model for Payments: requests, what's recorded but not yet verified, and verified
// revenue — all read from the same `data.payments` Today and CRM already use, so nothing here
// can disagree with what they show.

export function usePaymentsModel() {
  const { state } = usePreview();
  const { data, now } = state;
  const [q, setQ] = useState('');
  const [statuses, setStatuses] = useState<PaymentStatus[]>([]);

  const model = useMemo(() => {
    const all = allPaymentRows(data);
    const filtered = all.filter(
      (row) =>
        matchesCustomer(row.lead, q) &&
        (statuses.length === 0 || statuses.includes(row.payment.status)),
    );
    const totals = {
      requested: sumAmounts(
        all.filter((r) => r.payment.status === 'requested').map((r) => r.payment),
      ),
      recorded: sumAmounts(
        all.filter((r) => r.payment.status === 'recorded').map((r) => r.payment),
      ),
      verified: sumAmounts(
        all.filter((r) => r.payment.status === 'verified').map((r) => r.payment),
      ),
    };
    return { all, filtered, totals };
  }, [data, q, statuses]);

  return { ...model, now, data, q, setQ, statuses, setStatuses };
}

export type PaymentsModel = ReturnType<typeof usePaymentsModel>;
