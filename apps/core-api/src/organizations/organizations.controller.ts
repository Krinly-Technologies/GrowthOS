import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { UserContext } from '@krinly/database';
import type { OrgAccess } from '../http/request-context.js';
import { ApiAuthenticated, ApiErrors } from '../http/openapi.decorators.js';
import { DbContext } from '../http/user-context.decorator.js';
import { CurrentOrg } from './current-org.decorator.js';
import { RequirePermission } from './org-access.guard.js';
import { OrganizationsService } from './organizations.service.js';
import {
  CreatedInvitation,
  CreateInvitationBody,
  CreateOrganizationBody,
  InvitationList,
  MemberList,
  OrganizationDetail,
} from './schemas.js';

const orgIdParam = ApiParam({ name: 'id', format: 'uuid' });

@ApiTags('organizations')
@ApiAuthenticated()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @ApiCreatedResponse({ standardSchema: OrganizationDetail })
  @ApiErrors(400, 409)
  create(
    @DbContext() ctx: UserContext,
    @Body({ schema: CreateOrganizationBody }) body: CreateOrganizationBody,
  ) {
    return this.organizations.create(ctx, body);
  }

  @Get(':id')
  @RequirePermission('organization.read')
  @orgIdParam
  @ApiOkResponse({ standardSchema: OrganizationDetail })
  @ApiErrors(400, 403, 404)
  get(@DbContext() ctx: UserContext, @CurrentOrg() org: OrgAccess) {
    return this.organizations.get(ctx, org);
  }

  @Get(':id/members')
  @RequirePermission('members.read')
  @orgIdParam
  @ApiOkResponse({ standardSchema: MemberList })
  @ApiErrors(400, 403, 404)
  listMembers(@DbContext() ctx: UserContext, @CurrentOrg() org: OrgAccess) {
    return this.organizations.listMembers(ctx, org.organizationId);
  }

  @Get(':id/invitations')
  @RequirePermission('members.invite')
  @orgIdParam
  @ApiOkResponse({ standardSchema: InvitationList })
  @ApiErrors(400, 403, 404)
  listInvitations(@DbContext() ctx: UserContext, @CurrentOrg() org: OrgAccess) {
    return this.organizations.listInvitations(ctx, org.organizationId);
  }

  @Post(':id/invitations')
  @HttpCode(201)
  @RequirePermission('members.invite')
  @orgIdParam
  @ApiCreatedResponse({ standardSchema: CreatedInvitation })
  @ApiErrors(400, 403, 404, 409)
  createInvitation(
    @DbContext() ctx: UserContext,
    @CurrentOrg() org: OrgAccess,
    @Body({ schema: CreateInvitationBody }) body: CreateInvitationBody,
  ) {
    return this.organizations.createInvitation(ctx, org.organizationId, body);
  }
}
