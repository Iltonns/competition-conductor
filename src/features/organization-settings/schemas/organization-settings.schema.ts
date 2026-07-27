import { z } from "zod";

export const invitationRoleSchema = z.enum(["admin", "editor", "viewer"]);

export const inviteOrganizationUserSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().trim().email().max(320),
  role: invitationRoleSchema,
});

export const resendOrganizationInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});
