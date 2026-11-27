'use client';

import { Badge } from '@krinly/ui/components/badge';
import { Button } from '@krinly/ui/components/button';
import { Card, CardDescription, CardTitle } from '@krinly/ui/components/card';
import { Choice, Field } from '@krinly/ui/components/field';
import { Select } from '@krinly/ui/components/input';
import { useWorkspaceConfig } from '@/lib/preview/workspace-config';
import {
  CHANNEL_LABEL,
  INTEGRATION_LABEL,
  NOTIFICATION_LABEL,
} from '@/lib/preview/workspace-domain';
import { fullDate } from '@/lib/preview/format';

const SUPPORT_TICKETS: { id: string; subject: string; status: 'open' | 'resolved' }[] = [
  { id: 'tk-1', subject: 'Payment verification question', status: 'resolved' },
  { id: 'tk-2', subject: 'How to re-send a quotation', status: 'resolved' },
];

const AUDIT_LOG = [
  { id: 'a1', actor: 'Farah', action: 'Verified a payment of ₹18,000' },
  { id: 'a2', actor: 'Rohan', action: 'Created a booking for 14 Feb' },
  { id: 'a3', actor: 'Farah', action: 'Invited divya@example.com to the team' },
];

/**
 * Settings categories with no real backend yet, simulated here with local state — see
 * `/o/[orgId]/settings` for what's actually connected today, and CLAUDE.md on provisional
 * previews never standing in for production authorization.
 */
export function SettingsWorkspace({ now }: { now: number }) {
  const { state, dispatch } = useWorkspaceConfig();

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Workspace settings</h1>
        <p className="mt-1 text-sm text-ink-2">
          A simulated preview of settings categories not yet wired to a real workspace. Business
          profile, team and account preferences already work — see them at Settings in your
          workspace.
        </p>
      </div>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Communication channels</CardTitle>
        <CardDescription className="mt-1">
          Which channels your team and assistant can use. Nothing here sends a real message.
        </CardDescription>
        <div className="mt-3 grid gap-0.5">
          {(Object.keys(CHANNEL_LABEL) as (keyof typeof CHANNEL_LABEL)[]).map((key) => (
            <Choice
              key={key}
              label={CHANNEL_LABEL[key]}
              checked={state.channels[key]}
              onChange={() => {
                dispatch({ type: 'toggleChannel', key });
              }}
            />
          ))}
        </div>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Integrations</CardTitle>
        <CardDescription className="mt-1">
          Simulated connections only — no real credentials are stored or requested here.
        </CardDescription>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(INTEGRATION_LABEL) as (keyof typeof INTEGRATION_LABEL)[]).map((key) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{INTEGRATION_LABEL[key]}</p>
                <Badge tone={state.integrations[key] ? 'verified' : 'neutral'} className="mt-1">
                  {state.integrations[key] ? 'Connected' : 'Not connected'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  dispatch({ type: 'toggleIntegration', key });
                }}
              >
                {state.integrations[key] ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Notifications</CardTitle>
        <div className="mt-3 grid gap-0.5">
          {(Object.keys(NOTIFICATION_LABEL) as (keyof typeof NOTIFICATION_LABEL)[]).map((key) => (
            <Choice
              key={key}
              label={NOTIFICATION_LABEL[key]}
              checked={state.notifications[key]}
              onChange={() => {
                dispatch({ type: 'toggleNotification', key });
              }}
            />
          ))}
        </div>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Regional preferences</CardTitle>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <Field label="Timezone">
            <Select
              value={state.regional.timezone}
              onChange={(e) => {
                dispatch({
                  type: 'updateRegional',
                  regional: { ...state.regional, timezone: e.target.value },
                });
              }}
            >
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Dubai">Gulf (GST)</option>
            </Select>
          </Field>
          <Field label="Currency">
            <Select
              value={state.regional.currency}
              onChange={(e) => {
                dispatch({
                  type: 'updateRegional',
                  regional: { ...state.regional, currency: e.target.value },
                });
              }}
            >
              <option value="INR">₹ INR</option>
              <option value="AED">AED</option>
            </Select>
          </Field>
          <Field label="Date format">
            <Select
              value={state.regional.dateFormat}
              onChange={(e) => {
                dispatch({
                  type: 'updateRegional',
                  regional: { ...state.regional, dateFormat: e.target.value },
                });
              }}
            >
              <option value="DD MMM YYYY">25 Nov 2026</option>
              <option value="MM/DD/YYYY">11/25/2026</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Support access</CardTitle>
        <ul className="mt-3 divide-y divide-line-soft">
          {SUPPORT_TICKETS.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink">{t.subject}</span>
              <Badge tone={t.status === 'resolved' ? 'verified' : 'attention'}>
                {t.status === 'resolved' ? 'Resolved' : 'Open'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="lg" className="min-w-0">
        <CardTitle className="text-lg">Activity & audit</CardTitle>
        <ul className="mt-3 grid gap-2 text-sm">
          {AUDIT_LOG.map((entry) => (
            <li key={entry.id} className="text-ink-2">
              <span className="font-semibold text-ink">{entry.actor}</span> — {entry.action}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-ink-3">
          Fictional activity shown as of {fullDate(now)}.
        </p>
      </Card>
    </div>
  );
}
