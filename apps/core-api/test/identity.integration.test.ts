import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  adminDb,
  auth,
  createUser,
  startApp,
  type TestUser,
  uniqueSlug,
} from './support/harness.js';

let app: NestFastifyApplication;
let db: pg.Pool;

beforeAll(async () => {
  app = await startApp();
  db = adminDb();
});

afterAll(async () => {
  await app.close();
  await db.end();
});

async function createOrg(user: TestUser, name = 'Acme Traders') {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/organizations',
    headers: auth(user),
    payload: { name, slug: uniqueSlug() },
  });
  expect(res.statusCode).toBe(201);
  return res.json<{ id: string; slug: string; access: { role: string; permissions: string[] } }>();
}

async function invite(owner: TestUser, orgId: string, email: string, roleKey: string) {
  return app.inject({
    method: 'POST',
    url: `/v1/organizations/${orgId}/invitations`,
    headers: auth(owner),
    payload: { email, roleKey },
  });
}

function tokenFrom(acceptUrl: string): string {
  const token = new URL(acceptUrl).pathname.split('/').pop();
  if (!token) throw new Error(`No token in ${acceptUrl}`);
  return token;
}

/** Invites `member` to the owner's organization with `roleKey` and accepts it. */
async function addMember(owner: TestUser, orgId: string, member: TestUser, roleKey: string) {
  const invited = await invite(owner, orgId, member.email, roleKey);
  expect(invited.statusCode).toBe(201);
  const accepted = await app.inject({
    method: 'POST',
    url: `/v1/invitations/${tokenFrom(invited.json<{ acceptUrl: string }>().acceptUrl)}/accept`,
    headers: auth(member),
  });
  expect(accepted.statusCode).toBe(200);
}

describe('authentication', () => {
  it('rejects requests without a token with 401 and the error contract', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/me',
      headers: { 'x-request-id': 'test-request-0001' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Missing bearer token',
        requestId: 'test-request-0001',
      },
    });
    expect(res.headers['x-request-id']).toBe('test-request-0001');
  });

  it('rejects a malformed or tampered token with 401', async () => {
    const user = await createUser('tamper');
    const [header, payload] = user.token.split('.');
    const forged = `${header}.${payload}.${Buffer.from('not-a-signature').toString('base64url')}`;
    for (const token of ['garbage', forged]) {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/me',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(401);
    }
  });

  it('returns the profile for a verified Supabase session', async () => {
    const user = await createUser('me');
    const res = await app.inject({ method: 'GET', url: '/v1/me', headers: auth(user) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      id: user.id,
      email: user.email,
      fullName: null,
      isPlatformOperator: false,
    });
  });

  it('serves health and readiness without authentication', async () => {
    expect((await app.inject({ method: 'GET', url: '/v1/health' })).json()).toEqual({
      status: 'ok',
    });
    const ready = await app.inject({ method: 'GET', url: '/v1/ready' });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toEqual({ status: 'ready', checks: { database: 'ok' } });
  });
});

