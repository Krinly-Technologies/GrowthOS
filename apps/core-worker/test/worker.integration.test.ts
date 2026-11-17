import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '@krinly/database';
import { type Job, type Queue, QueueEvents, Worker } from 'bullmq';
import pg from 'pg';
import { pino } from 'pino';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createDomainEventProcessor } from '../src/domain-events.js';
import { dispatchOutboxBatch } from '../src/outbox-dispatcher.js';
import { createDomainEventsQueue, redisConnection } from '../src/queue.js';

// Real Redis (docker compose) and the local Supabase database, connected as `krinly_worker`.
const REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const WORKER_DATABASE_URL =
  process.env.WORKER_DATABASE_URL ??
  'postgresql://krinly_worker:krinly_worker_local@127.0.0.1:54322/postgres';
const DATABASE_MIGRATION_URL =
  process.env.DATABASE_MIGRATION_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
// Nothing listens here; used to simulate Redis being unavailable.
const UNREACHABLE_REDIS = {
  host: '127.0.0.1',
  port: 1,
  enableOfflineQueue: false,
  retryStrategy: () => null,
};

const logger = pino({ level: 'silent' });
const connection = redisConnection(REDIS_URL);
const prisma = createPrismaClient(WORKER_DATABASE_URL);
const admin = new pg.Pool({ connectionString: DATABASE_MIGRATION_URL });
const cleanup: (() => Promise<unknown>)[] = [];

function testQueue(): Queue {
  const queue = createDomainEventsQueue(connection, {
    name: `test-${randomUUID()}`,
    backoffBaseMs: 10,
  });
  cleanup.push(() => queue.obliterate({ force: true }).then(() => queue.close()));
  return queue;
}

function startWorker(queue: Queue, processor: (job: Job) => Promise<void>): Worker {
  const worker = new Worker(queue.name, processor, { connection });
  cleanup.unshift(() => worker.close());
  return worker;
}

async function waitFor(queue: Queue, jobId: string, state: 'completed' | 'failed'): Promise<void> {
  const events = new QueueEvents(queue.name, { connection });
  cleanup.unshift(() => events.close());
  await events.waitUntilReady();
  const job = await queue.getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (state === 'completed') await job.waitUntilFinished(events);
  else await expect(job.waitUntilFinished(events)).rejects.toThrow();
}

let organizationId: string;

beforeAll(async () => {
  // An organization owned by a fresh auth user, so outbox rows satisfy their foreign key.
  const userId = randomUUID();
  await admin.query(
    `insert into auth.users (id, email, email_confirmed_at, aud, role)
     values ($1, $2, now(), 'authenticated', 'authenticated')`,
    [userId, `worker-${userId}@example.test`],
  );
  const { rows } = await admin.query<{ id: string }>(
    `insert into organizations (name, slug, created_by) values ('Worker Org', $1, $2) returning id`,
    [`worker-${userId.slice(0, 8)}`, userId],
  );
  organizationId = rows[0]?.id ?? '';
  // Only events created by this test run should be dispatched.
  await admin.query(`update outbox_events set dispatched_at = now() where dispatched_at is null`);
});

afterEach(async () => {
  for (const step of cleanup.splice(0)) await step();
});

afterAll(async () => {
  await prisma.$disconnect();
  await admin.end();
});

