import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { UserContext } from '@krinly/database';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import { ApiException } from '../http/errors.js';
import { ApiAuthenticated, ApiErrors } from '../http/openapi.decorators.js';
import { DbContext } from '../http/user-context.decorator.js';

const OperatorSession = z.object({
  operator: z.object({ id: z.uuid(), email: z.email() }),
  activeGrants: z.array(
    z.object({
      id: z.uuid(),
      organization: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
      reason: z.string(),
      expiresAt: z.iso.datetime(),
    }),
  ),
});

@ApiTags('operator')
@ApiAuthenticated()
@Controller('operator')
export class OperatorController {
  constructor(private readonly db: PrismaService) {}

  /** Backend check used by admin-web: is the caller a Krinly operator, and what may they see? */
  @Get('session')
  @ApiOkResponse({ standardSchema: OperatorSession })
  @ApiErrors(403)
  session(@DbContext() ctx: UserContext): Promise<z.infer<typeof OperatorSession>> {
    return this.db.asUser(ctx, async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, isPlatformOperator: true },
      });
      if (!profile?.isPlatformOperator) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'OPERATOR_ACCESS_REQUIRED',
          'This account is not a Krinly operator',
        );
      }
      const grants = await tx.operatorAccessGrant.findMany({
        where: { operatorUserId: ctx.userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: 'asc' },
        select: {
          id: true,
          reason: true,
          expiresAt: true,
          organization: { select: { id: true, name: true, slug: true } },
        },
      });
      return {
        operator: { id: profile.id, email: profile.email },
        activeGrants: grants.map((g) => ({ ...g, expiresAt: g.expiresAt.toISOString() })),
      };
    });
  }
}
