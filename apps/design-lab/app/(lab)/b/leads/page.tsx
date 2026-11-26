import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LeadsB } from '@/concepts/b/leads';

export const metadata: Metadata = { title: 'Leads · Concept B' };

export default function LeadsBPage() {
  return (
    <Suspense>
      <LeadsB />
    </Suspense>
  );
}
