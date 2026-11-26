import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TodayB } from '@/concepts/b/today';

export const metadata: Metadata = { title: 'Today · Concept B' };

export default function TodayBPage() {
  return (
    <Suspense>
      <TodayB />
    </Suspense>
  );
}
