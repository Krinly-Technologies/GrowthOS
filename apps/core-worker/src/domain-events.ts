import { type Job, UnrecoverableError } from 'bullmq';
import type { Logger } from 'pino';
import { z } from 'zod';

const Envelope = z.object({
  eventId: z.uuid(),
  organizationId: z.uuid().nullable(),
  aggregateId: z.uuid(),
  payload: z.unknown(),
});

/** Payload schemas for every event type the database currently emits. */
const PAYLOADS = {
  'organization.created': z.object({
    organizationId: z.uuid(),
    ownerUserId: z.uuid(),
    membershipId: z.uuid(),
  }),
  'membership.created': z.object({
    organizationId: z.uuid(),
    userId: z.uuid(),
    membershipId: z.uuid(),
    roleId: z.uuid(),
  }),
  'invitation.created': z.object({
    invitationId: z.uuid(),
    organizationId: z.uuid(),
    roleKey: z.string(),
  }),
} as const;

function isKnownEvent(name: string): name is keyof typeof PAYLOADS {
  return Object.hasOwn(PAYLOADS, name);
}

/**
 * Validates and acknowledges domain events. Phase 1 has no downstream consumers yet, so a valid
 * event is recorded in the structured log; modules subscribe here as they are implemented.
 * Malformed or unknown events can never succeed, so they fail immediately without retries and
 * stay in the failed set for inspection.
 */
export function createDomainEventProcessor(logger: Logger): (job: Job) => Promise<void> {
  return (job) => {
    const envelope = Envelope.safeParse(job.data);
    if (!envelope.success || !isKnownEvent(job.name)) {
      return Promise.reject(new UnrecoverableError(`Unsupported or malformed event "${job.name}"`));
    }
    const payload = PAYLOADS[job.name].safeParse(envelope.data.payload);
    if (!payload.success) {
      return Promise.reject(
        new UnrecoverableError(`Invalid payload for "${job.name}": ${payload.error.message}`),
      );
    }
    logger.info(
      {
        eventId: envelope.data.eventId,
        eventType: job.name,
        organizationId: envelope.data.organizationId,
      },
      'Domain event processed',
    );
    return Promise.resolve();
  };
}
