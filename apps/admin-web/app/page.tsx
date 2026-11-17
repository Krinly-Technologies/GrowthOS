import { Button } from '@krinly/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { serverCoreApi } from '@krinly/web-auth/server';

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

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
                {data.activeGrants.map((grant) => (
                  <li key={grant.id} className="grid gap-1 py-3 text-sm">
                    <span className="font-medium">{grant.organization.name}</span>
                    <span className="text-muted-foreground">
                      {grant.reason} · until {dateTime.format(new Date(grant.expiresAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
