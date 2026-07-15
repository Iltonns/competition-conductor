import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTeam,
  getTeamForChampionship,
  listTeamsForChampionship,
  removeTeamLink,
  setTeamArchived,
  updateTeam,
} from "../services/team.service";
import type { TeamInput } from "../types/team.types";

export const teamKeys = {
  list: (championshipId: string) => ["teams", "list", championshipId] as const,
  detail: (championshipId: string, teamId: string) =>
    ["teams", "detail", championshipId, teamId] as const,
};

export function useTeams(championshipId: string) {
  return useQuery({
    queryKey: teamKeys.list(championshipId),
    queryFn: () => listTeamsForChampionship(championshipId),
    enabled: Boolean(championshipId),
    retry: false,
  });
}

export function useTeam(championshipId: string, teamId: string) {
  return useQuery({
    queryKey: teamKeys.detail(championshipId, teamId),
    queryFn: () => getTeamForChampionship(championshipId, teamId),
    enabled: Boolean(championshipId && teamId),
    retry: false,
  });
}

function useRefreshTeam(championshipId: string, teamId?: string) {
  const client = useQueryClient();
  return async () => {
    await client.invalidateQueries({ queryKey: teamKeys.list(championshipId) });
    if (teamId)
      await client.invalidateQueries({ queryKey: teamKeys.detail(championshipId, teamId) });
  };
}

export function useCreateTeam(championshipId: string) {
  const refresh = useRefreshTeam(championshipId);
  return useMutation({
    mutationFn: (input: TeamInput) => createTeam(championshipId, input),
    onSuccess: refresh,
  });
}

export function useUpdateTeam(championshipId: string, teamId: string) {
  const refresh = useRefreshTeam(championshipId, teamId);
  return useMutation({
    mutationFn: (input: TeamInput) => updateTeam(championshipId, teamId, input),
    onSuccess: refresh,
  });
}

export function useArchiveTeam(championshipId: string, teamId: string) {
  const refresh = useRefreshTeam(championshipId, teamId);
  return useMutation({
    mutationFn: (archived: boolean) => setTeamArchived(championshipId, teamId, archived),
    onSuccess: refresh,
  });
}

export function useRemoveTeamLink(championshipId: string, teamId: string) {
  const refresh = useRefreshTeam(championshipId);
  return useMutation({
    mutationFn: () => removeTeamLink(championshipId, teamId),
    onSuccess: refresh,
  });
}
