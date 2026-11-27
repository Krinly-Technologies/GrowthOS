'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { Suspense } from 'react';
import { QuotationsWorkspace } from '@/features/quotations/quotations-workspace';
import { useQuotationsModel } from '@/lib/preview/quotations-model';
import { usePreview } from '@/lib/preview/store';

function Quotations() {
  const { state, dispatch } = usePreview();
  const model = useQuotationsModel();

  return (
    <QuotationsWorkspace
      model={model}
      leads={state.data.leads}
      actions={{
        createQuotation: (leadId, draft) => {
          dispatch({ type: 'createQuotation', leadId, draft });
        },
        updateQuotation: (quotationId, draft) => {
          dispatch({ type: 'updateQuotation', quotationId, draft });
        },
        duplicateQuotation: (quotationId) => {
          dispatch({ type: 'duplicateQuotation', quotationId });
        },
        sendQuotation: (quotationId) => {
          dispatch({ type: 'sendQuotation', quotationId });
        },
        respondQuotation: (quotationId, status) => {
          dispatch({ type: 'respondQuotation', quotationId, status });
        },
        createBooking: (leadId, draft, quotationId) => {
          dispatch({ type: 'createBooking', leadId, draft, status: 'confirmed', quotationId });
        },
      }}
    />
  );
}

export default function QuotationsPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Quotations />
    </Suspense>
  );
}
