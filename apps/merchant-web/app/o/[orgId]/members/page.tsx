import { serverCoreApi } from '@krinly/web-auth/server';
import type { Metadata } from 'next';
import { unwrap } from '@/lib/api';
import { MembersPanel } from './members-panel';

export const metadata: Metadata = { title: 'Team' };

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const api = await serverCoreApi();
  const org = unwrap(await api.GET('/v1/organizations/{id}', { params: { path: { id: orgId } } }));
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
      <MembersPanel
        organizationId={org.id}
        canInvite={org.access.permissions.includes('members.invite')}
      />
    </div>
  );
}
