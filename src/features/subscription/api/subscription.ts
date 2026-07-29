import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type {
  CommercialPlan,
  OrganizationSubscriptionContext,
  PlanChangePreview,
} from "../types/subscription.types";

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

const commercialPlanSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  monthly_price_cents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  limits: z.object({
    athletes_per_championship: z.number().int().nonnegative().nullable(),
    sponsors_per_championship: z.number().int().nonnegative().nullable(),
  }),
  modules: z.array(z.string()),
});

const planChangePreviewSchema = z.object({
  change_type: z.enum(["renewal", "upgrade", "downgrade"]),
  has_restrictions: z.boolean(),
  data_preserved: z.literal(true),
  enforcement: z.literal("new_writes_only"),
  current_plan: z.object({
    id: z.string().uuid(),
    code: z.string(),
    version: z.number().int().positive(),
    name: z.string(),
    monthly_price_cents: z.number().int().nonnegative(),
  }),
  target_plan: z.object({
    id: z.string().uuid(),
    code: z.string(),
    version: z.number().int().positive(),
    name: z.string(),
    monthly_price_cents: z.number().int().nonnegative(),
  }),
  lost_modules: z.array(z.string()),
  resource_impacts: z.array(
    z.object({
      resource: z.enum([
        "organizations",
        "active_championships",
        "teams",
        "users",
        "storage_bytes",
      ]),
      used: z.number().int().nonnegative(),
      current_limit: z.number().int().nonnegative().nullable(),
      target_limit: z.number().int().nonnegative().nullable(),
      limit_reduced: z.boolean(),
      exceeds_target: z.boolean(),
    }),
  ),
  championship_impacts: z.object({
    athletes_per_championship_limit: z.number().int().nonnegative().nullable(),
    sponsors_per_championship_limit: z.number().int().nonnegative().nullable(),
    championships_over_athlete_limit: z.number().int().nonnegative(),
    championships_over_sponsor_limit: z.number().int().nonnegative(),
    max_athletes_in_championship: z.number().int().nonnegative(),
    max_sponsors_in_championship: z.number().int().nonnegative(),
  }),
});

type PlanCatalogRpc = (
  name: "list_available_plans" | "preview_organization_plan_change",
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

export async function listAvailablePlans(): Promise<CommercialPlan[]> {
  // Remover o adapter apos aplicar a migration e regenerar os tipos oficiais.
  const { data, error } = await (supabase.rpc as unknown as PlanCatalogRpc)("list_available_plans");
  if (error) throw new Error(error.message);
  return z.array(commercialPlanSchema).parse(data) satisfies CommercialPlan[];
}

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

export async function previewOrganizationPlanChange(
  organizationId: string,
  targetPlanVersionId: string,
): Promise<PlanChangePreview> {
  const rpc = supabase.rpc as unknown as PlanCatalogRpc;
  const { data, error } = await rpc("preview_organization_plan_change", {
    p_organization_id: organizationId,
    p_target_plan_version_id: targetPlanVersionId,
  });
  if (error) throw new Error(error.message);
  return planChangePreviewSchema.parse(data) satisfies PlanChangePreview;
}