describe('organization creation', () => {
  it('creates exactly one owner membership, settings, an audit entry and an outbox event atomically', async () => {
    const owner = await createUser('owner');
    const org = await createOrg(owner);
    expect(org.access.role).toBe('owner');
    expect(org.access.permissions).toContain('members.invite');

    const memberships = await db.query(
      `select m.user_id, r.key from organization_memberships m join roles r on r.id = m.role_id
       where m.organization_id = $1`,
      [org.id],
    );
    expect(memberships.rows).toEqual([{ user_id: owner.id, key: 'owner' }]);

    const settings = await db.query(
      'select currency, timezone from organization_settings where organization_id = $1',
      [org.id],
    );
    expect(settings.rows).toEqual([{ currency: 'INR', timezone: 'Asia/Kolkata' }]);

    const audit = await db.query(
      'select action, actor_user_id from audit_logs where organization_id = $1',
      [org.id],
    );
    expect(audit.rows).toEqual([{ action: 'organization.created', actor_user_id: owner.id }]);

    const outbox = await db.query(
      'select event_type, dispatched_at from outbox_events where organization_id = $1',
      [org.id],
    );
    expect(outbox.rows).toEqual([{ event_type: 'organization.created', dispatched_at: null }]);

    const mine = await app.inject({
      method: 'GET',
      url: '/v1/me/organizations',
      headers: auth(owner),
    });
    expect(mine.json()).toEqual({
      organizations: [
        {
          id: org.id,
          name: 'Acme Traders',
          slug: org.slug,
          status: 'active',
          role: { key: 'owner', name: 'Owner' },
        },
      ],
    });
  });

  it('rolls back everything when the slug is taken', async () => {
    const first = await createUser('slug-a');
    const second = await createUser('slug-b');
    const slug = uniqueSlug('taken');
    const ok = await app.inject({
      method: 'POST',
      url: '/v1/organizations',
      headers: auth(first),
      payload: { name: 'First', slug },
    });
    expect(ok.statusCode).toBe(201);

    const res = await app.inject({
      method: 'POST',
      url: '/v1/organizations',
      headers: auth(second),
      payload: { name: 'Second', slug },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ error: { code: 'SLUG_TAKEN' } });
    const leftovers = await db.query('select 1 from organization_memberships where user_id = $1', [
      second.id,
    ]);
    expect(leftovers.rowCount).toBe(0);
  });

  it('rejects invalid input with 400 and field details', async () => {
    const user = await createUser('invalid');
    const res = await app.inject({
      method: 'POST',
      url: '/v1/organizations',
      headers: auth(user),
      payload: { name: 'x', slug: 'Bad Slug!', role: 'owner' },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ error: { code: string; details: { path: string }[] } }>();
    expect(body.error.code).toBe('VALIDATION_FAILED');
    expect(body.error.details.map((d) => d.path).sort()).toEqual(['', 'name', 'slug']);

    const badId = await app.inject({
      method: 'GET',
      url: '/v1/organizations/not-a-uuid',
      headers: auth(user),
    });
    expect(badId.statusCode).toBe(400);
  });
});

describe('tenant isolation', () => {
  it('hides other organizations from non-members with 404 on reads and writes', async () => {
    const owner = await createUser('iso-owner');
    const outsider = await createUser('iso-outsider');
    const org = await createOrg(owner);

    for (const url of [
      `/v1/organizations/${org.id}`,
      `/v1/organizations/${org.id}/members`,
      `/v1/organizations/${org.id}/invitations`,
    ]) {
      const res = await app.inject({ method: 'GET', url, headers: auth(outsider) });
      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ error: { code: 'ORGANIZATION_NOT_FOUND' } });
    }
    const write = await invite(outsider, org.id, 'friend@example.test', 'member');
    expect(write.statusCode).toBe(404);

    const mine = await app.inject({
      method: 'GET',
      url: '/v1/me/organizations',
      headers: auth(outsider),
    });
    expect(mine.json()).toEqual({ organizations: [] });
  });

  it('lets a user switch between organizations they belong to, each with its own role', async () => {
    const alice = await createUser('switch-alice');
    const bob = await createUser('switch-bob');
    const aliceOrg = await createOrg(alice, 'Alice Co');
    const bobOrg = await createOrg(bob, 'Bob Co');
    await addMember(bob, bobOrg.id, alice, 'member');

    const mine = await app.inject({
      method: 'GET',
      url: '/v1/me/organizations',
      headers: auth(alice),
    });
    expect(
      mine
        .json<{ organizations: { id: string; role: { key: string } }[] }>()
        .organizations.map((o) => [o.id, o.role.key]),
    ).toEqual([
      [aliceOrg.id, 'owner'],
      [bobOrg.id, 'member'],
    ]);
    const detail = await app.inject({
      method: 'GET',
      url: `/v1/organizations/${bobOrg.id}`,
      headers: auth(alice),
    });
    expect(detail.json<{ access: { role: string } }>().access.role).toBe('member');
  });
});

describe('roles and privilege escalation', () => {
  it('forbids members without members.invite from inviting', async () => {
    const owner = await createUser('perm-owner');
    const member = await createUser('perm-member');
    const org = await createOrg(owner);
    await addMember(owner, org.id, member, 'member');

    const res = await invite(member, org.id, 'someone@example.test', 'member');
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: { code: 'PERMISSION_DENIED' } });
  });

  it('never grants the owner role through an invitation', async () => {
    const owner = await createUser('esc-owner');
    const org = await createOrg(owner);
    const res = await invite(owner, org.id, 'new-owner@example.test', 'owner');
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: { code: 'ROLE_NOT_GRANTABLE' } });
  });

  it('lets an admin invite admins and members but not owners', async () => {
    const owner = await createUser('admin-owner');
    const admin = await createUser('admin-admin');
    const org = await createOrg(owner);
    await addMember(owner, org.id, admin, 'admin');

    expect((await invite(admin, org.id, 'a2@example.test', 'admin')).statusCode).toBe(201);
    expect((await invite(admin, org.id, 'm2@example.test', 'member')).statusCode).toBe(201);
    expect((await invite(admin, org.id, 'o2@example.test', 'owner')).statusCode).toBe(403);
    expect((await invite(admin, org.id, 'x@example.test', 'superuser')).statusCode).toBe(400);
  });
});

