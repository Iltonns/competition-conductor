import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type MatchStatus = Database["public"]["Enums"]["match_status"];
export type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
export type MatchEventType = MatchEventRow["type"];

export interface MatchWithTeams extends MatchRow {
  home_team: {
    id: string;
    name: string;
    short_name: string | null;
    crest_url: string | null;
    primary_color: string | null;
  } | null;
  away_team: {
    id: string;
    name: string;
    short_name: string | null;
    crest_url: string | null;
    primary_color: string | null;
  } | null;
}

export interface MatchFilters {
  status?: MatchStatus | "all";
  teamId?: string;
  round?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateMatchInput {
  championship_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string | null;
  venue?: string | null;
  phase?: string | null;
  round?: string | null;
}

export interface UpdateMatchInput {
  scheduled_at: string | null;
  venue: string | null;
  phase: string | null;
  round: string | null;
}

export interface CreateEventInput {
  match_id: string;
  team_id: string | null;
  athlete_id?: string | null;
  type: MatchEventType;
  minute?: number | null;
  period?: string | null;
  note?: string | null;
  client_request_id?: string;
}

const MATCH_SELECT = `
  id, organization_id, championship_id, home_team_id, away_team_id,
  phase, round, venue, scheduled_at, home_score, away_score, status,
  created_at, updated_at, created_by, updated_by, started_at, ended_at, metadata,
  home_team:teams!matches_home_team_id_fkey(id, name, short_name, crest_url, primary_color),
  away_team:teams!matches_away_team_id_fkey(id, name, short_name, crest_url, primary_color)
`;

type RpcResult = { data: unknown; error: { message: string; code?: string } | null };
const phase1Rpc = supabase.rpc as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult>;

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await phase1Rpc(name, args);
  if (error) throw error;
  return data as T;
}

async function getChampionshipOrg(championshipId: string): Promise<string> {
  const { data, error } = await supabase
    .from("championships")
    .select("organization_id")
    .eq("id", championshipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("championship:not_found");
  return data.organization_id;
}

export async function listMatches(
  championshipId: string,
  filters: MatchFilters = {},
): Promise<MatchWithTeams[]> {
  let query = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("championship_id", championshipId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.round) query = query.eq("round", filters.round);
  if (filters.dateFrom) query = query.gte("scheduled_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("scheduled_at", filters.dateTo);
  if (filters.teamId)
    query = query.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MatchWithTeams[];
}

export async function getMatch(championshipId: string, matchId: string): Promise<MatchWithTeams> {
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("championship_id", championshipId)
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("match:not_found");
  return data as unknown as MatchWithTeams;
}

export function createMatch(input: CreateMatchInput): Promise<MatchRow> {
  return callRpc("create_championship_match", {
    p_championship_id: input.championship_id,
    p_home_team_id: input.home_team_id,
    p_away_team_id: input.away_team_id,
    p_scheduled_at: input.scheduled_at,
    p_venue: input.venue ?? null,
    p_phase: input.phase ?? null,
    p_round: input.round ?? null,
  });
}

export function updateMatch(
  championshipId: string,
  matchId: string,
  changes: UpdateMatchInput,
): Promise<MatchRow> {
  return callRpc("update_championship_match", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_scheduled_at: changes.scheduled_at,
    p_venue: changes.venue,
    p_phase: changes.phase,
    p_round: changes.round,
  });
}

export function setMatchStatus(
  championshipId: string,
  matchId: string,
  status: MatchStatus,
  reason?: string | null,
): Promise<MatchRow> {
  return callRpc("set_championship_match_status", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_status: status,
    p_reason: reason ?? null,
  });
}

export async function deleteMatch(championshipId: string, matchId: string): Promise<void> {
  await callRpc("delete_championship_match", {
    p_championship_id: championshipId,
    p_match_id: matchId,
  });
}

