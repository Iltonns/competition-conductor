import { supabase } from "@/integrations/supabase/client";
import type { Team, TeamInChampionship, TeamInput } from "../types/team.types";

function toTeamPayload(organizationId: string, championshipId: string, input: TeamInput) {
  const foundationYear =
    typeof input.foundation_year === "number" && !Number.isNaN(input.foundation_year)
      ? input.foundation_year
      : null;
  return {
    organization_id: organizationId,
    championship_id: championshipId,
    name: input.name.trim(),
    short_name: input.short_name || null,
    abbreviation: input.abbreviation || null,
    slug: input.slug || null,
    crest_url: input.crest_url || null,
    cover_url: input.cover_url || null,
    primary_color: input.primary_color || null,
    secondary_color: input.secondary_color || null,
    city: input.city || null,
    state: input.state || null,
    neighborhood: input.neighborhood || null,
    foundation_year: foundationYear,
    category: input.category || null,
    gender: input.gender || null,
    description: input.description || null,
    history: input.history || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    email: input.email || null,
    instagram: input.instagram || null,
    facebook: input.facebook || null,
    website: input.website || null,
    registration_number: input.registration_number || null,
    internal_notes: input.internal_notes || null,
    status: "active",
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

async function upsertRegistration(
  organizationId: string,
  championshipId: string,
  teamId: string,
  status: string,
  registrationNumber?: string | null,
) {
  const { error } = await supabase.from("championship_teams").upsert(
    {
      organization_id: organizationId,
      championship_id: championshipId,
      team_id: teamId,
      status,
      registration_number: registrationNumber ?? null,
    },
    { onConflict: "championship_id,team_id" },
  );
  if (error) throw error;
}

async function loadRegistration(championshipId: string, teamId: string) {
  const { data } = await supabase
    .from("championship_teams")
    .select("id, championship_id, team_id, organization_id, status, registration_number, created_at, updated_at")
    .eq("championship_id", championshipId)
    .eq("team_id", teamId)
    .maybeSingle();
  return data;
}

function fallbackRegistration(team: Team) {
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
  const teams = (data ?? []) as Team[];
  const registrations = await Promise.all(
    teams.map((team) => loadRegistration(championshipId, team.id)),
  );
  return teams.map((team, index) => ({
    team,
    registration: registrations[index] ?? fallbackRegistration(team),
  }));
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
  const registration = await loadRegistration(championshipId, teamId);
  return { team: team as Team, registration: registration ?? fallbackRegistration(team as Team) };
}

export async function createTeam(championshipId: string, input: TeamInput): Promise<Team> {
  const organizationId = await getChampionshipOrganizationId(championshipId);
  const { data, error } = await supabase
    .from("teams")
    .insert(toTeamPayload(organizationId, championshipId, input))
    .select("*")
    .single();
  if (error) throw error;
  const team = data as Team;
  await upsertRegistration(
    organizationId,
    championshipId,
    team.id,
    "active",
    input.registration_number,
  );
  return team;
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
  await upsertRegistration(
    organizationId,
    championshipId,
    teamId,
    "active",
    input.registration_number,
  );
  return data as Team;
}

export async function setTeamArchived(championshipId: string, teamId: string, archived: boolean) {
  const status = archived ? "archived" : "active";
  const { error } = await supabase
    .from("teams")
    .update({ status })
    .eq("id", teamId)
    .eq("championship_id", championshipId);
  if (error) throw error;
  const organizationId = await getChampionshipOrganizationId(championshipId);
  await upsertRegistration(organizationId, championshipId, teamId, status);
}

export async function removeTeamLink(championshipId: string, teamId: string) {
  const { error: delError } = await supabase
    .from("championship_teams")
    .delete()
    .eq("championship_id", championshipId)
    .eq("team_id", teamId);
  if (delError) throw delError;
  const { error } = await supabase
    .from("teams")
    .update({ championship_id: null, status: "archived" })
    .eq("id", teamId)
    .eq("championship_id", championshipId);
  if (error) throw error;
}
