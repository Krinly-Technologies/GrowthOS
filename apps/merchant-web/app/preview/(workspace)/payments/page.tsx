'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { useToast } from '@krinly/ui/components/toast';
import { Suspense } from 'react';
import { PaymentsWorkspace } from '@/features/payments/payments-workspace';
import { inr } from '@/lib/preview/format';
import { usePaymentsModel } from '@/lib/preview/payments-model';
import { usePreview } from '@/lib/preview/store';

function Payments() {
  const { state, dispatch } = usePreview();
  const model = usePaymentsModel();
  const toast = useToast();

  const onUndo = () => {
    dispatch({ type: 'undo' });
  };

  return (
    <PaymentsWorkspace
      model={model}
      leads={state.data.leads}
      data={state.data}
      actions={{
        requestPayment: (leadId, amount, kind, bookingId) => {
          dispatch({ type: 'requestPayment', leadId, amount, kind, bookingId });
        },
        recordPayment: (leadId, amount, method, reference, kind, bookingId, requestId) => {
          dispatch({
            type: 'recordPayment',
            leadId,
            amount,
            method,
            reference,
            kind,
            bookingId,
            requestId,
          });
        },
        verifyPayment: (paymentId) => {
          const payment = state.data.payments.find((p) => p.id === paymentId);
          dispatch({ type: 'verifyPayment', paymentId });
          if (payment) {
            toast({
              title: `${inr(payment.amount)} verified`,
              description: 'It now counts as verified revenue.',
              action: { label: 'Undo', onClick: onUndo },
            });
          }
        },
        cancelRequest: (paymentId, reason, outcome) => {
          dispatch({ type: 'cancelPaymentRequest', paymentId, reason, outcome });
          toast({ title: `Request marked ${outcome}`, action: { label: 'Undo', onClick: onUndo } });
        },
      }}
    />
  );
}

export default function PaymentsPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Payments />
    </Suspense>
  );
}
