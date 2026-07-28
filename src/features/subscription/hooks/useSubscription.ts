import { useQuery } from "@tanstack/react-query";
import { getOrganizationSubscriptionContext, listAvailablePlans } from "../api/subscription";

export function useAvailablePlans() {
  return useQuery({
    queryKey: ["available-subscription-plans"],
    queryFn: listAvailablePlans,
    staleTime: 5 * 60_000,
  });
}

export function useOrganizationSubscription(organizationId: string | null) {
  return useQuery({
    queryKey: ["organization-subscription", organizationId],
    queryFn: () => getOrganizationSubscriptionContext(organizationId!),
    enabled: Boolean(organizationId),
  });
}
