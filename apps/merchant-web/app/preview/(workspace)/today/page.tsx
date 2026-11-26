'use client';

import { Suspense } from 'react';
import { Skeleton } from '@krinly/ui/components/feedback';
import { TodayDashboard } from '@/features/today/today-dashboard';
import { usePreview } from '@/lib/preview/store';
import { useTodayModel } from '@/lib/preview/today-model';

function Today() {
  const { dispatch } = usePreview();
  const model = useTodayModel();
  return (
    <TodayDashboard
      model={model}
      acquisitionHref="/preview/acquisition"
      onVerifyPayment={(paymentId) => {
        dispatch({ type: 'verifyPayment', paymentId });
      }}
      onUndo={() => {
        dispatch({ type: 'undo' });
      }}
    />
  );
}

export default function TodayPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Today />
    </Suspense>
  );
}
