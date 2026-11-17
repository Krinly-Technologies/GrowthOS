import {
  applyDecorators,
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { PrismaService } from '../database/prisma.service.js';
import { ApiException } from '../http/errors.js';
import { OrganizationIdParams } from './schemas.js';

const REQUIRED_PERMISSION = 'krinly:requiredPermission';

/**
 * Requires the caller to be an active member of the organization in the `:id` route parameter
 * and to hold `permission` there. Non-members get 404 so organization IDs are not disclosed.
 */
export const RequirePermission = (permission: string) =>
  applyDecorators(SetMetadata(REQUIRED_PERMISSION, permission), UseGuards(OrgAccessGuard));

@Injectable()
export class OrgAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<string | undefined>(
      REQUIRED_PERMISSION,
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (!permission || !request.user) throw new Error('OrgAccessGuard misconfigured');

    const params = OrganizationIdParams.safeParse(request.params);
    if (!params.success) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_FAILED',
        'Invalid organization id',
      );
    }
    const organizationId = params.data.id;

    const membership = await this.db.asUser(
      { userId: request.user.id, requestId: request.id },
      (tx) =>
        tx.organizationMembership.findFirst({
          where: {
            organizationId,
            userId: request.user?.id,
            status: 'active',
            organization: { status: 'active' },
          },
          select: {
            role: {
              select: {
                key: true,
                permissions: { select: { permission: { select: { key: true } } } },
              },
            },
          },
        }),
    );
    if (!membership) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'ORGANIZATION_NOT_FOUND',
        'Organization not found',
      );
    }

    const permissions = new Set(membership.role.permissions.map((p) => p.permission.key));
    if (!permissions.has(permission)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'PERMISSION_DENIED',
        `This action requires the ${permission} permission`,
      );
    }
    request.orgAccess = { organizationId, roleKey: membership.role.key, permissions };
    return true;
  }
}
