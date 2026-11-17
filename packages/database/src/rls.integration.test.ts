import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Exercises the database policy boundary directly, connected as the real runtime role
// (`krinly_app`), independent of any application-level authorization.

const admin = new pg.Pool({ connectionString: process.env.DATABASE_MIGRATION_URL });
// One connection, so tests also prove transaction-local context does not leak between uses.
const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

afterAll(async () => {
  await Promise.all([admin.end(), runtime.end()]);
});

async function createAuthUser(label: string): Promise<string> {
  const id = randomUUID();
  await admin.query(
    `insert into auth.users (id, email, email_confirmed_at, aud, role)
     values ($1, $2, now(), 'authenticated', 'authenticated')`,
    [id, `${label}-${id}@example.test`],
  );
  return id;
}

async function asUser<T>(
  userId: string | null,
  work: (c: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await runtime.connect();
  try {
    await client.query('begin');
    if (userId) await client.query(`select set_config('app.user_id', $1, true)`, [userId]);
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function createOrg(userId: string): Promise<string> {
  const slug = `rls-${randomUUID().slice(0, 8)}`;
  const { rows } = await asUser(userId, (c) =>
    c.query<{ id: string }>('select app.create_organization($1, $2) as id', ['RLS Test Org', slug]),
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('create_organization returned nothing');
  return id;
}

async function roleId(key: string): Promise<string> {
  const { rows } = await admin.query<{ id: string }>('select id from roles where key = $1', [key]);
  const id = rows[0]?.id;
  if (!id) throw new Error(`Missing role ${key}`);
  return id;
}

const PERMISSION_DENIED = '42501';

let alice: string;
let bob: string;
let carol: string;
let aliceOrg: string;
let bobOrg: string;

beforeAll(async () => {
  [alice, bob, carol] = await Promise.all([
    createAuthUser('alice'),
    createAuthUser('bob'),
    createAuthUser('carol'),
  ]);
  aliceOrg = await createOrg(alice);
  bobOrg = await createOrg(bob);
  // Carol is a plain member of Alice's organization.
  await admin.query(
    'insert into organization_memberships (organization_id, user_id, role_id) values ($1, $2, $3)',
    [aliceOrg, carol, await roleId('member')],
  );
});

describe('runtime role', () => {
  it('is not a superuser, cannot bypass RLS and does not own the tables', async () => {
    const { rows } = await runtime.query<{
      role: string;
      super: boolean;
      bypass: boolean;
      owns: number;
    }>(
      `select current_user as role, r.rolsuper as super, r.rolbypassrls as bypass,
              (select count(*)::int from pg_tables where schemaname = 'public' and tableowner = current_user) as owns
       from pg_roles r where r.rolname = current_user`,
    );
    expect(rows).toEqual([{ role: 'krinly_app', super: false, bypass: false, owns: 0 }]);
  });

  it('cannot switch to a privileged role', async () => {
    await expect(runtime.query('set role postgres')).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
  });
});

describe('tenant isolation without application checks', () => {
  it('sees nothing without a user context', async () => {
    const { rows } = await asUser(null, (c) => c.query('select id from organizations'));
    expect(rows).toEqual([]);
    await expect(
      asUser(null, (c) => c.query(`select app.create_organization('x', 'no-user-org')`)),
    ).rejects.toMatchObject({ code: '28000' });
  });

  it('reads only organizations the user belongs to', async () => {
    const { rows } = await asUser(alice, (c) =>
      c.query<{ id: string }>('select id from organizations where id = any($1)', [
        [aliceOrg, bobOrg],
      ]),
    );
    expect(rows.map((r) => r.id)).toEqual([aliceOrg]);

    const members = await asUser(alice, (c) =>
      c.query('select 1 from organization_memberships where organization_id = $1', [bobOrg]),
    );
    expect(members.rowCount).toBe(0);
  });

  it('cannot update another tenant', async () => {
    const result = await asUser(alice, (c) =>
      c.query(`update organizations set name = 'pwned' where id = $1`, [bobOrg]),
    );
    expect(result.rowCount).toBe(0);
  });

  it('does not leak the user context to the next transaction on the same connection', async () => {
    await asUser(alice, (c) => c.query('select 1'));
    const { rows } = await asUser(null, (c) => c.query('select id from organizations'));
    expect(rows).toEqual([]);
  });
});

describe('privilege escalation is blocked by the database', () => {
  it('cannot add or change memberships directly', async () => {
    const ownerRole = await roleId('owner');
    await expect(
      asUser(alice, (c) =>
        c.query(
          'insert into organization_memberships (organization_id, user_id, role_id) values ($1, $2, $3)',
          [bobOrg, alice, ownerRole],
        ),
      ),
    ).rejects.toMatchObject({ code: PERMISSION_DENIED });
    await expect(
      asUser(carol, (c) =>
        c.query('update organization_memberships set role_id = $1 where user_id = $2', [
          ownerRole,
          carol,
        ]),
      ),
    ).rejects.toMatchObject({ code: PERMISSION_DENIED });
  });

  it('cannot make itself a platform operator', async () => {
    await expect(
      asUser(alice, (c) =>
        c.query('update profiles set is_platform_operator = true where id = $1', [alice]),
      ),
    ).rejects.toMatchObject({ code: PERMISSION_DENIED });
  });

  it('only lets permitted users invite, and never with a role above their own', async () => {
    const invite = (userId: string, orgId: string, role: string) =>
      roleId(role).then((id) =>
        asUser(userId, (c) =>
          c.query(
            `insert into organization_invitations (organization_id, email, role_id, token_hash, invited_by, expires_at)
             values ($1, $2, $3, $4, $5, now() + interval '1 day')`,
            [orgId, `${randomUUID()}@example.test`, id, Buffer.alloc(32, randomUUID()), userId],
          ),
        ),
      );

    await expect(invite(alice, bobOrg, 'member')).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
    await expect(invite(alice, aliceOrg, 'owner')).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
    await expect(invite(carol, aliceOrg, 'member')).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
    await expect(invite(alice, aliceOrg, 'admin')).resolves.toMatchObject({ rowCount: 1 });
  });

  it('keeps the audit log append-only and the outbox write-only', async () => {
    await expect(asUser(alice, (c) => c.query('delete from audit_logs'))).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
    await expect(
      asUser(alice, (c) => c.query(`update audit_logs set action = 'x.y'`)),
    ).rejects.toMatchObject({ code: PERMISSION_DENIED });
    await expect(
      asUser(alice, (c) => c.query('select * from outbox_events')),
    ).rejects.toMatchObject({
      code: PERMISSION_DENIED,
    });
  });
});

describe('Supabase Data API roles', () => {
  it.each(['anon', 'authenticated'])('%s has no access to tenant tables', async (role) => {
    const client = await admin.connect();
    try {
      await client.query('begin');
      await client.query(`set local role ${role}`);
      await expect(client.query('select * from organizations')).rejects.toMatchObject({
        code: PERMISSION_DENIED,
      });
    } finally {
      await client.query('rollback');
      client.release();
    }
  });
});
