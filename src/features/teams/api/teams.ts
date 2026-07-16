import { supabase } from "@/integrations/supabase/client";
import type { Team, TeamInChampionship, TeamInput } from "../types/team.types";
import { slugifyTeamName } from "../utils/team-utils";

function toTeamPayload(organizationId: string, championshipId: string, input: TeamInput) {
  return {
    organization_id: organizationId,
    championship_id: championshipId,
    name: input.name.trim(),
    short_name: input.short_name || null,
    crest_url: input.crest_url || null,
    primary_color: input.primary_color || null,
    city: input.city || null,
    status: "approved",
  };
}

async function getChampionshipOrganizationId(championshipId: string) {
  const { data, error } = await supabase
    .from("championships")
    .select("organization_id")
    .eq("id", championshipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("team:not_found");
  return data.organization_id;
}

function asRegistration(team: Team) {
  return {
    id: `${team.championship_id ?? "championship"}:${team.id}`,
    championship_id: team.championship_id ?? "",
    team_id: team.id,
    organization_id: team.organization_id,
    status: team.status,
    registration_number: team.registration_number ?? null,
    created_at: team.created_at,
    updated_at: team.updated_at,
  };
}

export async function listTeamsForChampionship(
  championshipId: string,
): Promise<TeamInChampionship[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Team[]).map((team) => ({ team, registration: asRegistration(team) }));
}

export async function getTeamForChampionship(
  championshipId: string,
  teamId: string,
): Promise<TeamInChampionship> {
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("championship_id", championshipId)
    .maybeSingle();
  if (teamError) throw teamError;
  if (!team) throw new Error("team:not_found");
  return { team: team as Team, registration: asRegistration(team as Team) };
}

export async function createTeam(championshipId: string, input: TeamInput): Promise<Team> {
  const organizationId = await getChampionshipOrganizationId(championshipId);
  const { data, error } = await supabase
    .from("teams")
    .insert(toTeamPayload(organizationId, championshipId, input))
    .select("*")
    .single();
  if (error) throw error;
  return data as Team;
}

export async function updateTeam(
  championshipId: string,
  teamId: string,
  input: TeamInput,
): Promise<Team> {
  const organizationId = await getChampionshipOrganizationId(championshipId);
  const { data, error } = await supabase
    .from("teams")
    .update(toTeamPayload(organizationId, championshipId, input))
    .eq("id", teamId)
    .eq("championship_id", championshipId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Team;
}

export async function setTeamArchived(championshipId: string, teamId: string, archived: boolean) {
  const { error } = await supabase
    .from("teams")
    .update({ status: archived ? "archived" : "approved" })
    .eq("id", teamId)
    .eq("championship_id", championshipId);
  if (error) throw error;
}

export async function removeTeamLink(championshipId: string, teamId: string) {
  const { error } = await supabase
    .from("teams")
    .update({ championship_id: null, status: "archived" })
    .eq("id", teamId)
    .eq("championship_id", championshipId);
  if (error) throw error;
}