export async function listMatchEvents(
  championshipId: string,
  matchId: string,
): Promise<MatchEventRow[]> {
  const match = await getMatch(championshipId, matchId);
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("organization_id", match.organization_id)
    .eq("match_id", matchId)
    .is("deleted_at", null)
    .order("minute", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function createMatchEvent(
  championshipId: string,
  input: CreateEventInput,
): Promise<MatchEventRow> {
  return callRpc("record_match_event", {
    p_championship_id: championshipId,
    p_match_id: input.match_id,
    p_client_request_id: input.client_request_id ?? crypto.randomUUID(),
    p_team_id: input.team_id,
    p_athlete_id: input.athlete_id ?? null,
    p_type: input.type,
    p_minute: input.minute ?? null,
    p_period: input.period ?? null,
    p_note: input.note ?? null,
  });
}

export async function deleteMatchEvent(
  championshipId: string,
  matchId: string,
  eventId: string,
  reason?: string,
): Promise<void> {
  await callRpc("remove_match_event", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_event_id: eventId,
    p_reason: reason ?? null,
  });
}

export interface StandingRow {
  team_id: string;
  team_name: string;
  team_short: string | null;
  team_crest: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number;
}

export async function listStandings(championshipId: string): Promise<StandingRow[]> {
  const { data, error } = await supabase
    .from("standings")
    .select(
      "team_id, position, played, wins, draws, losses, goals_for, goals_against, goal_difference, points, team:teams!standings_team_id_fkey(name, short_name, crest_url)",
    )
    .eq("championship_id", championshipId)
    .is("stage_id", null)
    .is("group_id", null)
    .is("category_id", null)
    .order("position");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const team = row.team as unknown as {
      name: string;
      short_name: string | null;
      crest_url: string | null;
    } | null;
    return {
      team_id: row.team_id,
      team_name: team?.name ?? "Equipe",
      team_short: team?.short_name ?? null,
      team_crest: team?.crest_url ?? null,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      goal_diff: row.goal_difference,
      points: row.points,
      position: row.position,
    };
  });
}

export interface ScorerRow {
  athlete_id: string;
  athlete_name: string;
  team_id: string | null;
  team_name: string | null;
  goals: number;
}
export interface CardsRow {
  athlete_id: string;
  athlete_name: string;
  team_name: string | null;
  yellows: number;
  reds: number;
}

export async function computeStats(championshipId: string): Promise<{
  scorers: ScorerRow[];
  cards: CardsRow[];
  totals: { matches: number; goals: number; yellows: number; reds: number };
}> {
  const organizationId = await getChampionshipOrg(championshipId);
  const matches = await listMatches(championshipId);
  const matchIds = matches.map((match) => match.id);
  if (!matchIds.length)
    return { scorers: [], cards: [], totals: { matches: 0, goals: 0, yellows: 0, reds: 0 } };
  const { data: events, error } = await supabase
    .from("match_events")
    .select(
      "id, type, athlete_id, team_id, athlete:athletes!athlete_id(id, full_name), team:teams!team_id(id, name)",
    )
    .eq("organization_id", organizationId)
    .in("match_id", matchIds)
    .is("deleted_at", null);
  if (error) throw error;

  const scorers = new Map<string, ScorerRow>();
  const cards = new Map<string, CardsRow>();
  let goals = 0,
    yellows = 0,
    reds = 0;
  for (const event of events ?? []) {
    const athlete = event.athlete;
    const team = event.team;
    if (["goal", "penalty_goal", "own_goal"].includes(event.type)) goals++;
    if ((event.type === "goal" || event.type === "penalty_goal") && athlete) {
      const row = scorers.get(athlete.id) ?? {
        athlete_id: athlete.id,
        athlete_name: athlete.full_name,
        team_id: team?.id ?? null,
        team_name: team?.name ?? null,
        goals: 0,
      };
      row.goals++;
      scorers.set(athlete.id, row);
    }
    if (event.type === "yellow_card") yellows++;
    if (event.type === "red_card") reds++;
    if ((event.type === "yellow_card" || event.type === "red_card") && athlete) {
      const row = cards.get(athlete.id) ?? {
        athlete_id: athlete.id,
        athlete_name: athlete.full_name,
        team_name: team?.name ?? null,
        yellows: 0,
        reds: 0,
      };
      if (event.type === "yellow_card") row.yellows++;
      else row.reds++;
      cards.set(athlete.id, row);
    }
  }
  return {
    scorers: [...scorers.values()].sort((a, b) => b.goals - a.goals).slice(0, 20),
    cards: [...cards.values()]
      .sort((a, b) => b.reds * 3 + b.yellows - (a.reds * 3 + a.yellows))
      .slice(0, 20),
    totals: { matches: matches.length, goals, yellows, reds },
  };
}
