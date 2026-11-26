import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TodayA } from '@/concepts/a/today';

export const metadata: Metadata = { title: 'Today · Concept A' };

export default function TodayAPage() {
  return (
    <Suspense>
      <TodayA />
    </Suspense>
  );
}
