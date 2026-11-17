// Lists failed domain-event jobs: `pnpm --filter @krinly/core-worker failed-jobs [limit]`.
import { parseEnv } from './config.js';
import { createDomainEventsQueue, redisConnection } from './queue.js';

const DEFAULT_LIMIT = 50;

const env = parseEnv(process.env);
const limit = Number(process.argv[2] ?? DEFAULT_LIMIT);
const queue = createDomainEventsQueue(redisConnection(env.REDIS_URL));
try {
  const jobs = await queue.getFailed(0, limit - 1);
  console.table(
    jobs.map((job) => ({
      id: job.id,
      event: job.name,
      attempts: job.attemptsMade,
      failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      reason: job.failedReason,
    })),
  );
} finally {
  await queue.close();
}
