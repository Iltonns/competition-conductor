import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type Functions = Database["public"]["Functions"];
type Json = Database["public"]["Tables"]["audit_logs"]["Row"]["new_data"];

/**
 * O gerador de tipos do Supabase nao expressa parametro de RPC anulavel: um
 * `p_stage_id uuid DEFAULT NULL` vira `p_stage_id?: string`, nunca
 * `string | null`. Como varias RPCs do motor recebem null de proposito
 * (etapa sem grupo, ajuste sem etapa), permitir null aqui mantem a checagem
 * de nome e de chave sem mentir sobre o contrato.
 */
type RpcArgs<N extends keyof Functions> = {
  [K in keyof Functions[N]["Args"]]: Functions[N]["Args"][K] | null;
};

/**
 * Encaminha para o cliente tipado. Nome, chaves e retorno vem do contrato
 * gerado do banco.
 */
async function callRpc<N extends keyof Functions>(
  name: N,
  args: RpcArgs<N>,
): Promise<Functions[N]["Returns"]> {
  const { data, error } = await supabase.rpc(name, args as Functions[N]["Args"]);
  if (error) throw error;
  return data;
}

/** Payload jsonb: o contrato gerado descreve a coluna como Json opaco. */
const asJson = (value: unknown) => value as Json;

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
  return callRpc("save_competition_settings", {
    p_championship_id: championshipId,
    p_settings: asJson(settings),
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
  return callRpc("save_competition_stage", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_payload: asJson(payload),
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
  return callRpc("save_competition_group", {
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
  return callRpc("generate_competition_groups", {
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

export async function listStageTeams(
  championshipId: string,
  stageId: string,
): Promise<StageTeam[]> {
  const data = await callRpc("get_competition_stage_teams", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
  });
  // A RPC devolve jsonb, entao o contrato gerado so sabe dizer Json.
  return (data ?? []) as unknown as StageTeam[];
}

export function assignTeamToStage(
  championshipId: string,
  stageId: string,
  teamId: string,
  groupId: string | null,
  seed?: number | null,
) {
  return callRpc("assign_team_to_stage", {
    p_championship_id: championshipId,
    p_stage_id: stageId,
    p_team_id: teamId,
    p_group_id: groupId,
    p_seed: seed ?? null,
  });
}

export function commitFixtureGeneration(input: FixtureCommitInput) {
  return callRpc("commit_fixture_generation", {
    p_championship_id: input.championshipId,
    p_stage_id: input.stageId,
    p_group_id: input.groupId,
    p_client_request_id: input.clientRequestId,
    p_fixtures: asJson(input.fixtures),
    p_first_kickoff: input.firstKickoff,
    p_round_interval_hours: input.roundIntervalHours,
  });
}

export function confirmStageAdvancement(input: AdvancementInput) {
  return callRpc("confirm_stage_advancement", {
    p_championship_id: input.championshipId,
    p_source_stage_id: input.sourceStageId,
    p_target_stage_id: input.targetStageId,
    p_client_request_id: input.clientRequestId,
    p_qualified_teams: asJson(input.qualifiedTeams),
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
  return callRpc("add_standings_adjustment", {
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
