import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignReferee,
  getMatchReport,
  homologateMatchReport,
  listEligibleAthletes,
  listLineups,
  listRefereeAssignments,
  listReferees,
  listSanctions,
  reopenMatchReport,
  revokeSanction,
  saveLineup,
  saveManualSanction,
  saveMatchReport,
  saveReferee,
  type LineupEntry,
} from "../api/sports-operations";

const sportsKeys = {
  report: (matchId: string) => ["sports", "report", matchId] as const,
  lineups: (matchId: string) => ["sports", "lineups", matchId] as const,
  eligible: (championshipId: string, teamId: string) =>
    ["sports", "eligible", championshipId, teamId] as const,
  referees: (championshipId: string) => ["sports", "referees", championshipId] as const,
  assignments: (championshipId: string) => ["sports", "assignments", championshipId] as const,
  sanctions: (championshipId: string) => ["sports", "sanctions", championshipId] as const,
};

export function useMatchReport(matchId: string) {
  return useQuery({
    queryKey: sportsKeys.report(matchId),
    queryFn: () => getMatchReport(matchId),
    enabled: Boolean(matchId),
  });
}
export function useLineups(matchId: string) {
  return useQuery({
    queryKey: sportsKeys.lineups(matchId),
    queryFn: () => listLineups(matchId),
    enabled: Boolean(matchId),
  });
}
export function useEligibleAthletes(championshipId: string, teamId: string) {
  return useQuery({
    queryKey: sportsKeys.eligible(championshipId, teamId),
    queryFn: () => listEligibleAthletes(championshipId, teamId),
    enabled: Boolean(championshipId && teamId),
  });
}
export function useSaveLineup(championshipId: string, matchId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, entries }: { teamId: string; entries: LineupEntry[] }) =>
      saveLineup(championshipId, matchId, teamId, entries),
    onSuccess: () => client.invalidateQueries({ queryKey: sportsKeys.lineups(matchId) }),
  });
}
export function useReportActions(championshipId: string, matchId: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: sportsKeys.report(matchId) });
  return {
    save: useMutation({
      mutationFn: (payload: object) => saveMatchReport(championshipId, matchId, payload),
      onSuccess: refresh,
    }),
    homologate: useMutation({
      mutationFn: () => homologateMatchReport(championshipId, matchId),
      onSuccess: refresh,
    }),
    reopen: useMutation({
      mutationFn: (reason: string) => reopenMatchReport(championshipId, matchId, reason),
      onSuccess: refresh,
    }),
  };
}
export function useReferees(championshipId: string) {
  return useQuery({
    queryKey: sportsKeys.referees(championshipId),
    queryFn: () => listReferees(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useRefereeAssignments(championshipId: string) {
  return useQuery({
    queryKey: sportsKeys.assignments(championshipId),
    queryFn: () => listRefereeAssignments(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useRefereeActions(championshipId: string) {
  const client = useQueryClient();
  return {
    save: useMutation({
      mutationFn: ({ id, payload }: { id: string | null; payload: object }) =>
        saveReferee(championshipId, id, payload),
      onSuccess: () => client.invalidateQueries({ queryKey: sportsKeys.referees(championshipId) }),
    }),
    assign: useMutation({
      mutationFn: (input: { matchId: string; refereeId: string; role: string; fee: number }) =>
        assignReferee(championshipId, input.matchId, input.refereeId, input.role, input.fee),
      onSuccess: () =>
        client.invalidateQueries({ queryKey: sportsKeys.assignments(championshipId) }),
    }),
  };
}
export function useSanctions(championshipId: string) {
  return useQuery({
    queryKey: sportsKeys.sanctions(championshipId),
    queryFn: () => listSanctions(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useSanctionActions(championshipId: string) {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: sportsKeys.sanctions(championshipId) });
  return {
    save: useMutation({
      mutationFn: (payload: object) => saveManualSanction(championshipId, payload),
      onSuccess: refresh,
    }),
    revoke: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        revokeSanction(championshipId, id, reason),
      onSuccess: refresh,
    }),
  };
}