describe('invitations', () => {
  it('lists members and pending invitations to permitted users', async () => {
    const owner = await createUser('list-owner');
    const org = await createOrg(owner);
    const created = await invite(owner, org.id, 'Pending@Example.test', 'member');
    expect(created.statusCode).toBe(201);
    expect(created.json<{ invitation: { email: string } }>().invitation.email).toBe(
      'pending@example.test',
    );

    const members = await app.inject({
      method: 'GET',
      url: `/v1/organizations/${org.id}/members`,
      headers: auth(owner),
    });
    expect(members.json<{ members: { email: string; role: { key: string } }[] }>().members).toEqual(
      [expect.objectContaining({ email: owner.email, role: { key: 'owner', name: 'Owner' } })],
    );
    const invitations = await app.inject({
      method: 'GET',
      url: `/v1/organizations/${org.id}/invitations`,
      headers: auth(owner),
    });
    expect(
      invitations.json<{ invitations: { email: string }[] }>().invitations.map((i) => i.email),
    ).toEqual(['pending@example.test']);

    const stored = await db.query(
      'select octet_length(token_hash) as len from organization_invitations where organization_id = $1',
      [org.id],
    );
    expect(stored.rows).toEqual([{ len: 32 }]);
  });

  it('accepts once, grants the invited role, and rejects replay', async () => {
    const owner = await createUser('replay-owner');
    const invitee = await createUser('replay-invitee');
    const org = await createOrg(owner);
    const token = tokenFrom(
      (await invite(owner, org.id, invitee.email, 'admin')).json<{ acceptUrl: string }>().acceptUrl,
    );

    const first = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${token}/accept`,
      headers: auth(invitee),
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({ organizationId: org.id });

    const replay = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${token}/accept`,
      headers: auth(invitee),
    });
    expect(replay.statusCode).toBe(410);

    const role = await db.query(
      `select r.key from organization_memberships m join roles r on r.id = m.role_id
       where m.organization_id = $1 and m.user_id = $2`,
      [org.id, invitee.id],
    );
    expect(role.rows).toEqual([{ key: 'admin' }]);
  });

  it('allows only one of two concurrent acceptances', async () => {
    const owner = await createUser('race-owner');
    const invitee = await createUser('race-invitee');
    const org = await createOrg(owner);
    const token = tokenFrom(
      (await invite(owner, org.id, invitee.email, 'member')).json<{ acceptUrl: string }>()
        .acceptUrl,
    );

    const results = await Promise.all(
      [0, 1].map(() =>
        app.inject({
          method: 'POST',
          url: `/v1/invitations/${token}/accept`,
          headers: auth(invitee),
        }),
      ),
    );
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 410]);
    const count = await db.query(
      'select count(*)::int as n from organization_memberships where organization_id = $1 and user_id = $2',
      [org.id, invitee.id],
    );
    expect(count.rows).toEqual([{ n: 1 }]);
  });

  it('rejects expired invitations', async () => {
    const owner = await createUser('exp-owner');
    const invitee = await createUser('exp-invitee');
    const org = await createOrg(owner);
    const token = tokenFrom(
      (await invite(owner, org.id, invitee.email, 'member')).json<{ acceptUrl: string }>()
        .acceptUrl,
    );
    await db.query(
      `update organization_invitations
       set created_at = now() - interval '9 days', expires_at = now() - interval '1 day'
       where organization_id = $1`,
      [org.id],
    );

    const res = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${token}/accept`,
      headers: auth(invitee),
    });
    expect(res.statusCode).toBe(410);
    expect(res.json()).toMatchObject({ error: { code: 'INVITATION_NO_LONGER_VALID' } });
  });

  it('rejects acceptance by a different account, unknown tokens and malformed tokens', async () => {
    const owner = await createUser('wrong-owner');
    const invitee = await createUser('wrong-invitee');
    const thief = await createUser('wrong-thief');
    const org = await createOrg(owner);
    const token = tokenFrom(
      (await invite(owner, org.id, invitee.email, 'member')).json<{ acceptUrl: string }>()
        .acceptUrl,
    );

    const stolen = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${token}/accept`,
      headers: auth(thief),
    });
    expect(stolen.statusCode).toBe(403);
    // The failed attempt must not consume the invitation.
    const legit = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${token}/accept`,
      headers: auth(invitee),
    });
    expect(legit.statusCode).toBe(200);

    const unknown = await app.inject({
      method: 'POST',
      url: `/v1/invitations/${'A'.repeat(43)}/accept`,
      headers: auth(invitee),
    });
    expect(unknown.statusCode).toBe(404);
    const malformed = await app.inject({
      method: 'POST',
      url: '/v1/invitations/short/accept',
      headers: auth(invitee),
    });
    expect(malformed.statusCode).toBe(400);
  });

  it('refuses to invite an existing member', async () => {
    const owner = await createUser('dup-owner');
    const org = await createOrg(owner);
    const res = await invite(owner, org.id, owner.email, 'member');
    expect(res.statusCode).toBe(409);
  });
});

describe('operator access', () => {
  it('requires the platform operator flag, which users cannot set themselves', async () => {
    const user = await createUser('operator');
    const denied = await app.inject({
      method: 'GET',
      url: '/v1/operator/session',
      headers: auth(user),
    });
    expect(denied.statusCode).toBe(403);

    await db.query('update profiles set is_platform_operator = true where id = $1', [user.id]);
    const allowed = await app.inject({
      method: 'GET',
      url: '/v1/operator/session',
      headers: auth(user),
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toEqual({
      operator: { id: user.id, email: user.email },
      activeGrants: [],
    });
  });
});
