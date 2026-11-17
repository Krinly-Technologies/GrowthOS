import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { OrgAccess } from '../http/request-context.js';

/** Organization access resolved by OrgAccessGuard for the current route. */
export const CurrentOrg = createParamDecorator((_: unknown, ctx: ExecutionContext): OrgAccess => {
  const access = ctx.switchToHttp().getRequest<FastifyRequest>().orgAccess;
  if (!access) throw new Error('CurrentOrg used on a route without RequirePermission');
  return access;
});
