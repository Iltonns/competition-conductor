import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  computeStats,
  createMatch,
  createMatchEvent,
  deleteMatch,
  deleteMatchEvent,
  getMatch,
  listStandings,
  listMatchEvents,
  listMatches,
  updateMatch,
  setMatchStatus,
  type CreateEventInput,
  type CreateMatchInput,
  type MatchFilters,
  type UpdateMatchInput,
} from "../api/matches";

export const matchKeys = {
  list: (championshipId: string, filters?: MatchFilters) =>
    ["matches", "list", championshipId, filters ?? {}] as const,
  detail: (championshipId: string, matchId: string) =>
    ["matches", "detail", championshipId, matchId] as const,
  events: (championshipId: string, matchId: string) =>
    ["matches", "events", championshipId, matchId] as const,
  standings: (championshipId: string, stageId?: string | null, groupId?: string | null) =>
    ["matches", "standings", championshipId, stageId ?? null, groupId ?? null] as const,
  stats: (championshipId: string) => ["matches", "stats", championshipId] as const,
};

export function useMatches(championshipId: string, filters?: MatchFilters) {
  return useQuery({
    queryKey: matchKeys.list(championshipId, filters),
    queryFn: () => listMatches(championshipId, filters),
    enabled: Boolean(championshipId),
  });
}

export function useMatch(championshipId: string, matchId: string) {
  return useQuery({
    queryKey: matchKeys.detail(championshipId, matchId),
    queryFn: () => getMatch(championshipId, matchId),
    enabled: Boolean(championshipId && matchId),
  });
}

export function useMatchEvents(championshipId: string, matchId: string) {
  return useQuery({
    queryKey: matchKeys.events(championshipId, matchId),
    queryFn: () => listMatchEvents(championshipId, matchId),
    enabled: Boolean(championshipId && matchId),
  });
}

export function useStandings(
  championshipId: string,
  stageId?: string | null,
  groupId?: string | null,
) {
  return useQuery({
    queryKey: matchKeys.standings(championshipId, stageId, groupId),
    queryFn: () => listStandings(championshipId, stageId ?? null, groupId ?? null),
    enabled: Boolean(championshipId),
  });
}

export function useChampionshipStats(championshipId: string) {
  return useQuery({
    queryKey: matchKeys.stats(championshipId),
    queryFn: () => computeStats(championshipId),
    enabled: Boolean(championshipId),
  });
}

function useInvalidateAll(championshipId: string, matchId?: string) {
  const qc = useQueryClient();
  return async () => {
    await qc.invalidateQueries({ queryKey: ["matches", "list", championshipId] });
    await qc.invalidateQueries({ queryKey: ["matches", "standings", championshipId] });
    await qc.invalidateQueries({ queryKey: matchKeys.stats(championshipId) });
    if (matchId) {
      await qc.invalidateQueries({ queryKey: matchKeys.detail(championshipId, matchId) });
      await qc.invalidateQueries({ queryKey: matchKeys.events(championshipId, matchId) });
    }
  };
}

export function useCreateMatch(championshipId: string) {
  const refresh = useInvalidateAll(championshipId);
  return useMutation({
    mutationFn: (input: CreateMatchInput) => createMatch(input),
    onSuccess: refresh,
  });
}

export function useUpdateMatch(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: (changes: UpdateMatchInput) => updateMatch(championshipId, matchId, changes),
    onSuccess: refresh,
  });
}

export function useSetMatchStatus(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: ({
      status,
      reason,
    }: {
      status: import("../api/matches").MatchStatus;
      reason?: string;
    }) => setMatchStatus(championshipId, matchId, status, reason),
    onSuccess: refresh,
  });
}

export function useDeleteMatch(championshipId: string) {
  const refresh = useInvalidateAll(championshipId);
  return useMutation({
    mutationFn: (matchId: string) => deleteMatch(championshipId, matchId),
    onSuccess: refresh,
  });
}

export function useCreateMatchEvent(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: (input: CreateEventInput) => createMatchEvent(championshipId, input),
    onSuccess: refresh,
  });
}

export function useDeleteMatchEvent(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: (eventId: string) => deleteMatchEvent(championshipId, matchId, eventId),
    onSuccess: refresh,
  });
}
