import { Badge } from '@krinly/ui/components/badge';
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

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

function isExpiringSoon(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() - Date.now() <= EXPIRING_SOON_MS;
}

function SignOut() {
  return (
    <form action="/auth/signout" method="post">
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}

/**
 * Operator access is decided by core-api (`GET /v1/operator/session`), never by this app.
 * Non-operators see only a refusal; no operational data is fetched for them.
 */
export default async function AdminHomePage() {
  const api = await serverCoreApi();
  const { data, response } = await api.GET('/v1/operator/session');

  if (response.status === 403 || !data) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">Access restricted</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {response.status === 403
            ? 'This account is not authorised for Krinly operations.'
            : 'Operator access could not be verified. Please try again.'}
        </p>
        <SignOut />
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight">Krinly Operations</span>
          <span className="ml-auto text-sm text-muted-foreground">{data.operator.email}</span>
          <SignOut />
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Merchant access grants</CardTitle>
            <CardDescription>
              Merchants grant time-limited access to their workspace. You can only see workspaces
              with an active grant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.activeGrants.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no active access grants.</p>
            ) : (
              <ul className="divide-y">
                {data.activeGrants.map((grant) => {
                  const expiringSoon = isExpiringSoon(grant.expiresAt);
                  return (
                    <li
                      key={grant.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div className="grid gap-1">
                        <span className="flex items-center gap-2 font-medium">
                          {grant.organization.name}
                          <Badge tone={expiringSoon ? 'attention' : 'verified'}>
                            {expiringSoon ? 'Expiring soon' : 'Active'}
                          </Badge>
                        </span>
                        <span className="text-muted-foreground">
                          {grant.reason} · until {dateTime.format(new Date(grant.expiresAt))}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support preview</CardTitle>
            <CardDescription>
              A deeper support workspace — fictional data, for demonstrating screens core-api
              doesn&apos;t have an endpoint for yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/preview">Open the development preview</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
