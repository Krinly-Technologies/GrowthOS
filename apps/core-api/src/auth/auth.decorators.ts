import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthUser } from '../http/request-context.js';

export const IS_PUBLIC = 'krinly:isPublic';

/** Opts a route out of the global authentication guard. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The verified user of an authenticated route. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<FastifyRequest>().user;
  if (!user) throw new Error('CurrentUser used on a route without authentication');
  return user;
});
