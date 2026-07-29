import { useMutation, useQuery } from "@tanstack/react-query";
import { createInfinitePayCheckout } from "../api/billing.functions";
import { getOrganizationSubscriptionContext, listAvailablePlans } from "../api/subscription";

export function useAvailablePlans() {
  return useQuery({
    queryKey: ["available-subscription-plans"],
    queryFn: listAvailablePlans,
    staleTime: 5 * 60_000,
  });
}

export function useCreateInfinitePayCheckout() {
  return useMutation({
    mutationFn: (input: {
      organizationId: string;
      planVersionId: string;
      clientRequestId: string;
    }) => createInfinitePayCheckout({ data: input }),
  });
}

export function useOrganizationSubscription(organizationId: string | null) {
  return useQuery({
    queryKey: ["organization-subscription", organizationId],
    queryFn: () => getOrganizationSubscriptionContext(organizationId!),
    enabled: Boolean(organizationId),
  });
}
