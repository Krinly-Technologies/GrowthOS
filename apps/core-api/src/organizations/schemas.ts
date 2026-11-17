import { z } from 'zod';

export const OrganizationIdParams = z.object({ id: z.uuid() });

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;

export const CreateOrganizationBody = z.strictObject({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .regex(
      SLUG_PATTERN,
      '3-48 lowercase letters, digits or hyphens; must not start or end with a hyphen',
    ),
});
export type CreateOrganizationBody = z.infer<typeof CreateOrganizationBody>;

const RoleRef = z.object({ key: z.string(), name: z.string() });

export const OrganizationSummary = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'suspended', 'closed']),
});

export const MyOrganization = OrganizationSummary.extend({ role: RoleRef });
export const MyOrganizationList = z.object({ organizations: z.array(MyOrganization) });

export const OrganizationDetail = OrganizationSummary.extend({
  createdAt: z.iso.datetime(),
  settings: z.object({ timezone: z.string(), currency: z.string(), locale: z.string() }),
  access: z.object({ role: z.string(), permissions: z.array(z.string()) }),
});
export type OrganizationDetail = z.infer<typeof OrganizationDetail>;

export const Member = z.object({
  membershipId: z.uuid(),
  userId: z.uuid(),
  email: z.email(),
  fullName: z.string().nullable(),
  role: RoleRef,
  status: z.enum(['active', 'suspended', 'removed']),
  joinedAt: z.iso.datetime(),
});
export const MemberList = z.object({ members: z.array(Member) });

export const CreateInvitationBody = z.strictObject({
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  roleKey: z.string().regex(/^[a-z_]{1,32}$/),
});
export type CreateInvitationBody = z.infer<typeof CreateInvitationBody>;

export const Invitation = z.object({
  id: z.uuid(),
  email: z.email(),
  role: RoleRef,
  invitedBy: z.object({ id: z.uuid(), email: z.email() }),
  expiresAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});
export type Invitation = z.infer<typeof Invitation>;
export const InvitationList = z.object({ invitations: z.array(Invitation) });

export const CreatedInvitation = z.object({
  invitation: Invitation,
  // Contains the single-use token. Returned once; only its hash is stored.
  acceptUrl: z.url(),
});

/** 32 random bytes, base64url-encoded. */
export const InvitationTokenParams = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });

export const AcceptedInvitation = z.object({ organizationId: z.uuid() });
