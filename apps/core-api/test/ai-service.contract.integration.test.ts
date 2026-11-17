import { type ChildProcess, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AiServiceClient } from '../src/ai/ai-service.client.js';
import { createApp } from '../src/app.js';
import { parseEnv } from '../src/config.js';
import { ApiException } from '../src/http/errors.js';
import { auth, createUser, uniqueSlug } from './support/harness.js';

// Runs the real FastAPI application (with a deterministic fake model) as a separate process and
// calls it from NestJS, proving both sides agree on the contract and service authentication.

const AI_SERVICE_DIR = fileURLToPath(new URL('../../ai-service/', import.meta.url));
const SERVICE_TOKEN = randomBytes(32).toString('base64url');

let aiProcess: ChildProcess;
let aiUrl: string;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') resolve(address.port);
        else reject(new Error('No port assigned'));
      });
    });
  });
}

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const healthy = await fetch(`${url}/health`).then(
      (r) => r.ok,
      () => false,
    );
    if (healthy) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`AI service did not become healthy at ${url}`);
}

beforeAll(async () => {
  const port = await freePort();
  aiUrl = `http://127.0.0.1:${port}`;
  aiProcess = spawn('uv', ['run', 'python', '-m', 'tests.contract_server', String(port)], {
    cwd: AI_SERVICE_DIR,
    env: { ...process.env, SERVICE_TOKEN },
    stdio: 'inherit',
  });
  await waitForHealth(aiUrl, 45_000);
});

afterAll(async () => {
  const exited = new Promise((resolve) => aiProcess.once('exit', resolve));
  // `uv run` starts Python as a child process; stop the whole tree.
  if (process.platform === 'win32' && aiProcess.pid) {
    spawn('taskkill', ['/pid', String(aiProcess.pid), '/T', '/F']);
  } else {
    aiProcess.kill('SIGTERM');
  }
  await exited;
});

function client(token = SERVICE_TOKEN): AiServiceClient {
  return new AiServiceClient({ baseUrl: aiUrl, serviceToken: token, timeoutMs: 5_000 });
}

describe('core-api ↔ ai-service contract', () => {
  it('invokes triage and validates the structured response', async () => {
    const result = await client().triage(
      {
        organization_id: '00000000-0000-4000-8000-000000000001',
        channel: 'web',
        message: 'Table for 2?',
      },
      'contract-test-0001',
    );
    expect(result).toEqual({
      intent: 'booking_request',
      confidence: 0.9,
      summary: 'Customer wants to book a table',
      outcome: 'propose_reply',
      proposed_reply: 'Thank you! We will confirm your booking shortly.',
      review_reason: null,
    });
  });

  it('is rejected by the AI service with invalid service credentials', async () => {
    const raw = await fetch(`${aiUrl}/internal/v1/enquiries/triage`, {
      method: 'POST',
      headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' },
      body: '{}',
    });
    expect(raw.status).toBe(401);

    await expect(
      client('a-wrong-token-that-is-long-enough-0000').triage(
        { organization_id: '00000000-0000-4000-8000-000000000001', channel: 'web', message: 'hi' },
        'contract-test-0002',
      ),
    ).rejects.toMatchObject({ code: 'AI_SERVICE_ERROR' } satisfies Partial<ApiException>);
  });

  it('serves an authorized proposal through the public core-api endpoint', async () => {
    const app: NestFastifyApplication = await createApp(
      parseEnv({
        NODE_ENV: 'test',
        LOG_LEVEL: 'warn',
        DATABASE_URL: process.env.DATABASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        MERCHANT_APP_URL: 'http://localhost:3000',
        AI_SERVICE_URL: aiUrl,
        AI_SERVICE_TOKEN: SERVICE_TOKEN,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    try {
      const owner = await createUser('ai-owner');
      const outsider = await createUser('ai-outsider');
      const org = await app.inject({
        method: 'POST',
        url: '/v1/organizations',
        headers: auth(owner),
        payload: { name: 'AI Org', slug: uniqueSlug('ai') },
      });
      const orgId = org.json<{ id: string }>().id;
      const payload = { channel: 'whatsapp', message: 'Can I book for Saturday?' };

      const res = await app.inject({
        method: 'POST',
        url: `/v1/organizations/${orgId}/ai/enquiry-triage`,
        headers: auth(owner),
        payload,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ outcome: 'propose_reply', intent: 'booking_request' });

      const denied = await app.inject({
        method: 'POST',
        url: `/v1/organizations/${orgId}/ai/enquiry-triage`,
        headers: auth(outsider),
        payload,
      });
      expect(denied.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
