import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type LineupRow = Database["public"]["Tables"]["lineups"]["Row"];
export type RefereeRow = Database["public"]["Tables"]["referees"]["Row"];
export type RefereeAssignmentRow = Database["public"]["Tables"]["referee_assignments"]["Row"];
export type SanctionRow = Database["public"]["Tables"]["sanctions"]["Row"] & {
  team_staff_id?: string | null;
  revoked_at?: string | null;
  revocation_reason?: string | null;
};

export interface LineupEntry {
  athlete_id: string;
  role: "starter" | "substitute";
  is_captain: boolean;
  jersey_number: number | null;
  position: string | null;
}

export interface LineupWithAthlete extends LineupRow {
  athlete: { id: string; full_name: string; is_goalkeeper: boolean } | null;
}

export interface EligibleAthlete {
  id: string;
  full_name: string;
  jersey_number: number | null;
  position: string | null;
  is_goalkeeper: boolean;
  is_captain: boolean;
}

export interface MatchReport {
  id: string;
  match_id: string;
  championship_id: string;
  status: "draft" | "homologated" | "reopened";
  version: number;
  regular_home_score: number | null;
  regular_away_score: number | null;
  extra_home_score: number | null;
  extra_away_score: number | null;
  penalty_home_score: number | null;
  penalty_away_score: number | null;
  first_half_added_minutes: number;
  second_half_added_minutes: number;
  notes: string | null;
  attachments: Json;
  homologated_at: string | null;
  reopened_at: string | null;
  reopen_reason: string | null;
  snapshot: Json | null;
}

type RpcResult = { data: unknown; error: { message: string; code?: string } | null };
type QueryResult = PromiseLike<{ data: unknown; error: { message: string } | null }>;
const rpc = supabase.rpc as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult>;
const fromUntyped = supabase.from as unknown as (table: string) => {
  select: (columns?: string) => {
    eq: (
      column: string,
      value: unknown,
    ) => QueryResult & {
      maybeSingle: () => QueryResult;
      order: (column: string, options?: Record<string, unknown>) => QueryResult;
    };
  };
};

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(name, args);
  if (error) throw error;
  return data as T;
}

export async function listEligibleAthletes(
  championshipId: string,
  teamId: string,
): Promise<EligibleAthlete[]> {
  const { data: registrations, error } = await supabase
    .from("championship_team_athletes")
    .select("athlete_id, shirt_number, position, is_goalkeeper, is_captain")
    .eq("championship_id", championshipId)
    .eq("team_id", teamId)
    .eq("active", true)
    .in("registration_status", ["registered", "approved"]);
  if (error) throw error;
  if (!registrations?.length) return [];
  const { data: athletes, error: athleteError } = await supabase
    .from("athletes")
    .select("id, full_name, jersey_number, archived_at, status")
    .in(
      "id",
      registrations.map((row) => row.athlete_id),
    );
  if (athleteError) throw athleteError;
  const athleteById = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
  return registrations.flatMap((row) => {
    const athlete = athleteById.get(row.athlete_id);
    if (!athlete || athlete.archived_at || athlete.status === "archived") return [];
    return [
      {
        id: athlete.id,
        full_name: athlete.full_name,
        jersey_number: row.shirt_number ?? athlete.jersey_number,
        position: row.position,
        is_goalkeeper: row.is_goalkeeper,
        is_captain: row.is_captain,
      },
    ];
  });
}

export async function listLineups(matchId: string): Promise<LineupWithAthlete[]> {
  const { data, error } = await supabase
    .from("lineups")
    .select("*, athlete:athletes!lineups_athlete_id_fkey(id, full_name, is_goalkeeper)")
    .eq("match_id", matchId)
    .eq("status", "active")
    .order("lineup_role")
    .order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as LineupWithAthlete[];
}

export function saveLineup(
  championshipId: string,
  matchId: string,
  teamId: string,
  entries: LineupEntry[],
) {
  return callRpc<LineupRow[]>("save_match_lineup", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_team_id: teamId,
    p_entries: entries,
  });
}

export async function getMatchReport(matchId: string): Promise<MatchReport | null> {
  const { data, error } = await fromUntyped("match_reports")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();
  if (error) throw error;
  return data as MatchReport | null;
}

export function saveMatchReport(championshipId: string, matchId: string, payload: object) {
  return callRpc<MatchReport>("save_match_report", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_payload: payload,
  });
}

export function homologateMatchReport(championshipId: string, matchId: string) {
  return callRpc<MatchReport>("homologate_match_report", {
    p_championship_id: championshipId,
    p_match_id: matchId,
  });
}

export function reopenMatchReport(championshipId: string, matchId: string, reason: string) {
  return callRpc<MatchReport>("reopen_match_report", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_reason: reason,
  });
}

export async function listReferees(championshipId: string): Promise<RefereeRow[]> {
  const { data: championship, error: championshipError } = await supabase
    .from("championships")
    .select("organization_id")
    .eq("id", championshipId)
    .single();
  if (championshipError) throw championshipError;
  const { data, error } = await supabase
    .from("referees")
    .select("*")
    .eq("organization_id", championship.organization_id)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export function saveReferee(championshipId: string, refereeId: string | null, payload: object) {
  return callRpc<RefereeRow>("save_referee", {
    p_championship_id: championshipId,
    p_referee_id: refereeId,
    p_payload: payload,
  });
}

export async function listRefereeAssignments(championshipId: string) {
  const { data, error } = await supabase
    .from("referee_assignments")
    .select(
      "*, referee:referees!referee_assignments_referee_id_fkey(full_name), match:matches!referee_assignments_match_id_fkey(scheduled_at, home_team_id, away_team_id)",
    )
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function assignReferee(
  championshipId: string,
  matchId: string,
  refereeId: string,
  role: string,
  fee: number,
) {
  return callRpc<RefereeAssignmentRow>("assign_referee", {
    p_championship_id: championshipId,
    p_match_id: matchId,
    p_referee_id: refereeId,
    p_role: role,
    p_fee: fee,
  });
}

export async function listSanctions(championshipId: string) {
  const { data, error } = await supabase
    .from("sanctions")
    .select(
      "*, athlete:athletes!sanctions_athlete_id_fkey(full_name), team:teams!sanctions_team_id_fkey(name)",
    )
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function saveManualSanction(championshipId: string, payload: object) {
  return callRpc<SanctionRow>("save_manual_sanction", {
    p_championship_id: championshipId,
    p_sanction_id: null,
    p_payload: payload,
  });
}

export function revokeSanction(championshipId: string, sanctionId: string, reason: string) {
  return callRpc<SanctionRow>("revoke_sanction", {
    p_championship_id: championshipId,
    p_sanction_id: sanctionId,
    p_reason: reason,
  });
}
