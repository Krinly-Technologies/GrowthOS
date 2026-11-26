import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ShellG } from '@/concepts/g/shell';
import { isLabEnabled } from '@/lib/lab-guard';

export default function ConceptGLayout({ children }: { children: ReactNode }) {
  // Each segment refuses to render outside an enabled dev server, so no lab content is sent.
  if (!isLabEnabled()) notFound();
  return <ShellG>{children}</ShellG>;
}
