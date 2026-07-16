import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type MatchStatus = Database["public"]["Enums"]["match_status"];
export type MatchEventRow = Database["public"]["Tables"]["match_events"]["Row"];
export type MatchEventType = MatchEventRow["type"];

export interface MatchWithTeams extends MatchRow {
  home_team: { id: string; name: string; short_name: string | null; crest_url: string | null; primary_color: string | null } | null;
  away_team: { id: string; name: string; short_name: string | null; crest_url: string | null; primary_color: string | null } | null;
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
  scheduled_at?: string | null;
  venue?: string | null;
  phase?: string | null;
  round?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  status?: MatchStatus;
}

export interface CreateEventInput {
  match_id: string;
  team_id: string | null;
  athlete_id?: string | null;
  type: MatchEventType;
  minute?: number | null;
  period?: string | null;
  note?: string | null;
}

const MATCH_SELECT = `
  id, organization_id, championship_id, home_team_id, away_team_id,
  phase, round, venue, scheduled_at, home_score, away_score, status,
  created_at, updated_at, created_by,
  home_team:teams!matches_home_team_id_fkey(id, name, short_name, crest_url, primary_color),
  away_team:teams!matches_away_team_id_fkey(id, name, short_name, crest_url, primary_color)
`;

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

export async function listMatches(championshipId: string): Promise<MatchWithTeams[]> {
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("championship_id", championshipId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as MatchWithTeams[];
}

export async function getMatch(matchId: string): Promise<MatchWithTeams> {
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("match:not_found");
  return data as unknown as MatchWithTeams;
}

export async function createMatch(input: CreateMatchInput): Promise<MatchRow> {
  const organization_id = await getChampionshipOrg(input.championship_id);
  const { data, error } = await supabase
    .from("matches")
    .insert({
      organization_id,
      championship_id: input.championship_id,
      home_team_id: input.home_team_id,
      away_team_id: input.away_team_id,
      scheduled_at: input.scheduled_at,
      venue: input.venue ?? null,
      phase: input.phase ?? null,
      round: input.round ?? null,
      status: "scheduled" as MatchStatus,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMatch(matchId: string, changes: UpdateMatchInput): Promise<MatchRow> {
  const { data, error } = await supabase
    .from("matches")
    .update(changes)
    .eq("id", matchId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw error;
}

export async function listMatchEvents(matchId: string): Promise<MatchEventRow[]> {
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("match_id", matchId)
    .order("minute", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createMatchEvent(input: CreateEventInput): Promise<MatchEventRow> {
  const { data: match, error: mErr } = await supabase
    .from("matches")
    .select("organization_id, home_team_id, away_team_id, home_score, away_score")
    .eq("id", input.match_id)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!match) throw new Error("match:not_found");

  const { data, error } = await supabase
    .from("match_events")
    .insert({
      match_id: input.match_id,
      organization_id: match.organization_id,
      team_id: input.team_id,
      athlete_id: input.athlete_id ?? null,
      type: input.type,
      minute: input.minute ?? null,
      period: input.period ?? null,
      note: input.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Auto-update score on goal events
  if (input.type === "goal" || input.type === "own_goal") {
    const isHome =
      (input.type === "goal" && input.team_id === match.home_team_id) ||
      (input.type === "own_goal" && input.team_id === match.away_team_id);
    const isAway =
      (input.type === "goal" && input.team_id === match.away_team_id) ||
      (input.type === "own_goal" && input.team_id === match.home_team_id);
    if (isHome || isAway) {
      await supabase
        .from("matches")
        .update({
          home_score: (match.home_score ?? 0) + (isHome ? 1 : 0),
          away_score: (match.away_score ?? 0) + (isAway ? 1 : 0),
        })
        .eq("id", input.match_id);
    }
  }
  return data;
}

export async function deleteMatchEvent(eventId: string): Promise<void> {
  // Load event & match to reverse score if goal
  const { data: ev } = await supabase
    .from("match_events")
    .select("id, match_id, team_id, type")
    .eq("id", eventId)
    .maybeSingle();
  const { error } = await supabase.from("match_events").delete().eq("id", eventId);
  if (error) throw error;
  if (ev && (ev.type === "goal" || ev.type === "own_goal")) {
    const { data: match } = await supabase
      .from("matches")
      .select("home_team_id, away_team_id, home_score, away_score")
      .eq("id", ev.match_id)
      .maybeSingle();
    if (match) {
      const isHome =
        (ev.type === "goal" && ev.team_id === match.home_team_id) ||
        (ev.type === "own_goal" && ev.team_id === match.away_team_id);
      const isAway =
        (ev.type === "goal" && ev.team_id === match.away_team_id) ||
        (ev.type === "own_goal" && ev.team_id === match.home_team_id);
      await supabase
        .from("matches")
        .update({
          home_score: Math.max(0, (match.home_score ?? 0) - (isHome ? 1 : 0)),
          away_score: Math.max(0, (match.away_score ?? 0) - (isAway ? 1 : 0)),
        })
        .eq("id", ev.match_id);
    }
  }
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
}

export async function computeStandings(championshipId: string): Promise<StandingRow[]> {
  const matches = await listMatches(championshipId);
  const table = new Map<string, StandingRow>();
  const ensure = (t: MatchWithTeams["home_team"]) => {
    if (!t) return null;
    if (!table.has(t.id)) {
      table.set(t.id, {
        team_id: t.id,
        team_name: t.name,
        team_short: t.short_name,
        team_crest: t.crest_url,
        played: 0, wins: 0, draws: 0, losses: 0,
        goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
      });
    }
    return table.get(t.id)!;
  };
  for (const m of matches) {
    if (m.status !== "finished") continue;
    const home = ensure(m.home_team);
    const away = ensure(m.away_team);
    if (!home || !away) continue;
    const hs = m.home_score ?? 0;
    const as = m.away_score ?? 0;
    home.played++; away.played++;
    home.goals_for += hs; home.goals_against += as;
    away.goals_for += as; away.goals_against += hs;
    if (hs > as) { home.wins++; home.points += 3; away.losses++; }
    else if (hs < as) { away.wins++; away.points += 3; home.losses++; }
    else { home.draws++; away.draws++; home.points++; away.points++; }
  }
  return Array.from(table.values())
    .map((r) => ({ ...r, goal_diff: r.goals_for - r.goals_against }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goal_diff - a.goal_diff ||
      b.goals_for - a.goals_for ||
      a.team_name.localeCompare(b.team_name),
    );
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
  const matches = await listMatches(championshipId);
  const matchIds = matches.map((m) => m.id);
  if (matchIds.length === 0) {
    return { scorers: [], cards: [], totals: { matches: 0, goals: 0, yellows: 0, reds: 0 } };
  }
  const { data: events, error } = await supabase
    .from("match_events")
    .select(`
      id, type, athlete_id, team_id,
      athlete:athletes(id, full_name),
      team:teams(id, name, short_name)
    `)
    .in("match_id", matchIds);
  if (error) throw error;

  const scorers = new Map<string, ScorerRow>();
  const cards = new Map<string, CardsRow>();
  let goals = 0, yellows = 0, reds = 0;

  for (const e of events ?? []) {
    const ath = (e as any).athlete as { id: string; full_name: string } | null;
    const tm = (e as any).team as { id: string; name: string } | null;
    if (e.type === "goal") {
      goals++;
      if (ath) {
        const key = ath.id;
        const row = scorers.get(key) ?? {
          athlete_id: ath.id, athlete_name: ath.full_name,
          team_id: tm?.id ?? null, team_name: tm?.name ?? null, goals: 0,
        };
        row.goals++;
        scorers.set(key, row);
      }
    } else if (e.type === "own_goal") {
      goals++;
    } else if (e.type === "yellow_card" || e.type === "red_card") {
      if (e.type === "yellow_card") yellows++; else reds++;
      if (ath) {
        const key = ath.id;
        const row = cards.get(key) ?? {
          athlete_id: ath.id, athlete_name: ath.full_name,
          team_name: tm?.name ?? null, yellows: 0, reds: 0,
        };
        if (e.type === "yellow_card") row.yellows++; else row.reds++;
        cards.set(key, row);
      }
    }
  }

  return {
    scorers: Array.from(scorers.values()).sort((a, b) => b.goals - a.goals).slice(0, 20),
    cards: Array.from(cards.values()).sort((a, b) => (b.reds * 3 + b.yellows) - (a.reds * 3 + a.yellows)).slice(0, 20),
    totals: { matches: matches.length, goals, yellows, reds },
  };
}
