'use client';

import { Badge } from '@krinly/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { EmptyState } from '@krinly/ui/components/feedback';
import { useState } from 'react';
import {
  type GrantState,
  SUPPORT_ACTIVITY,
  SUPPORT_GRANTS,
  SUPPORT_TICKETS,
} from '@/lib/preview/fixtures';

const dateTime = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const STATE_LABEL: Record<GrantState, string> = {
  active: 'Active',
  expiring_soon: 'Expiring soon',
  expired: 'Expired',
};

const STATE_TONE: Record<GrantState, 'verified' | 'attention' | 'critical'> = {
  active: 'verified',
  expiring_soon: 'attention',
  expired: 'critical',
};

/**
 * A fictional support overview per authorized workspace — grant scope, recent activity and
 * support tickets — plus the access-denied and expired-access states, none of which core-api
 * exposes an endpoint for yet. See `lib/preview/fixtures.ts`.
 */
export function SupportDashboard() {
  const [selectedId, setSelectedId] = useState(SUPPORT_GRANTS[0]?.id ?? '');
  const grant = SUPPORT_GRANTS.find((g) => g.id === selectedId) ?? null;
  const expired = grant?.state === 'expired';

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authorized workspaces</CardTitle>
          <CardDescription>Fictional grants, for demonstrating every access state.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1">
          {SUPPORT_GRANTS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setSelectedId(g.id);
              }}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                g.id === selectedId ? 'bg-accent text-brand' : 'hover:bg-muted'
              }`}
            >
              <span className="font-medium">{g.workspaceName}</span>
              <Badge tone={STATE_TONE[g.state]}>{STATE_LABEL[g.state]}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {!grant ? (
        <Card>
          <CardContent>
            <EmptyState
              icon="store"
              title="No workspace selected"
              description="Choose one on the left."
            />
          </CardContent>
        </Card>
      ) : expired ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access expired</CardTitle>
            <CardDescription>
              Your access grant for {grant.workspaceName} expired on{' '}
              {dateTime.format(new Date(grant.expiresAt))}. Request a new grant from the merchant to
              continue supporting this workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{grant.workspaceName}</CardTitle>
              <CardDescription>
                {grant.purpose} · granted {dateTime.format(new Date(grant.grantedAt))} · expires{' '}
                {dateTime.format(new Date(grant.expiresAt))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Reason on file: {grant.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {(SUPPORT_ACTIVITY[grant.workspaceId] ?? []).map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <span className="font-medium">{entry.actor}</span> — {entry.action}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {dateTime.format(new Date(entry.at))}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {(SUPPORT_TICKETS[grant.workspaceId] ?? []).map((ticket) => (
                  <li key={ticket.id} className="flex items-center justify-between text-sm">
                    <span>{ticket.subject}</span>
                    <Badge tone={ticket.status === 'resolved' ? 'verified' : 'attention'}>
                      {ticket.status === 'resolved' ? 'Resolved' : 'Open'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
