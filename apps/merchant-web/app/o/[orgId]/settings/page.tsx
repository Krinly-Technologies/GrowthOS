import { Badge } from '@krinly/ui/components/badge';
import { Card, CardDescription, CardTitle } from '@krinly/ui/components/card';
import { serverCoreApi } from '@krinly/web-auth/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { unwrap } from '@/lib/api';

export const metadata: Metadata = { title: 'Settings' };

/** A section whose backend isn't built yet. Points to the simulated preview instead of inventing one. */
function UnavailableSection({ title }: { title: string }) {
  return (
    <Card padding="lg" className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge tone="attention">Not yet available</Badge>
      </div>
      <CardDescription className="mt-1">
        This isn&apos;t connected to your workspace yet.{' '}
        <Link href="/preview/settings" className="font-semibold text-ink underline">
          See it in the development preview
        </Link>
        .
      </CardDescription>
    </Card>
  );
}

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const api = await serverCoreApi();
  const [org, me] = await Promise.all([
    api.GET('/v1/organizations/{id}', { params: { path: { id: orgId } } }).then(unwrap),
    api.GET('/v1/me').then(unwrap),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-base">Business profile</CardTitle>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Workspace name</dt>
            <dd className="font-medium">{org.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Workspace ID</dt>
            <dd className="font-mono text-xs">{org.id}</dd>
          </div>
        </dl>
        <CardDescription className="mt-3">
          Editing business profile details isn&apos;t supported yet.
        </CardDescription>
      </Card>

      <Card padding="lg" className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Team & access</CardTitle>
          <Link href={`/o/${org.id}/members`} className="text-sm font-semibold text-ink underline">
            Manage team
          </Link>
        </div>
        <CardDescription className="mt-1">
          Your role in this workspace is <span className="font-medium">{org.access.role}</span>.
          Invitations and member roles are managed from Team.
        </CardDescription>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-base">Account preferences</CardTitle>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{me.fullName ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{me.email}</dd>
          </div>
        </dl>
        <CardDescription className="mt-3">
          Editing your name or email isn&apos;t supported yet.
        </CardDescription>
      </Card>

      <UnavailableSection title="Communication channels" />
      <UnavailableSection title="Integrations" />
      <UnavailableSection title="Notifications" />
      <UnavailableSection title="Regional preferences" />
      <UnavailableSection title="Support access" />
      <UnavailableSection title="Activity & audit" />
    </div>
  );
}
