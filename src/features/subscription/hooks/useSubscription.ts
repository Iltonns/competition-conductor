import { useQuery } from "@tanstack/react-query";
import { getOrganizationSubscriptionContext } from "../api/subscription";

export function useOrganizationSubscription(organizationId: string | null) {
  return useQuery({
    queryKey: ["organization-subscription", organizationId],
    queryFn: () => getOrganizationSubscriptionContext(organizationId!),
    enabled: Boolean(organizationId),
  });
}
