import { supabase } from "@/integrations/supabase/client";
import type {
  CompetitiveParticipation,
  DirectoryChampionship,
  DirectoryFilters,
  DirectoryOrganization,
  DirectoryPage,
  GlobalAthlete,
  GlobalTeam,
} from "../types/global-directory.types";

type ParticipationRow = {
  id: string;
  championship_id: string;
  team_id: string;
  status: string;
  athlete_id?: string;
  shirt_number?: number | null;
  position?: string | null;
};

export async function listDirectoryOrganizations(): Promise<DirectoryOrganization[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id");
  if (membershipError) throw membershipError;
  const organizationIds = [...new Set((memberships ?? []).map((row) => row.organization_id))];
  if (!organizationIds.length) return [];

  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,logo_url")
    .in("id", organizationIds)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function listChampionships(organizationId: string): Promise<DirectoryChampionship[]> {
  const { data, error } = await supabase
    .from("championships")
    .select("id,name,status")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

function normalizedSearch(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ");
}

function mapParticipations(
  rows: ParticipationRow[],
  championships: DirectoryChampionship[],
  teams: Array<{ id: string; name: string }>,
) {
  const championshipMap = new Map(championships.map((item) => [item.id, item]));
  const teamMap = new Map(teams.map((item) => [item.id, item.name]));
  return rows.reduce<Map<string, CompetitiveParticipation[]>>((result, row) => {
    const championship = championshipMap.get(row.championship_id);
    const participation: CompetitiveParticipation = {
      id: row.id,
      championship_id: row.championship_id,
      championship_name: championship?.name ?? "Campeonato",
      championship_status: championship?.status ?? "unknown",
      team_id: row.team_id,
      team_name: teamMap.get(row.team_id) ?? "Equipe",
      status: row.status,
      shirt_number: row.shirt_number,
      position: row.position,
    };
    const key = row.athlete_id ?? row.team_id;
    result.set(key, [...(result.get(key) ?? []), participation]);
    return result;
  }, new Map());
}

export async function listGlobalTeams(
  organizationId: string,
  filters: DirectoryFilters,
): Promise<DirectoryPage<GlobalTeam>> {
  const championships = await listChampionships(organizationId);
  let eligibleTeamIds: string[] | null = null;
  if (filters.championshipId) {
    const { data, error } = await supabase
      .from("championship_teams")
      .select("team_id")
      .eq("organization_id", organizationId)
      .eq("championship_id", filters.championshipId);
    if (error) throw error;
    eligibleTeamIds = [...new Set((data ?? []).map((row) => row.team_id))];
    if (!eligibleTeamIds.length) return { items: [], total: 0, championships };
  }

  let query = supabase
    .from("teams")
    .select(
      "id,organization_id,name,short_name,abbreviation,crest_url,city,state,status,email,website,created_at",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("name")
    .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1);
  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (eligibleTeamIds) query = query.in("id", eligibleTeamIds);
  const search = normalizedSearch(filters.search);
  if (search)
    query = query.or(
      `name.ilike.%${search}%,short_name.ilike.%${search}%,abbreviation.ilike.%${search}%`,
    );

  const { data, error, count } = await query;
  if (error) throw error;
  const teams = data ?? [];
  if (!teams.length) return { items: [], total: count ?? 0, championships };

  const { data: links, error: linksError } = await supabase
    .from("championship_teams")
    .select("id,championship_id,team_id,status")
    .eq("organization_id", organizationId)
    .in(
      "team_id",
      teams.map((team) => team.id),
    );
  if (linksError) throw linksError;
  const participationMap = mapParticipations(links ?? [], championships, teams);
  return {
    total: count ?? 0,
    championships,
    items: teams.map((team) => ({
      ...team,
      participations: participationMap.get(team.id) ?? [],
    })) as GlobalTeam[],
  };
}

export async function getGlobalTeam(organizationId: string, teamId: string): Promise<GlobalTeam> {
  const [{ data: team, error }, championships] = await Promise.all([
    supabase
      .from("teams")
      .select(
        "id,organization_id,name,short_name,abbreviation,crest_url,city,state,status,email,website,created_at",
      )
      .eq("organization_id", organizationId)
      .eq("id", teamId)
      .maybeSingle(),
    listChampionships(organizationId),
  ]);
  if (error) throw error;
  if (!team) throw new Error("directory:team_not_found");
  const { data: links, error: linksError } = await supabase
    .from("championship_teams")
    .select("id,championship_id,team_id,status")
    .eq("organization_id", organizationId)
    .eq("team_id", teamId);
  if (linksError) throw linksError;
  const participations = mapParticipations(links ?? [], championships, [team]).get(team.id) ?? [];
  return { ...team, participations } as GlobalTeam;
}

type AthleteParticipationRow = ParticipationRow & { athlete_id: string };

export async function listGlobalAthletes(
  organizationId: string,
  filters: DirectoryFilters,
): Promise<DirectoryPage<GlobalAthlete>> {
  const championships = await listChampionships(organizationId);
  let eligibleAthleteIds: string[] | null = null;
  if (filters.championshipId) {
    const { data, error } = await supabase
      .from("championship_team_athletes")
      .select("athlete_id")
      .eq("organization_id", organizationId)
      .eq("championship_id", filters.championshipId);
    if (error) throw error;
    eligibleAthleteIds = [...new Set((data ?? []).map((row) => row.athlete_id))];
    if (!eligibleAthleteIds.length) return { items: [], total: 0, championships };
  }

  let query = supabase
    .from("athletes")
    .select(
      "id,organization_id,full_name,sport_name,photo_url,birth_date,nationality,city,state,status,created_at",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("full_name")
    .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1);
  if (filters.status !== "all") query = query.eq("status", filters.status);
  if (eligibleAthleteIds) query = query.in("id", eligibleAthleteIds);
  const search = normalizedSearch(filters.search);
  if (search) query = query.or(`full_name.ilike.%${search}%,sport_name.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  const athletes = data ?? [];
  if (!athletes.length) return { items: [], total: count ?? 0, championships };

  const { data: links, error: linksError } = await supabase
    .from("championship_team_athletes")
    .select("id,athlete_id,championship_id,team_id,registration_status,shirt_number,position")
    .eq("organization_id", organizationId)
    .in(
      "athlete_id",
      athletes.map((athlete) => athlete.id),
    );
  if (linksError) throw linksError;
  const teamIds = [...new Set((links ?? []).map((link) => link.team_id))];
  const { data: teams, error: teamsError } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name")
        .eq("organization_id", organizationId)
        .in("id", teamIds)
    : { data: [], error: null };
  if (teamsError) throw teamsError;
  const participationRows: AthleteParticipationRow[] = (links ?? []).map((link) => ({
    id: link.id,
    athlete_id: link.athlete_id,
    championship_id: link.championship_id,
    team_id: link.team_id,
    status: link.registration_status,
    shirt_number: link.shirt_number,
    position: link.position,
  }));
  const participationMap = mapParticipations(participationRows, championships, teams ?? []);
  return {
    total: count ?? 0,
    championships,
    items: athletes.map((athlete) => ({
      ...athlete,
      participations: participationMap.get(athlete.id) ?? [],
    })) as GlobalAthlete[],
  };
}

export async function getGlobalAthlete(
  organizationId: string,
  athleteId: string,
): Promise<GlobalAthlete> {
  const [{ data: athlete, error }, championships] = await Promise.all([
    supabase
      .from("athletes")
      .select(
        "id,organization_id,full_name,sport_name,photo_url,birth_date,nationality,city,state,status,created_at",
      )
      .eq("organization_id", organizationId)
      .eq("id", athleteId)
      .maybeSingle(),
    listChampionships(organizationId),
  ]);
  if (error) throw error;
  if (!athlete) throw new Error("directory:athlete_not_found");
  const { data: links, error: linksError } = await supabase
    .from("championship_team_athletes")
    .select("id,athlete_id,championship_id,team_id,registration_status,shirt_number,position")
    .eq("organization_id", organizationId)
    .eq("athlete_id", athleteId);
  if (linksError) throw linksError;
  const teamIds = [...new Set((links ?? []).map((link) => link.team_id))];
  const { data: teams, error: teamsError } = teamIds.length
    ? await supabase
        .from("teams")
        .select("id,name")
        .eq("organization_id", organizationId)
        .in("id", teamIds)
    : { data: [], error: null };
  if (teamsError) throw teamsError;
  const participationRows: AthleteParticipationRow[] = (links ?? []).map((link) => ({
    id: link.id,
    athlete_id: link.athlete_id,
    championship_id: link.championship_id,
    team_id: link.team_id,
    status: link.registration_status,
    shirt_number: link.shirt_number,
    position: link.position,
  }));
  const participations =
    mapParticipations(participationRows, championships, teams ?? []).get(athlete.id) ?? [];
  return { ...athlete, participations } as GlobalAthlete;
}
