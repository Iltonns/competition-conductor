import { supabase } from "@/integrations/supabase/client";
import type { OrganizationSubscriptionContext } from "../types/subscription.types";

export async function getOrganizationSubscriptionContext(
  organizationId: string,
): Promise<OrganizationSubscriptionContext> {
  const { data, error } = await supabase.rpc(
    "get_organization_subscription_context" as never,
    { p_organization_id: organizationId } as never,
  );
  if (error) throw new Error(error.message);
  return data as OrganizationSubscriptionContext;
}
