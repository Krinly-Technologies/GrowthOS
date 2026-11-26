import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LeadsG } from '@/concepts/g/leads';

export const metadata: Metadata = { title: 'Leads · Growth Studio refined' };

export default function LeadsGPage() {
  return (
    <Suspense>
      <LeadsG />
    </Suspense>
  );
}
