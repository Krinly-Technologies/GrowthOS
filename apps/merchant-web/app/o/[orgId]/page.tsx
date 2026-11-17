import { Button } from '@krinly/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { serverCoreApi } from '@krinly/web-auth/server';
import Link from 'next/link';
import { unwrap } from '@/lib/api';

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const api = await serverCoreApi();
  const org = unwrap(await api.GET('/v1/organizations/{id}', { params: { path: { id: orgId } } }));
  const canInvite = org.access.permissions.includes('members.invite');

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {org.access.role} · {org.settings.currency} · {org.settings.timezone}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your workspace is ready</CardTitle>
          <CardDescription>
            Enquiries, bookings, payments and revenue will appear here as those features are
            switched on for your business. There is nothing to show yet.
          </CardDescription>
        </CardHeader>
        {canInvite ? (
          <CardContent>
            <Button asChild>
              <Link href={`/o/${org.id}/members`}>Invite your team</Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
