'use client';

import { useMemo, useState } from 'react';
import { quotationEffectiveStatus, type QuotationStatus } from './domain';
import { allQuotations, matchesCustomer } from './selectors';
import { usePreview } from './store';

export const QUOTATION_STATUSES: readonly QuotationStatus[] = [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
];

// One view-model for Quotations: every row carries its customer and its effective status (sent
// quotations past their validity read as expired without a separate sweep/mutation).

export function useQuotationsModel() {
  const { state } = usePreview();
  const { data, now } = state;
  const [q, setQ] = useState('');
  const [statuses, setStatuses] = useState<QuotationStatus[]>([]);

  const model = useMemo(() => {
    const all = allQuotations(data).map((row) => ({
      ...row,
      status: quotationEffectiveStatus(row.quotation, now),
    }));
    const filtered = all.filter(
      (row) =>
        matchesCustomer(row.lead, q) && (statuses.length === 0 || statuses.includes(row.status)),
    );
    return { all, filtered };
  }, [data, now, q, statuses]);

  return { ...model, now, data, q, setQ, statuses, setStatuses };
}

export type QuotationsModel = ReturnType<typeof useQuotationsModel>;
