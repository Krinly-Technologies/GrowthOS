import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import pg from 'pg';
import { createApp } from '../../src/app.js';
import { parseEnv } from '../../src/config.js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; is global setup configured?`);
  return value;
}

export async function startApp(): Promise<NestFastifyApplication> {
  const app = await createApp(
    parseEnv({
      NODE_ENV: 'test',
      LOG_LEVEL: 'warn',
      DATABASE_URL: required('DATABASE_URL'),
      SUPABASE_URL: required('SUPABASE_URL'),
      MERCHANT_APP_URL: 'http://localhost:3000',
    }),
  );
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

/** Privileged connection for arranging test state the API deliberately cannot change. */
export function adminDb(): pg.Pool {
  return new pg.Pool({ connectionString: required('DATABASE_MIGRATION_URL') });
}

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

const PASSWORD = 'integration-test-password';

/** Creates a confirmed user through Supabase Auth and signs in to obtain a real access token. */
export async function createUser(label: string): Promise<TestUser> {
  const supabaseUrl = required('SUPABASE_URL');
  const secretKey = required('SUPABASE_SECRET_KEY');
  const email = `${label}-${randomUUID()}@example.test`;

  const created = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: secretKey,
      authorization: `Bearer ${secretKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true }),
  });
  if (!created.ok)
    throw new Error(`Creating user failed: ${created.status} ${await created.text()}`);
  const user = (await created.json()) as { id: string };

  const session = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: required('SUPABASE_PUBLISHABLE_KEY'), 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!session.ok) throw new Error(`Sign-in failed: ${session.status} ${await session.text()}`);
  const { access_token } = (await session.json()) as { access_token: string };

  return { id: user.id, email, token: access_token };
}

export function auth(user: TestUser): { authorization: string } {
  return { authorization: `Bearer ${user.token}` };
}

export function uniqueSlug(prefix = 'org'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
