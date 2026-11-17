import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserContext } from '@krinly/database';
import type { FastifyRequest } from 'fastify';

/** The verified user and request ID, as needed to open an RLS-scoped transaction. */
export const DbContext = createParamDecorator((_: unknown, ctx: ExecutionContext): UserContext => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();
  if (!request.user) throw new Error('DbContext used on a route without authentication');
  return { userId: request.user.id, requestId: request.id };
});
