import { useQuery } from "@tanstack/react-query";
import {
  championshipKeys,
  getCurrentOrganizationId,
  listChampionships,
} from "../services/championship.service";

export const organizationKeys = { current: ["organization", "current"] as const };

export function useCurrentOrganizationId() {
  return useQuery({
    queryKey: organizationKeys.current,
    queryFn: getCurrentOrganizationId,
    staleTime: 5 * 60 * 1_000,
  });
}

export function useChampionships() {
  const organization = useCurrentOrganizationId();
  const championships = useQuery({
    queryKey: championshipKeys.list(organization.data ?? "pending"),
    queryFn: () => listChampionships(organization.data!),
    enabled: Boolean(organization.data),
  });
  return {
    ...championships,
    organizationId: organization.data,
    isLoading: organization.isLoading || championships.isLoading,
    error: organization.error ?? championships.error,
  };
}
