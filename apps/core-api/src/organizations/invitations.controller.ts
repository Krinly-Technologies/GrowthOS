import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { UserContext } from '@krinly/database';
import { ApiAuthenticated, ApiErrors } from '../http/openapi.decorators.js';
import { DbContext } from '../http/user-context.decorator.js';
import { OrganizationsService } from './organizations.service.js';
import { AcceptedInvitation, InvitationTokenParams } from './schemas.js';

@ApiTags('invitations')
@ApiAuthenticated()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post(':token/accept')
  @HttpCode(200)
  @ApiParam({ name: 'token', description: 'Single-use invitation token from the accept link' })
  @ApiOkResponse({ standardSchema: AcceptedInvitation })
  @ApiErrors(400, 403, 404, 409, 410)
  accept(
    @DbContext() ctx: UserContext,
    @Param({ schema: InvitationTokenParams }) params: { token: string },
  ) {
    return this.organizations.acceptInvitation(ctx, params.token);
  }
}
