import { z } from "zod";
import { TEAM_ACCESS_PERMISSION_KEYS } from "../types/team-access.types";

const permissionShape = Object.fromEntries(
  TEAM_ACCESS_PERMISSION_KEYS.map((key) => [key, z.boolean()]),
) as Record<(typeof TEAM_ACCESS_PERMISSION_KEYS)[number], z.ZodBoolean>;

export const teamAccessPermissionsSchema = z.object(permissionShape).strict();

export const teamAccessTargetSchema = z.object({
  championshipId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export const generateTeamAccessSchema = teamAccessTargetSchema.extend({
  expiresAt: z.string().datetime({ offset: true }),
  permissions: teamAccessPermissionsSchema,
  adminNote: z.string().trim().max(500).nullable().optional(),
});

export const teamAccessLinkActionSchema = z.object({ linkId: z.string().uuid() });

export const teamAccessReasonSchema = teamAccessLinkActionSchema.extend({
  reason: z.string().trim().min(3).max(500),
});

export const extendTeamAccessSchema = teamAccessLinkActionSchema.extend({
  expiresAt: z.string().datetime({ offset: true }),
});

export const updateTeamAccessPermissionsSchema = teamAccessLinkActionSchema.extend({
  permissions: teamAccessPermissionsSchema,
});

export const exchangeTeamAccessSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
});
