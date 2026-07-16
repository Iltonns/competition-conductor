import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AthleteInput, RosterAthlete } from "../types/athlete.types";

const db = supabase as unknown as SupabaseClient;

async function participation(championshipId: string, teamId: string) {
  const { data, error } = await db
    .from("championship_teams")
    .select("id, organization_id")
    .eq("championship_id", championshipId)
    .eq("team_id", teamId)
    .single();
  if (error) throw error;
  return data as { id: string; organization_id: string };
}

export async function listRoster(championshipId: string, teamId: string): Promise<RosterAthlete[]> {
  const link = await participation(championshipId, teamId);
  const { data, error } = await db
    .from("championship_team_athletes")
    .select(
      "id, athlete_id, shirt_number, position, registration_status, is_goalkeeper, is_captain, active, athletes!inner(full_name,sport_name,photo_url,birth_date)",
    )
    .eq("championship_team_id", link.id)
    .order("shirt_number");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const athlete = row.athletes as unknown as {
      full_name: string;
      sport_name: string | null;
      photo_url: string | null;
      birth_date: string | null;
    };
    return { ...row, ...athlete, athletes: undefined } as unknown as RosterAthlete;
  });
}

export async function registerAthlete(championshipId: string, teamId: string, input: AthleteInput) {
  const { data, error } = await db.rpc("register_athlete_for_championship", {
    p_championship_id: championshipId,
    p_team_id: teamId,
    p_full_name: input.full_name,
    p_birth_date: input.birth_date || null,
    p_document_type: input.document_type || null,
    p_document_number: input.document_number || null,
    p_photo_url: input.photo_url || null,
    p_shirt_number: input.shirt_number ?? null,
    p_position: input.position || null,
    p_is_goalkeeper: input.is_goalkeeper ?? false,
    p_is_captain: input.is_captain ?? false,
  });
  if (error) throw error;
  return data as string;
}

export async function getRosterAthlete(championshipId: string, teamId: string, athleteId: string) {
  const rows = await listRoster(championshipId, teamId);
  const athlete = rows.find((item) => item.athlete_id === athleteId);
  if (!athlete) throw new Error("Atleta não pertence ao elenco desta equipe.");
  return athlete;
}
