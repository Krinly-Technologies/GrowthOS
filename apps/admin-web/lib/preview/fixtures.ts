// Fictional fixtures for the admin support preview. Nothing here is real merchant data — see
// `lib/preview/guard.ts` for why this exists and how it's gated.

export type GrantState = 'active' | 'expiring_soon' | 'expired';

export interface SupportGrant {
  id: string;
  workspaceId: string;
  workspaceName: string;
  reason: string;
  purpose: string;
  grantedAt: string;
  expiresAt: string;
  state: GrantState;
}

const NOW = Date.now();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const SUPPORT_GRANTS: SupportGrant[] = [
  {
    id: 'grant-1',
    workspaceId: 'ws-1',
    workspaceName: 'Bloom & Co Studio',
    reason: 'Merchant reported a payment verification issue',
    purpose: 'Investigate a stuck payment status',
    grantedAt: new Date(NOW - 2 * DAY).toISOString(),
    expiresAt: new Date(NOW + 5 * DAY).toISOString(),
    state: 'active',
  },
  {
    id: 'grant-2',
    workspaceId: 'ws-2',
    workspaceName: 'Artisan Bridal House',
    reason: 'Onboarding support for the new Automation module',
    purpose: 'Walk the merchant through setting up their first automation',
    grantedAt: new Date(NOW - 6 * DAY).toISOString(),
    expiresAt: new Date(NOW + 6 * HOUR).toISOString(),
    state: 'expiring_soon',
  },
  {
    id: 'grant-3',
    workspaceId: 'ws-3',
    workspaceName: 'Studio Nine Makeovers',
    reason: 'Data export request, now resolved',
    purpose: 'One-time CSV export of booking history',
    grantedAt: new Date(NOW - 20 * DAY).toISOString(),
    expiresAt: new Date(NOW - 13 * DAY).toISOString(),
    state: 'expired',
  },
];

export interface SupportActivity {
  id: string;
  at: string;
  actor: string;
  action: string;
}

export const SUPPORT_ACTIVITY: Record<string, SupportActivity[]> = {
  'ws-1': [
    {
      id: 'a1',
      at: new Date(NOW - 2 * HOUR).toISOString(),
      actor: 'Operator (you)',
      action: 'Viewed the payments list',
    },
    {
      id: 'a2',
      at: new Date(NOW - 1 * DAY).toISOString(),
      actor: 'Merchant — Priya',
      action: 'Reported a stuck payment',
    },
  ],
  'ws-2': [
    {
      id: 'a3',
      at: new Date(NOW - 3 * HOUR).toISOString(),
      actor: 'Operator (you)',
      action: 'Reviewed automation templates with the merchant',
    },
  ],
  'ws-3': [
    {
      id: 'a4',
      at: new Date(NOW - 14 * DAY).toISOString(),
      actor: 'Operator (you)',
      action: 'Exported booking history to CSV',
    },
    {
      id: 'a5',
      at: new Date(NOW - 13 * DAY).toISOString(),
      actor: 'System',
      action: 'Access grant expired',
    },
  ],
};

export interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'resolved';
}

export const SUPPORT_TICKETS: Record<string, SupportTicket[]> = {
  'ws-1': [{ id: 't1', subject: 'Payment shows recorded, not verified', status: 'open' }],
  'ws-2': [{ id: 't2', subject: 'How do automation templates work?', status: 'resolved' }],
  'ws-3': [{ id: 't3', subject: 'CSV export request', status: 'resolved' }],
};
