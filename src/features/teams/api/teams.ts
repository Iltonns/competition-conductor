import { supabase } from "@/integrations/supabase/client";
import type { Team, TeamInChampionship, TeamInput } from "../types/team.types";
import { slugifyTeamName } from "../utils/team-utils";

function rpcInput(championshipId: string, input: TeamInput) {
  return {
    p_championship_id: championshipId,
    p_name: input.name.trim(),
    p_short_name: input.short_name || undefined,
    p_abbreviation: input.abbreviation || undefined,
    p_slug: input.slug || slugifyTeamName(input.name),
    p_crest_url: input.crest_url || undefined,
    p_cover_url: input.cover_url || undefined,
    p_primary_color: input.primary_color || undefined,
    p_secondary_color: input.secondary_color || undefined,
    p_city: input.city || undefined,
    p_state: input.state || undefined,
    p_neighborhood: input.neighborhood || undefined,
    p_foundation_year: input.foundation_year,
    p_category: input.category || undefined,
    p_gender: input.gender || undefined,
    p_description: input.description || undefined,
    p_history: input.history || undefined,
    p_phone: input.phone || undefined,
    p_whatsapp: input.whatsapp || undefined,
    p_email: input.email || undefined,
    p_instagram: input.instagram || undefined,
    p_facebook: input.facebook || undefined,
    p_website: input.website || undefined,
    p_registration_number: input.registration_number || undefined,
    p_internal_notes: input.internal_notes || undefined,
  };
}

export async function listTeamsForChampionship(
  championshipId: string,
): Promise<TeamInChampionship[]> {
  const { data: registrations, error } = await supabase
    .from("championship_teams")
    .select("*")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!registrations.length) return [];
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .in(
      "id",
      registrations.map(({ team_id }) => team_id),
    );
  if (teamsError) throw teamsError;
  const byId = new Map(teams.map((team) => [team.id, team]));
  return registrations.flatMap((registration) => {
    const team = byId.get(registration.team_id);
    return team ? [{ team, registration }] : [];
  });
}

export async function getTeamForChampionship(
  championshipId: string,
  teamId: string,
): Promise<TeamInChampionship> {
  const { data: registration, error } = await supabase
    .from("championship_teams")
    .select("*")
    .eq("championship_id", championshipId)
    .eq("team_id", teamId)
    .maybeSingle();
  if (error) throw error;
  if (!registration) throw new Error("team:not_found");
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("organization_id", registration.organization_id)
    .maybeSingle();
  if (teamError) throw teamError;
  if (!team) throw new Error("team:not_found");
  return { team, registration };
}

export async function createTeam(championshipId: string, input: TeamInput): Promise<Team> {
  const { data, error } = await supabase.rpc(
    "create_team_for_championship",
    rpcInput(championshipId, input),
  );
  if (error) throw error;
  return data;
}

export async function updateTeam(
  championshipId: string,
  teamId: string,
  input: TeamInput,
): Promise<Team> {
  const { data, error } = await supabase.rpc("update_team_for_championship", {
    ...rpcInput(championshipId, input),
    p_team_id: teamId,
  });
  if (error) throw error;
  return data;
}

export async function setTeamArchived(championshipId: string, teamId: string, archived: boolean) {
  const { error } = await supabase.rpc("set_team_championship_archived", {
    p_championship_id: championshipId,
    p_team_id: teamId,
    p_archived: archived,
  });
  if (error) throw error;
}

export async function removeTeamLink(championshipId: string, teamId: string) {
  const { error } = await supabase.rpc("remove_team_from_championship", {
    p_championship_id: championshipId,
    p_team_id: teamId,
  });
  if (error) throw error;
}
