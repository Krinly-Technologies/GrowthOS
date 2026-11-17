import { Button } from '@krinly/ui/components/button';
import { serverCoreApi } from '@krinly/web-auth/server';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { unwrap } from '@/lib/api';
import { OrganizationSwitcher } from './organization-switcher';

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
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight">Krinly</span>
          <OrganizationSwitcher
            currentId={org.id}
            organizations={mine.organizations.map((o) => ({ id: o.id, name: o.name }))}
          />
          <nav aria-label="Workspace" className="flex gap-1 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/o/${org.id}`}>Overview</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/o/${org.id}/members`}>Team</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{me.email}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
