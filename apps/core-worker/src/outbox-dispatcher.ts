import type { PrismaClient } from '@krinly/database';
import type { Queue } from 'bullmq';
import type { Logger } from 'pino';

const RETRY_BASE_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;
const MAX_ERROR_LENGTH = 1_000;
// Bounds how long a batch may hold its row locks, e.g. while Redis is slow to accept jobs.
// If exceeded, the transaction rolls back and the events are simply dispatched next poll.
const TRANSACTION_TIMEOUT_MS = 30_000;
const TRANSACTION_MAX_WAIT_MS = 5_000;

interface PendingEvent {
  id: string;
  event_type: string;
  organization_id: string | null;
  aggregate_id: string;
  payload: unknown;
  attempts: number;
}

export interface DispatchResult {
  dispatched: number;
  failed: number;
}

/**
 * Moves committed outbox events into the queue. Rows are locked with SKIP LOCKED so several
 * workers can dispatch concurrently. The job ID is the event ID, so re-dispatching an event
 * (for example after a crash between enqueue and commit) does not create a second job.
 * If enqueueing fails, the event stays in the outbox and is retried with backoff.
 */
export async function dispatchOutboxBatch(
  prisma: PrismaClient,
  queue: Queue,
  batchSize: number,
  logger: Logger,
): Promise<DispatchResult> {
  return prisma.$transaction(
    async (tx) => {
      const events = await tx.$queryRaw<PendingEvent[]>`
      select id, event_type, organization_id, aggregate_id, payload, attempts
      from outbox_events
      where dispatched_at is null and next_attempt_at <= now()
      order by created_at
      limit ${batchSize}
      for update skip locked`;

      const result: DispatchResult = { dispatched: 0, failed: 0 };
      for (const event of events) {
        try {
          await queue.add(
            event.event_type,
            {
              eventId: event.id,
              organizationId: event.organization_id,
              aggregateId: event.aggregate_id,
              payload: event.payload,
            },
            { jobId: event.id },
          );
          await tx.$executeRaw`
          update outbox_events set dispatched_at = now(), last_error = null
          where id = ${event.id}::uuid`;
          result.dispatched += 1;
        } catch (error) {
          const attempts = event.attempts + 1;
          const delaySeconds = Math.min(RETRY_BASE_MS * 2 ** attempts, MAX_RETRY_DELAY_MS) / 1_000;
          const message = (error instanceof Error ? error.message : String(error)).slice(
            0,
            MAX_ERROR_LENGTH,
          );
          await tx.$executeRaw`
          update outbox_events
          set attempts = ${attempts},
              next_attempt_at = now() + make_interval(secs => ${delaySeconds}),
              last_error = ${message}
          where id = ${event.id}::uuid`;
          logger.warn(
            { eventId: event.id, attempts, err: error },
            'Outbox dispatch failed; will retry',
          );
          result.failed += 1;
        }
      }
      return result;
    },
    { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_MAX_WAIT_MS },
  );
}
