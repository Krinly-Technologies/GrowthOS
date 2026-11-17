import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export interface AuthUser {
  id: string;
  email: string;
}

export interface OrgAccess {
  organizationId: string;
  roleKey: string;
  permissions: ReadonlySet<string>;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    orgAccess?: OrgAccess;
  }
}

const INCOMING_ID = /^[A-Za-z0-9._-]{8,128}$/;
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Accepts a well-formed upstream correlation ID or generates one. The chosen ID is written back
 * onto the raw request so the HTTP logger (which sees only the raw request) logs the same ID.
 */
export function resolveRequestId(req: IncomingMessage): string {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const id = typeof incoming === 'string' && INCOMING_ID.test(incoming) ? incoming : randomUUID();
  req.headers[REQUEST_ID_HEADER] = id;
  return id;
}

/** Invitation tokens travel in the URL path; keep them out of logs. */
export function redactUrl(url: string | undefined): string | undefined {
  return url?.replace(/\/invitations\/[^/?]+/, '/invitations/[redacted]');
}
