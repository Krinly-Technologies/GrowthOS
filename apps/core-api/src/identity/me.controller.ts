import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { UserContext } from '@krinly/database';
import { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import { ApiException } from '../http/errors.js';
import { ApiAuthenticated, ApiErrors } from '../http/openapi.decorators.js';
import { DbContext } from '../http/user-context.decorator.js';
import { MyOrganizationList } from '../organizations/schemas.js';

const Me = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  isPlatformOperator: z.boolean(),
});

@ApiTags('me')
@ApiAuthenticated()
@Controller('me')
export class MeController {
  constructor(private readonly db: PrismaService) {}

  @Get()
  @ApiOkResponse({ standardSchema: Me })
  @ApiErrors(404)
  async me(@DbContext() ctx: UserContext): Promise<z.infer<typeof Me>> {
    const profile = await this.db.asUser(ctx, (tx) =>
      tx.profile.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, fullName: true, isPlatformOperator: true },
      }),
    );
    // Profiles are created by a trigger on auth.users, so a missing one is a data problem.
    if (!profile) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'PROFILE_NOT_FOUND', 'Profile not found');
    }
    return profile;
  }

  @Get('organizations')
  @ApiOkResponse({ standardSchema: MyOrganizationList })
  async organizations(@DbContext() ctx: UserContext): Promise<z.infer<typeof MyOrganizationList>> {
    const memberships = await this.db.asUser(ctx, (tx) =>
      tx.organizationMembership.findMany({
        where: {
          userId: ctx.userId,
          status: 'active',
          organization: { status: { not: 'closed' } },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          organization: { select: { id: true, name: true, slug: true, status: true } },
          role: { select: { key: true, name: true } },
        },
      }),
    );
    return {
      organizations: memberships.map(({ organization, role }) => ({
        ...organization,
        status: organization.status as 'active' | 'suspended' | 'closed',
        role,
      })),
    };
  }
}
