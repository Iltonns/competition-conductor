import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addStandingsAdjustment,
  archiveCompetitionStage,
  assignTeamToStage,
  commitFixtureGeneration,
  confirmStageAdvancement,
  getCompetitionSettings,
  generateCompetitionGroups,
  getCompetitionStage,
  homologateStandings,
  listCompetitionGroups,
  listCompetitionRounds,
  listCompetitionStages,
  listStageTeams,
  listStageStandings,
  publishCompetition,
  saveCompetitionGroup,
  saveCompetitionSettings,
  saveCompetitionStage,
} from "../services/competition-engine.service";
import type {
  AdvancementInput,
  CompetitionSettingsInput,
  FixtureCommitInput,
  StageInput,
} from "../types/engine-records.types";

export const competitionKeys = {
  root: (championshipId: string) => ["competition-engine", championshipId] as const,
  settings: (championshipId: string) =>
    [...competitionKeys.root(championshipId), "settings"] as const,
  stages: (championshipId: string) => [...competitionKeys.root(championshipId), "stages"] as const,
  stage: (championshipId: string, stageId: string) =>
    [...competitionKeys.stages(championshipId), stageId] as const,
  groups: (championshipId: string, stageId?: string) =>
    [...competitionKeys.root(championshipId), "groups", stageId ?? "all"] as const,
  rounds: (championshipId: string, stageId: string) =>
    [...competitionKeys.stage(championshipId, stageId), "rounds"] as const,
  teams: (championshipId: string, stageId: string) =>
    [...competitionKeys.stage(championshipId, stageId), "teams"] as const,
  standings: (championshipId: string, stageId: string) =>
    [...competitionKeys.stage(championshipId, stageId), "standings"] as const,
};

function useRefreshCompetition(championshipId: string) {
  const client = useQueryClient();
  return async () => {
    await client.invalidateQueries({ queryKey: competitionKeys.root(championshipId) });
    await client.invalidateQueries({ queryKey: ["matches", "standings", championshipId] });
  };
}

export function useCompetitionSettings(championshipId: string) {
  return useQuery({
    queryKey: competitionKeys.settings(championshipId),
    queryFn: () => getCompetitionSettings(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useCompetitionStages(championshipId: string) {
  return useQuery({
    queryKey: competitionKeys.stages(championshipId),
    queryFn: () => listCompetitionStages(championshipId),
    enabled: Boolean(championshipId),
  });
}
export function useCompetitionStage(championshipId: string, stageId: string) {
  return useQuery({
    queryKey: competitionKeys.stage(championshipId, stageId),
    queryFn: () => getCompetitionStage(championshipId, stageId),
    enabled: Boolean(championshipId && stageId),
  });
}
export function useCompetitionGroups(championshipId: string, stageId?: string) {
  return useQuery({
    queryKey: competitionKeys.groups(championshipId, stageId),
    queryFn: () => listCompetitionGroups(championshipId, stageId),
    enabled: Boolean(championshipId),
  });
}
export function useCompetitionRounds(championshipId: string, stageId: string) {
  return useQuery({
    queryKey: competitionKeys.rounds(championshipId, stageId),
    queryFn: () => listCompetitionRounds(championshipId, stageId),
    enabled: Boolean(championshipId && stageId),
  });
}
export function useStageTeams(championshipId: string, stageId: string) {
  return useQuery({
    queryKey: competitionKeys.teams(championshipId, stageId),
    queryFn: () => listStageTeams(championshipId, stageId),
    enabled: Boolean(championshipId && stageId),
  });
}
export function useStageStandings(championshipId: string, stageId: string) {
  return useQuery({
    queryKey: competitionKeys.standings(championshipId, stageId),
    queryFn: () => listStageStandings(championshipId, stageId),
    enabled: Boolean(championshipId && stageId),
  });
}

export function useSaveCompetitionSettings(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({
      settings,
      exceptionReason,
    }: {
      settings: CompetitionSettingsInput;
      exceptionReason?: string;
    }) => saveCompetitionSettings(championshipId, settings, exceptionReason),
    onSuccess: refresh,
  });
}
export function usePublishCompetition(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({ mutationFn: () => publishCompetition(championshipId), onSuccess: refresh });
}
export function useSaveCompetitionStage(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({ stageId, payload }: { stageId: string | null; payload: StageInput }) =>
      saveCompetitionStage(championshipId, stageId, payload),
    onSuccess: refresh,
  });
}
export function useArchiveCompetitionStage(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({ stageId, reason }: { stageId: string; reason: string }) =>
      archiveCompetitionStage(championshipId, stageId, reason),
    onSuccess: refresh,
  });
}
export function useSaveCompetitionGroup(championshipId: string, stageId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({
      groupId,
      name,
      sequence,
    }: {
      groupId: string | null;
      name: string;
      sequence: number;
    }) => saveCompetitionGroup(championshipId, stageId, groupId, name, sequence),
    onSuccess: refresh,
  });
}
export function useGenerateCompetitionGroups(championshipId: string, stageId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: (groupCount: number) =>
      generateCompetitionGroups(championshipId, stageId, groupCount),
    onSuccess: refresh,
  });
}
export function useAssignTeamToStage(championshipId: string, stageId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({
      teamId,
      groupId,
      seed,
    }: {
      teamId: string;
      groupId: string | null;
      seed?: number | null;
    }) => assignTeamToStage(championshipId, stageId, teamId, groupId, seed),
    onSuccess: refresh,
  });
}
export function useCommitFixtureGeneration(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: (input: FixtureCommitInput) => commitFixtureGeneration(input),
    onSuccess: refresh,
  });
}
export function useConfirmStageAdvancement(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: (input: AdvancementInput) => confirmStageAdvancement(input),
    onSuccess: refresh,
  });
}

export function useAddStandingsAdjustment(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({
      stageId,
      groupId,
      teamId,
      points,
      reason,
    }: {
      stageId: string | null;
      groupId: string | null;
      teamId: string;
      points: number;
      reason: string;
    }) => addStandingsAdjustment(championshipId, stageId, groupId, teamId, points, reason),
    onSuccess: refresh,
  });
}

export function useHomologateStandings(championshipId: string) {
  const refresh = useRefreshCompetition(championshipId);
  return useMutation({
    mutationFn: ({ stageId, groupId }: { stageId: string | null; groupId: string | null }) =>
      homologateStandings(championshipId, stageId, groupId),
    onSuccess: refresh,
  });
}
