import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { DbTransaction, UserContext } from '@krinly/database';
import { ENV, type Env } from '../config.js';
import { PrismaService } from '../database/prisma.service.js';
import { sqlState } from '../database/postgres-errors.js';
import { ApiException } from '../http/errors.js';
import type { OrgAccess } from '../http/request-context.js';
import type {
  CreateInvitationBody,
  CreateOrganizationBody,
  Invitation,
  OrganizationDetail,
} from './schemas.js';

const HOUR_MS = 60 * 60 * 1000;

const invitationSelect = {
  id: true,
  email: true,
  expiresAt: true,
  createdAt: true,
  role: { select: { key: true, name: true } },
  inviter: { select: { id: true, email: true } },
} as const;

type InvitationRow = {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  role: { key: string; name: string };
  inviter: { id: string; email: string };
};

function toInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    invitedBy: row.inviter,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function hashInvitationToken(token: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(createHash('sha256').update(token).digest());
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly db: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async create(ctx: UserContext, body: CreateOrganizationBody): Promise<OrganizationDetail> {
    try {
      return await this.db.asUser(ctx, async (tx) => {
        // Organization, settings, owner membership, audit entry and outbox event are written by
        // one SQL function in this transaction, so they commit or roll back together.
        const [created] = await tx.$queryRaw<{ id: string }[]>`
          select app.create_organization(${body.name}, ${body.slug}) as id`;
        if (!created) throw new Error('create_organization returned no row');
        return this.loadDetail(tx, created.id, ctx.userId);
      });
    } catch (error) {
      if (sqlState(error) === '23505') {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'SLUG_TAKEN',
          'That organization URL is already taken',
        );
      }
      throw error;
    }
  }

  get(ctx: UserContext, access: OrgAccess): Promise<OrganizationDetail> {
    return this.db.asUser(ctx, (tx) => this.loadDetail(tx, access.organizationId, ctx.userId));
  }

  async listMembers(ctx: UserContext, organizationId: string) {
    const rows = await this.db.asUser(ctx, (tx) =>
      tx.organizationMembership.findMany({
        where: { organizationId, status: { not: 'removed' } },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, email: true, fullName: true } },
          role: { select: { key: true, name: true } },
        },
      }),
    );
    return {
      members: rows.map((row) => ({
        membershipId: row.id,
        userId: row.user.id,
        email: row.user.email,
        fullName: row.user.fullName,
        role: row.role,
        status: row.status as 'active' | 'suspended' | 'removed',
        joinedAt: row.createdAt.toISOString(),
      })),
    };
  }

  async listInvitations(ctx: UserContext, organizationId: string) {
    const rows = await this.db.asUser(ctx, (tx) =>
      tx.organizationInvitation.findMany({
        where: { organizationId, status: 'pending', expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: invitationSelect,
      }),
    );
    return { invitations: rows.map(toInvitation) };
  }

  async createInvitation(ctx: UserContext, organizationId: string, body: CreateInvitationBody) {
    const token = randomBytes(32).toString('base64url');

    const invitation = await this.db.asUser(ctx, async (tx) => {
      const role = await tx.role.findUnique({ where: { key: body.roleKey } });
      if (!role) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'UNKNOWN_ROLE', 'Unknown role');
      }
      // The same database rule backs the RLS insert policy; checking first gives a clear 403.
      const [grant] = await tx.$queryRaw<{ allowed: boolean }[]>`
        select app.can_grant_role(${organizationId}::uuid, ${role.id}::uuid) as allowed`;
      if (!grant?.allowed) {
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'ROLE_NOT_GRANTABLE',
          'You cannot invite someone with a role that has permissions you do not hold',
        );
      }

      const existingMember = await tx.organizationMembership.findFirst({
        where: { organizationId, user: { email: body.email }, status: { not: 'removed' } },
        select: { id: true },
      });
      if (existingMember) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          'ALREADY_MEMBER',
          'This person is already a member',
        );
      }

      // Re-inviting replaces any outstanding invitation for the same email.
      await tx.organizationInvitation.updateMany({
        where: { organizationId, email: body.email, status: 'pending' },
        data: { status: 'revoked' },
      });

      const created = await tx.organizationInvitation.create({
        data: {
          organizationId,
          email: body.email,
          roleId: role.id,
          tokenHash: hashInvitationToken(token),
          invitedBy: ctx.userId,
          expiresAt: new Date(Date.now() + this.env.INVITATION_TTL_HOURS * HOUR_MS),
        },
        select: invitationSelect,
      });

      // createMany issues no RETURNING, which the runtime role is not allowed to read back.
      await tx.auditLog.createMany({
        data: {
          organizationId,
          actorUserId: ctx.userId,
          actorType: 'user',
          action: 'invitation.created',
          targetType: 'invitation',
          targetId: created.id,
          metadata: { roleKey: role.key },
          requestId: ctx.requestId,
        },
      });
      await tx.outboxEvent.createMany({
        data: {
          organizationId,
          eventType: 'invitation.created',
          aggregateId: created.id,
          payload: { invitationId: created.id, organizationId, roleKey: role.key },
        },
      });
      return created;
    });

    return {
      invitation: toInvitation(invitation),
      acceptUrl: new URL(`/invitations/${token}`, this.env.MERCHANT_APP_URL).toString(),
    };
  }

  async acceptInvitation(ctx: UserContext, token: string) {
    try {
      const [accepted] = await this.db.asUser(
        ctx,
        (tx) =>
          tx.$queryRaw<{ organization_id: string }[]>`
          select app.accept_invitation(${hashInvitationToken(token)}) as organization_id`,
      );
      if (!accepted) throw new Error('accept_invitation returned no row');
      return { organizationId: accepted.organization_id };
    } catch (error) {
      switch (sqlState(error)) {
        case 'KR404':
          throw new ApiException(
            HttpStatus.NOT_FOUND,
            'INVITATION_NOT_FOUND',
            'Invitation not found',
          );
        case 'KR410':
          throw new ApiException(
            HttpStatus.GONE,
            'INVITATION_NO_LONGER_VALID',
            'This invitation has expired or has already been used',
          );
        case 'KR403':
          throw new ApiException(
            HttpStatus.FORBIDDEN,
            'INVITATION_NOT_FOR_YOU',
            'This invitation was sent to a different, or unverified, email address',
          );
        case 'KR409':
          throw new ApiException(HttpStatus.CONFLICT, 'ALREADY_MEMBER', 'You are already a member');
        default:
          throw error;
      }
    }
  }

  private async loadDetail(
    tx: DbTransaction,
    organizationId: string,
    userId: string,
  ): Promise<OrganizationDetail> {
    const org = await tx.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        settings: { select: { timezone: true, currency: true, locale: true } },
        memberships: {
          where: { userId, status: 'active' },
          select: {
            role: {
              select: {
                key: true,
                permissions: { select: { permission: { select: { key: true } } } },
              },
            },
          },
        },
      },
    });
    const membership = org.memberships[0];
    if (!org.settings || !membership) throw new Error(`Organization ${org.id} is incomplete`);
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status as OrganizationDetail['status'],
      createdAt: org.createdAt.toISOString(),
      settings: org.settings,
      access: {
        role: membership.role.key,
        permissions: membership.role.permissions.map((p) => p.permission.key).sort(),
      },
    };
  }
}
