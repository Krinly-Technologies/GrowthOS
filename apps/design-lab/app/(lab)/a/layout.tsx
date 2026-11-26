import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ShellA } from '@/concepts/a/shell';
import { isLabEnabled } from '@/lib/lab-guard';

export default function ConceptALayout({ children }: { children: ReactNode }) {
  // Each segment refuses to render outside an enabled dev server, so no lab content is sent.
  if (!isLabEnabled()) notFound();
  return <ShellA>{children}</ShellA>;
}
