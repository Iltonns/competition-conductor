import { useQuery } from "@tanstack/react-query";
import {
  championshipKeys,
  getChampionship,
  getChampionshipOverview,
} from "../services/championship.service";
import { useCurrentOrganizationId } from "./useChampionships";

export function useChampionship(championshipId: string) {
  const organization = useCurrentOrganizationId();
  const championship = useQuery({
    queryKey: championshipKeys.detail(organization.data ?? "pending", championshipId),
    queryFn: () => getChampionship(organization.data!, championshipId),
    enabled: Boolean(organization.data && championshipId),
  });

  return {
    ...championship,
    organizationId: organization.data,
    isLoading: organization.isLoading || championship.isLoading,
    error: organization.error ?? championship.error,
  };
}

export function useChampionshipOverview(championshipId: string) {
  const organization = useCurrentOrganizationId();
  const overview = useQuery({
    queryKey: championshipKeys.overview(organization.data ?? "pending", championshipId),
    queryFn: () => getChampionshipOverview(organization.data!, championshipId),
    enabled: Boolean(organization.data && championshipId),
  });

  return {
    ...overview,
    organizationId: organization.data,
    isLoading: organization.isLoading || overview.isLoading,
    error: organization.error ?? overview.error,
  };
}
