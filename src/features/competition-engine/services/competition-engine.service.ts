import { supabase } from "@/integrations/supabase/client";
import type {
  AdvancementInput,
  CompetitionGroup,
  CompetitionRound,
  CompetitionSettingsInput,
  CompetitionSettingsRow,
  CompetitionStage,
  FixtureCommitInput,
  StageInput,
  StageStanding,
  StageTeam,
} from "../types/engine-records.types";

type RpcResult = { data: unknown; error: { message: string; code?: string } | null };
const engineRpc = supabase.rpc as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult>;

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await engineRpc(name, args);
  if (error) throw error;
  return data as T;
}

export async function getCompetitionSettings(championshipId: string) {
  const { data, error } = await supabase
    .from("championship_settings")
    .select("*")
    .eq("championship_id", championshipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("competition:settings_not_found");
  return data;
}

export async function saveCompetitionSettings(
  championshipId: string,
  settings: CompetitionSettingsInput,
  exceptionReason?: string,
) {
  return callRpc<CompetitionSettingsRow>("save_competition_settings", {
    p_championship_id: championshipId,
    p_settings: settings,
    p_exception_reason: exceptionReason ?? null,
  });
}

export function publishCompetition(championshipId: string) {
  return callRpc("publish_competition", { p_championship_id: championshipId });
}

export async function listCompetitionStages(championshipId: string): Promise<CompetitionStage[]> {
  const { data, error } = await supabase
    .from("competition_stages")
    .select("*")
    .eq("championship_id", championshipId)
    .order("sequence");
  if (error) throw error;
  return data ?? [];
}

export async function getCompetitionStage(championshipId: string, stageId: string) {
  const { data, error } = await supabase
    .from("competition_stages")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("id", stageId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("competition:stage_not_found");
  return data;
}

export function saveCompetitionStage(
  championshipId: string,
  stageId: string | null,
  payload: StageInput,
) {
  return callRpc<CompetitionStage>("save_competition_stage", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_payload: payload,
  });
}

export async function archiveCompetitionStage(
  championshipId: string,
  stageId: string,
  reason: string,
) {
  await callRpc("archive_competition_stage", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_reason: reason,
  });
}

export async function listCompetitionGroups(
  championshipId: string,
  stageId?: string,
): Promise<CompetitionGroup[]> {
  let query = supabase
    .from("competition_groups")
    .select("*")
    .eq("championship_id", championshipId)
    .order("sequence");
  if (stageId) query = query.eq("stage_id", stageId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function saveCompetitionGroup(
  championshipId: string,
  stageId: string,
  groupId: string | null,
  name: string,
  sequence: number,
) {
  return callRpc<CompetitionGroup>("save_competition_group", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_group_id: groupId,
    p_name: name,
    p_sequence: sequence,
  });
}

export function generateCompetitionGroups(
  championshipId: string,
  stageId: string,
  groupCount: number,
) {
  return callRpc<string>("generate_competition_groups", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_client_request_id: crypto.randomUUID(),
    p_group_count: groupCount,
  });
}

export async function listCompetitionRounds(
  championshipId: string,
  stageId: string,
): Promise<CompetitionRound[]> {
  const { data, error } = await supabase
    .from("competition_rounds")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("stage_id", stageId)
    .order("round_number");
  if (error) throw error;
  return data ?? [];
}

export function listStageTeams(championshipId: string, stageId: string) {
  return callRpc<StageTeam[]>("get_competition_stage_teams", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
  });
}

export function assignTeamToStage(
  championshipId: string,
  stageId: string,
  teamId: string,
  groupId: string | null,
  seed?: number | null,
) {
  return callRpc<StageTeam>("assign_team_to_stage", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_team_id: teamId,
    p_group_id: groupId,
    p_seed: seed ?? null,
  });
}

export function commitFixtureGeneration(input: FixtureCommitInput) {
  return callRpc<string>("commit_fixture_generation", {
    p_championship_id: input.championshipId,
    p_stage_id: input.stageId,
    p_group_id: input.groupId,
    p_client_request_id: input.clientRequestId,
    p_fixtures: input.fixtures,
    p_first_kickoff: input.firstKickoff,
    p_round_interval_hours: input.roundIntervalHours,
  });
}

export function confirmStageAdvancement(input: AdvancementInput) {
  return callRpc<string>("confirm_stage_advancement", {
    p_championship_id: input.championshipId,
    p_source_stage_id: input.sourceStageId,
    p_target_stage_id: input.targetStageId,
    p_client_request_id: input.clientRequestId,
    p_qualified_teams: input.qualifiedTeams,
  });
}

export function addStandingsAdjustment(
  championshipId: string,
  stageId: string | null,
  groupId: string | null,
  teamId: string,
  points: number,
  reason: string,
) {
  return callRpc<string>("add_standings_adjustment", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_group_id: groupId,
    p_team_id: teamId,
    p_points: points,
    p_reason: reason,
  });
}

export async function homologateStandings(
  championshipId: string,
  stageId: string | null,
  groupId: string | null,
) {
  await callRpc("homologate_standings", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_group_id: groupId,
  });
}

export async function listStageStandings(
  championshipId: string,
  stageId: string,
): Promise<StageStanding[]> {
  const { data, error } = await supabase
    .from("standings")
    .select("team_id, group_id, position, points")
    .eq("championship_id", championshipId)
    .eq("stage_id", stageId)
    .order("group_id")
    .order("position");
  if (error) throw error;
  return data ?? [];
}
