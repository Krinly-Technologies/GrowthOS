import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LeadsA } from '@/concepts/a/leads';

export const metadata: Metadata = { title: 'Leads · Concept A' };

export default function LeadsAPage() {
  return (
    <Suspense>
      <LeadsA />
    </Suspense>
  );
}
