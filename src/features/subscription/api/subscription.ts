import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { OrganizationSubscriptionContext } from "../types/subscription.types";

const resourceUsageSchema = z.object({
  used: z.number(),
  limit: z.number().nullable(),
  percentage: z.number().nullable(),
  state: z.enum(["unlimited", "ok", "warning", "blocked"]),
});

const organizationSubscriptionContextSchema = z.object({
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  subscription: z.object({
    id: z.string().uuid(),
    status: z.enum(["trial", "active", "past_due", "cancelled", "suspended"]),
    trial_ends_at: z.string().nullable(),
    current_period_starts_at: z.string(),
    current_period_ends_at: z.string().nullable(),
    provider_connected: z.boolean(),
  }),
  plan: z.object({
    id: z.string().uuid(),
    code: z.string(),
    version: z.number().int(),
    name: z.string(),
    description: z.string().nullable(),
    modules: z.array(z.string()),
  }),
  usage: z.object({
    organizations: resourceUsageSchema,
    active_championships: resourceUsageSchema,
    teams: resourceUsageSchema,
    users: resourceUsageSchema,
    storage_bytes: resourceUsageSchema,
  }),
});

export async function getOrganizationSubscriptionContext(
  organizationId: string,
): Promise<OrganizationSubscriptionContext> {
  const { data, error } = await supabase.rpc("get_organization_subscription_context", {
    p_organization_id: organizationId,
  });
  if (error) throw new Error(error.message);
  return organizationSubscriptionContextSchema.parse(
    data,
  ) satisfies OrganizationSubscriptionContext;
}
