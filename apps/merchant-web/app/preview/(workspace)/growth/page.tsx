'use client';

import { Skeleton } from '@krinly/ui/components/feedback';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { GrowthWorkspace } from '@/features/growth/growth-workspace';
import { useGrowthModel } from '@/lib/preview/growth-model';

function Growth() {
  const router = useRouter();
  const model = useGrowthModel();
  return (
    <GrowthWorkspace
      model={model}
      onReviewPayments={() => {
        router.push('/preview/payments');
      }}
    />
  );
}

export default function GrowthPreviewPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Growth />
    </Suspense>
  );
}
