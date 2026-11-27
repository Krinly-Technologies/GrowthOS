import { serverCoreApi } from '@krinly/web-auth/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { isAdminPreviewEnabled } from '@/lib/preview/guard';

/**
 * Gate for every admin preview route: the development opt-in (see `lib/preview/guard.ts`) *and*
 * a real operator session — this stays inside the authenticated admin app and never substitutes
 * for operator authorization, even though every workspace it shows is fictional.
 */
export default async function AdminPreviewLayout({ children }: { children: ReactNode }) {
  if (!isAdminPreviewEnabled()) notFound();
  const api = await serverCoreApi();
  const { data, response } = await api.GET('/v1/operator/session');
  if (response.status === 403 || !data) notFound();
  return children;
}
