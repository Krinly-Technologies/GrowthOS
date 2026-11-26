import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TodayG } from '@/concepts/g/today';

export const metadata: Metadata = { title: 'Today · Growth Studio refined' };

export default function TodayGPage() {
  return (
    <Suspense>
      <TodayG />
    </Suspense>
  );
}
