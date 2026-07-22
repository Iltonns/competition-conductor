import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignReferee,
  deleteMatchReportAttachment,
  deleteSubstitution,
  deleteRefereeUnavailability,
  getMatchReport,
  homologateMatchReport,
  listEligibleAthletes,
  listEligibleStaff,
  listLineups,
  listMatchReportAttachments,
  listMatchStaff,
  listRefereeAssignments,
  listRefereeUnavailability,
  listReferees,
  listSanctions,
  listSubstitutions,
  reopenMatchReport,
  revokeSanction,
  saveLineup,
  saveMatchStaff,
  saveManualSanction,
  saveMatchReport,
  saveReferee,
  saveRefereeUnavailability,
  saveSubstitution,
  setRefereeAssignmentStatus,
  uploadMatchReportAttachment,
  type LineupEntry,
  type MatchReportAttachment,
  type SubstitutionInput,
} from "../api/sports-operations";

const sportsKeys = {
  report: (matchId: string) => ["sports", "report", matchId] as const,
  lineups: (matchId: string) => ["sports", "lineups", matchId] as const,
  staff: (matchId: string) => ["sports", "staff", matchId] as const,
  substitutions: (matchId: string) => ["sports", "substitutions", matchId] as const,
  attachments: (matchId: string) => ["sports", "attachments", matchId] as const,
  eligible: (championshipId: string, teamId: string) =>
    ["sports", "eligible", championshipId, teamId] as const,
  eligibleStaff: (championshipId: string, teamId: string) =>
    ["sports", "eligible-staff", championshipId, teamId] as const,
  referees: (championshipId: string) => ["sports", "referees", championshipId] as const,
  assignments: (championshipId: string) => ["sports", "assignments", championshipId] as const,
  unavailability: (championshipId: string) =>
    ["sports", "referee-unavailability", championshipId] as const,
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
export function useMatchStaff(matchId: string) {
  return useQuery({
    queryKey: sportsKeys.staff(matchId),
    queryFn: () => listMatchStaff(matchId),
    enabled: Boolean(matchId),
  });
}
export function useEligibleStaff(championshipId: string, teamId: string) {
  return useQuery({
    queryKey: sportsKeys.eligibleStaff(championshipId, teamId),
    queryFn: () => listEligibleStaff(championshipId, teamId),
    enabled: Boolean(championshipId && teamId),
  });
}
export function useSaveMatchStaff(championshipId: string, matchId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, staffIds }: { teamId: string; staffIds: string[] }) =>
      saveMatchStaff(championshipId, matchId, teamId, staffIds),
    onSuccess: () => client.invalidateQueries({ queryKey: sportsKeys.staff(matchId) }),
  });
}
export function useSubstitutions(championshipId: string, matchId: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: sportsKeys.substitutions(matchId) });
  const query = useQuery({
    queryKey: sportsKeys.substitutions(matchId),
    queryFn: () => listSubstitutions(matchId),
    enabled: Boolean(matchId),
  });
  return {
    ...query,
    save: useMutation({
      mutationFn: (input: SubstitutionInput) => saveSubstitution(championshipId, matchId, input),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteSubstitution(championshipId, matchId, id),
      onSuccess: refresh,
    }),
  };
}
export function useMatchReportAttachments(
  organizationId: string,
  championshipId: string,
  matchId: string,
) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: sportsKeys.attachments(matchId) });
  const query = useQuery({
    queryKey: sportsKeys.attachments(matchId),
    queryFn: () => listMatchReportAttachments(matchId),
    enabled: Boolean(matchId),
  });
  return {
    ...query,
    upload: useMutation({
      mutationFn: (file: File) =>
        uploadMatchReportAttachment(organizationId, championshipId, matchId, file),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (attachment: MatchReportAttachment) =>
        deleteMatchReportAttachment(championshipId, matchId, attachment),
      onSuccess: refresh,
    }),
  };
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
export function useRefereeUnavailability(championshipId: string) {
  return useQuery({
    queryKey: sportsKeys.unavailability(championshipId),
    queryFn: () => listRefereeUnavailability(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useRefereeActions(championshipId: string) {
  const client = useQueryClient();
  const refreshAssignments = () =>
    client.invalidateQueries({ queryKey: sportsKeys.assignments(championshipId) });
  const refreshUnavailability = () =>
    client.invalidateQueries({ queryKey: sportsKeys.unavailability(championshipId) });
  return {
    save: useMutation({
      mutationFn: ({ id, payload }: { id: string | null; payload: object }) =>
        saveReferee(championshipId, id, payload),
      onSuccess: () => client.invalidateQueries({ queryKey: sportsKeys.referees(championshipId) }),
    }),
    assign: useMutation({
      mutationFn: (input: { matchId: string; refereeId: string; role: string; fee: number }) =>
        assignReferee(championshipId, input.matchId, input.refereeId, input.role, input.fee),
      onSuccess: refreshAssignments,
    }),
    setAssignmentStatus: useMutation({
      mutationFn: (input: {
        assignmentId: string;
        status: "pending" | "confirmed" | "declined" | "cancelled";
        note?: string;
      }) =>
        setRefereeAssignmentStatus(championshipId, input.assignmentId, input.status, input.note),
      onSuccess: refreshAssignments,
    }),
    saveUnavailability: useMutation({
      mutationFn: (input: {
        id?: string | null;
        refereeId: string;
        startsAt: string;
        endsAt: string;
        reason?: string;
      }) => saveRefereeUnavailability(championshipId, input),
      onSuccess: refreshUnavailability,
    }),
    deleteUnavailability: useMutation({
      mutationFn: (id: string) => deleteRefereeUnavailability(championshipId, id),
      onSuccess: refreshUnavailability,
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
