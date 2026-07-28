import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getGlobalAthlete,
  getGlobalTeam,
  listDirectoryOrganizations,
  listGlobalAthletes,
  listGlobalTeams,
} from "../api/global-directory";
import type { DirectoryFilters } from "../types/global-directory.types";

export function useDirectoryOrganizations() {
  return useQuery({
    queryKey: ["directory-organizations"],
    queryFn: listDirectoryOrganizations,
  });
}

export function useGlobalTeams(organizationId: string | null, filters: DirectoryFilters) {
  return useQuery({
    queryKey: ["global-teams", organizationId, filters],
    queryFn: () => listGlobalTeams(organizationId!, filters),
    enabled: Boolean(organizationId),
    placeholderData: keepPreviousData,
  });
}

export function useGlobalAthletes(organizationId: string | null, filters: DirectoryFilters) {
  return useQuery({
    queryKey: ["global-athletes", organizationId, filters],
    queryFn: () => listGlobalAthletes(organizationId!, filters),
    enabled: Boolean(organizationId),
    placeholderData: keepPreviousData,
  });
}

export function useGlobalTeam(organizationId: string | null, teamId: string) {
  return useQuery({
    queryKey: ["global-team", organizationId, teamId],
    queryFn: () => getGlobalTeam(organizationId!, teamId),
    enabled: Boolean(organizationId && teamId),
  });
}

export function useGlobalAthlete(organizationId: string | null, athleteId: string) {
  return useQuery({
    queryKey: ["global-athlete", organizationId, athleteId],
    queryFn: () => getGlobalAthlete(organizationId!, athleteId),
    enabled: Boolean(organizationId && athleteId),
  });
}
