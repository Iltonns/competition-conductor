import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  computeStandings,
  computeStats,
  createMatch,
  createMatchEvent,
  deleteMatch,
  deleteMatchEvent,
  getMatch,
  listMatchEvents,
  listMatches,
  updateMatch,
  type CreateEventInput,
  type CreateMatchInput,
  type UpdateMatchInput,
} from "../api/matches";

export const matchKeys = {
  list: (championshipId: string) => ["matches", "list", championshipId] as const,
  detail: (matchId: string) => ["matches", "detail", matchId] as const,
  events: (matchId: string) => ["matches", "events", matchId] as const,
  standings: (championshipId: string) => ["matches", "standings", championshipId] as const,
  stats: (championshipId: string) => ["matches", "stats", championshipId] as const,
};

export function useMatches(championshipId: string) {
  return useQuery({
    queryKey: matchKeys.list(championshipId),
    queryFn: () => listMatches(championshipId),
    enabled: Boolean(championshipId),
  });
}

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: matchKeys.detail(matchId),
    queryFn: () => getMatch(matchId),
    enabled: Boolean(matchId),
  });
}

export function useMatchEvents(matchId: string) {
  return useQuery({
    queryKey: matchKeys.events(matchId),
    queryFn: () => listMatchEvents(matchId),
    enabled: Boolean(matchId),
  });
}

export function useStandings(championshipId: string) {
  return useQuery({
    queryKey: matchKeys.standings(championshipId),
    queryFn: () => computeStandings(championshipId),
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
    await qc.invalidateQueries({ queryKey: matchKeys.list(championshipId) });
    await qc.invalidateQueries({ queryKey: matchKeys.standings(championshipId) });
    await qc.invalidateQueries({ queryKey: matchKeys.stats(championshipId) });
    if (matchId) {
      await qc.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      await qc.invalidateQueries({ queryKey: matchKeys.events(matchId) });
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
    mutationFn: (changes: UpdateMatchInput) => updateMatch(matchId, changes),
    onSuccess: refresh,
  });
}

export function useDeleteMatch(championshipId: string) {
  const refresh = useInvalidateAll(championshipId);
  return useMutation({ mutationFn: (matchId: string) => deleteMatch(matchId), onSuccess: refresh });
}

export function useCreateMatchEvent(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: (input: CreateEventInput) => createMatchEvent(input),
    onSuccess: refresh,
  });
}

export function useDeleteMatchEvent(championshipId: string, matchId: string) {
  const refresh = useInvalidateAll(championshipId, matchId);
  return useMutation({
    mutationFn: (eventId: string) => deleteMatchEvent(eventId),
    onSuccess: refresh,
  });
}
