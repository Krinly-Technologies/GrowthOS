import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isPreviewEnabled } from '@/lib/preview/guard';

// No metadata export: Next resolves a segment's metadata independently of whether its component
// renders, so a title here would also caption the 404 that production serves for these routes.

/**
 * Gate for every preview route. Without the explicit development opt-in these pages do not
 * exist, so a production build serves them as 404s (see `lib/preview/guard.ts`).
 */
export default function PreviewLayout({ children }: { children: ReactNode }) {
  if (!isPreviewEnabled()) notFound();
  return children;
}
