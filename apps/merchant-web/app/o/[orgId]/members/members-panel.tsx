'use client';

import { Alert } from '@krinly/ui/components/alert';
import { Button } from '@krinly/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@krinly/ui/components/card';
import { Field } from '@krinly/ui/components/field';
import { Input, Select } from '@krinly/ui/components/input';
import { browserCoreApi } from '@krinly/web-auth/browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiErrorMessage } from '@/lib/api-messages';

// Roles that can be granted through invitations. core-api decides what the inviter may grant.
const INVITABLE_ROLES = [
  { key: 'member', label: 'Member' },
  { key: 'admin', label: 'Admin' },
] as const;

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export function MembersPanel({
  organizationId,
  canInvite,
}: {
  organizationId: string;
  canInvite: boolean;
}) {
  const queryClient = useQueryClient();
  const path = { params: { path: { id: organizationId } } };

  const members = useQuery({
    queryKey: ['members', organizationId],
    queryFn: async () => {
      const { data, error } = await (
        await browserCoreApi()
      ).GET('/v1/organizations/{id}/members', path);
      if (!data) throw new Error(apiErrorMessage(error));
      return data.members;
    },
  });

  const invitations = useQuery({
    queryKey: ['invitations', organizationId],
    enabled: canInvite,
    queryFn: async () => {
      const { data, error } = await (
        await browserCoreApi()
      ).GET('/v1/organizations/{id}/invitations', path);
      if (!data) throw new Error(apiErrorMessage(error));
      return data.invitations;
    },
  });

  const invite = useMutation({
    mutationFn: async (body: { email: string; roleKey: string }) => {
      const { data, error } = await (
        await browserCoreApi()
      ).POST('/v1/organizations/{id}/invitations', {
        ...path,
        body,
      });
      if (!data) throw new Error(apiErrorMessage(error));
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] }),
  });

  const [email, setEmail] = useState('');
  const [roleKey, setRoleKey] = useState<string>('member');

  function onInvite() {
    invite.mutate(
      { email, roleKey },
      {
        onSuccess: () => {
          setEmail('');
        },
      },
    );
  }

  return (
    <div className="grid gap-6">
      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
            <CardDescription>
              They will need to sign in with this email address to accept. Invitations expire after
              7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form
              action={onInvite}
              className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
            >
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
              </Field>
              <Field label="Role">
                <Select
                  value={roleKey}
                  onChange={(e) => {
                    setRoleKey(e.target.value);
                  }}
                >
                  {INVITABLE_ROLES.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? 'Sending…' : 'Create invitation'}
              </Button>
            </form>
            {invite.error ? <Alert variant="destructive">{invite.error.message}</Alert> : null}
            {invite.data ? (
              <InviteLink url={invite.data.acceptUrl} email={invite.data.invitation.email} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.isPending ? (
            <p className="text-sm text-muted-foreground">Loading members…</p>
          ) : null}
          {members.error ? <Alert variant="destructive">{members.error.message}</Alert> : null}
          {members.data ? (
            <ul className="divide-y">
              {members.data.map((m) => (
                <li
                  key={m.membershipId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{m.fullName ?? m.email}</span>
                    {m.fullName ? (
                      <span className="block text-muted-foreground">{m.email}</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">
                    {m.role.name}
                    {m.status === 'active' ? '' : ` · ${m.status}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {canInvite ? (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.isPending ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : null}
            {invitations.error ? (
              <Alert variant="destructive">{invitations.error.message}</Alert>
            ) : null}
            {invitations.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : null}
            {invitations.data?.length ? (
              <ul className="divide-y">
                {invitations.data.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <span className="font-medium">{i.email}</span>
                    <span className="text-muted-foreground">
                      {i.role.name} · expires {dateFormat.format(new Date(i.expiresAt))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InviteLink({ url, email }: { url: string; email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Alert>
      <p className="mb-2">
        Invitation created for <strong>{email}</strong>. Share this link with them; it is shown only
        once.
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          aria-label="Invitation link"
          onFocus={(e) => {
            e.target.select();
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
            });
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </Alert>
  );
}
