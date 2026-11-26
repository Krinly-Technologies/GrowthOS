import { serverCoreApi } from '@krinly/web-auth/server';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { unwrap } from '@/lib/api';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const api = await serverCoreApi();
  // Membership is enforced by core-api; non-members get its 404, rendered as not-found.
  const [org, mine, me] = await Promise.all([
    api.GET('/v1/organizations/{id}', { params: { path: { id: orgId } } }).then(unwrap),
    api.GET('/v1/me/organizations').then(unwrap),
    api.GET('/v1/me').then(unwrap),
  ]);

  return (
    <AppShell
      org={{ id: org.id, name: org.name }}
      role={org.access.role}
      organizations={mine.organizations.map((o) => ({ id: o.id, name: o.name }))}
      name={me.fullName ?? me.email}
      email={me.email}
    >
      {children}
    </AppShell>
  );
}
