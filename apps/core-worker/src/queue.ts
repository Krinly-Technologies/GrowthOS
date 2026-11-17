import { type ConnectionOptions, type DefaultJobOptions, Queue } from 'bullmq';

/** The single queue for domain events published through the transactional outbox. */
export const DOMAIN_EVENTS_QUEUE = 'domain-events';

const DAY_SECONDS = 24 * 60 * 60;
const MAX_ATTEMPTS = 5;
const BACKOFF_BASE_MS = 2_000;

/**
 * Bounded retries with exponential backoff. Completed jobs are kept for a day (which also keeps
 * outbox re-dispatch deduplicated by job ID); failed jobs for a week so they can be inspected.
 */
export function domainEventJobOptions(backoffBaseMs = BACKOFF_BASE_MS): DefaultJobOptions {
  return {
    attempts: MAX_ATTEMPTS,
    backoff: { type: 'exponential', delay: backoffBaseMs },
    removeOnComplete: { age: DAY_SECONDS },
    removeOnFail: { age: 7 * DAY_SECONDS },
  };
}

export function redisConnection(url: string): ConnectionOptions {
  // family 0 resolves both IPv4 and IPv6 (Railway private networking can be IPv6-only).
  return { url, family: 0 };
}

export function createDomainEventsQueue(
  connection: ConnectionOptions,
  options: { name?: string; backoffBaseMs?: number } = {},
): Queue {
  return new Queue(options.name ?? DOMAIN_EVENTS_QUEUE, {
    connection,
    defaultJobOptions: domainEventJobOptions(options.backoffBaseMs),
  });
}