async function insertOutboxEvent(): Promise<string> {
  const membershipId = randomUUID();
  const { rows } = await admin.query<{ id: string }>(
    `insert into outbox_events (organization_id, event_type, aggregate_id, payload)
     values ($1, 'organization.created', $1, $2) returning id`,
    [organizationId, { organizationId, ownerUserId: randomUUID(), membershipId }],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error('insert failed');
  return id;
}

async function outboxRow(id: string) {
  const { rows } = await admin.query<{
    dispatched_at: Date | null;
    attempts: number;
    last_error: string | null;
    next_attempt_at: Date;
  }>(
    'select dispatched_at, attempts, last_error, next_attempt_at from outbox_events where id = $1',
    [id],
  );
  return rows[0];
}

describe('domain-events queue', () => {
  it('processes a valid event', async () => {
    const queue = testQueue();
    startWorker(queue, createDomainEventProcessor(logger));
    const job = await queue.add('organization.created', {
      eventId: randomUUID(),
      organizationId,
      aggregateId: organizationId,
      payload: { organizationId, ownerUserId: randomUUID(), membershipId: randomUUID() },
    });
    await waitFor(queue, job.id ?? '', 'completed');
    expect(await queue.getJobState(job.id ?? '')).toBe('completed');
  });

  it('retries a transient failure with backoff and then succeeds', async () => {
    const queue = testQueue();
    let calls = 0;
    startWorker(queue, () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error('transient')) : Promise.resolve();
    });
    const job = await queue.add('organization.created', {});
    await waitFor(queue, job.id ?? '', 'completed');
    expect(calls).toBe(2);
    expect((await queue.getJob(job.id ?? ''))?.attemptsMade).toBe(2);
  });

  it('stops after the bounded number of attempts and keeps the job in the failed set', async () => {
    const queue = testQueue();
    startWorker(queue, () => Promise.reject(new Error('always fails')));
    const job = await queue.add('organization.created', {});
    await waitFor(queue, job.id ?? '', 'failed');
    const failed = await queue.getFailed();
    expect(failed.map((j) => [j.id, j.attemptsMade, j.failedReason])).toEqual([
      [job.id, 5, 'always fails'],
    ]);
  });

  it('fails malformed events immediately without retrying', async () => {
    const queue = testQueue();
    startWorker(queue, createDomainEventProcessor(logger));
    const job = await queue.add('organization.created', { eventId: 'not-a-uuid' });
    await waitFor(queue, job.id ?? '', 'failed');
    expect((await queue.getJob(job.id ?? ''))?.attemptsMade).toBe(1);
  });
});

describe('transactional outbox dispatch', () => {
  it('keeps events durable while Redis is down, then dispatches them idempotently', async () => {
    const eventId = await insertOutboxEvent();

    const brokenQueue = createDomainEventsQueue(UNREACHABLE_REDIS, {
      name: `test-${randomUUID()}`,
    });
    brokenQueue.on('error', () => undefined); // connection errors are expected here
    const failed = await dispatchOutboxBatch(prisma, brokenQueue, 10, logger);
    await brokenQueue.close();
    expect(failed).toEqual({ dispatched: 0, failed: 1 });

    const afterFailure = await outboxRow(eventId);
    expect(afterFailure?.dispatched_at).toBeNull();
    expect(afterFailure?.attempts).toBe(1);
    expect(afterFailure?.last_error).toBeTruthy();
    expect(afterFailure?.next_attempt_at.getTime()).toBeGreaterThan(Date.now());

    // Not retried before its backoff elapses.
    const queue = testQueue();
    expect(await dispatchOutboxBatch(prisma, queue, 10, logger)).toEqual({
      dispatched: 0,
      failed: 0,
    });

    await admin.query('update outbox_events set next_attempt_at = now() where id = $1', [eventId]);
    expect(await dispatchOutboxBatch(prisma, queue, 10, logger)).toEqual({
      dispatched: 1,
      failed: 0,
    });
    expect((await outboxRow(eventId))?.dispatched_at).toBeInstanceOf(Date);
    expect((await queue.getJob(eventId))?.data).toMatchObject({ eventId, organizationId });

    // Simulate a crash after enqueueing but before the row was marked: dispatching again must
    // not create a second job.
    await admin.query('update outbox_events set dispatched_at = null where id = $1', [eventId]);
    expect(await dispatchOutboxBatch(prisma, queue, 10, logger)).toEqual({
      dispatched: 1,
      failed: 0,
    });
    expect(await queue.getJobCounts('waiting', 'delayed', 'active', 'completed')).toMatchObject({
      waiting: 1,
    });
  });
});
