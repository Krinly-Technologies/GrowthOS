import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ShellB } from '@/concepts/b/shell';
import { isLabEnabled } from '@/lib/lab-guard';

export default function ConceptBLayout({ children }: { children: ReactNode }) {
  // Each segment refuses to render outside an enabled dev server, so no lab content is sent.
  if (!isLabEnabled()) notFound();
  return <ShellB>{children}</ShellB>;
}
