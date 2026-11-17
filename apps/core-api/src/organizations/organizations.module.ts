import { Module } from '@nestjs/common';
import { InvitationsController } from './invitations.controller.js';
import { OrgAccessGuard } from './org-access.guard.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  controllers: [OrganizationsController, InvitationsController],
  providers: [OrganizationsService, OrgAccessGuard],
  exports: [OrgAccessGuard],
})
export class OrganizationsModule {}
