import { createPrismaClient } from '@krinly/database';
import { Worker } from 'bullmq';
import { pino } from 'pino';
import { parseEnv } from './config.js';
import { createDomainEventProcessor } from './domain-events.js';
import { dispatchOutboxBatch } from './outbox-dispatcher.js';
import { createDomainEventsQueue, DOMAIN_EVENTS_QUEUE, redisConnection } from './queue.js';

const env = parseEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { service: 'core-worker' } });
const prisma = createPrismaClient(env.WORKER_DATABASE_URL);
const connection = redisConnection(env.REDIS_URL);
const queue = createDomainEventsQueue(connection);

const worker = new Worker(DOMAIN_EVENTS_QUEUE, createDomainEventProcessor(logger), {
  connection,
  concurrency: env.WORKER_CONCURRENCY,
});
worker.on('failed', (job, error) => {
  logger.error(
    { jobId: job?.id, eventType: job?.name, attemptsMade: job?.attemptsMade, err: error },
    'Domain event job failed',
  );
});
worker.on('error', (error) => {
  logger.error({ err: error }, 'Worker error');
});

let stopping = false;
let pollTimer: NodeJS.Timeout | undefined;

async function poll(): Promise<void> {
  try {
    const result = await dispatchOutboxBatch(prisma, queue, env.OUTBOX_BATCH_SIZE, logger);
    if (result.dispatched || result.failed) logger.info(result, 'Outbox batch dispatched');
  } catch (error) {
    logger.error({ err: error }, 'Outbox poll failed');
  }
  if (!stopping) pollTimer = setTimeout(() => void poll(), env.OUTBOX_POLL_INTERVAL_MS);
}

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  logger.info({ signal }, 'Shutting down');
  clearTimeout(pollTimer);
  // Lets in-flight jobs finish; anything unfinished is retried by another worker.
  await worker.close();
  await queue.close();
  await prisma.$disconnect();
  logger.info('Shutdown complete');
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    shutdown(signal).then(
      () => process.exit(0),
      (error: unknown) => {
        logger.fatal({ err: error }, 'Shutdown failed');
        process.exit(1);
      },
    );
  });
}

logger.info({ queue: DOMAIN_EVENTS_QUEUE }, 'core-worker started');
void poll();
