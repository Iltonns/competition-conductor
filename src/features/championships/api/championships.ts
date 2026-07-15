import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  Championship,
  ChampionshipOverview,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "../types/championship.types";

const CHAMPIONSHIP_SELECT =
  "id, organization_id, name, slug, season, status, is_public, cover_url, description, starts_at, ends_at, created_at, updated_at, created_by, updated_by" as const;

type AppRole = Database["public"]["Enums"]["app_role"];

export async function fetchWritableOrganizationIds(userId: string): Promise<string[]> {
  const writableRoles: AppRole[] = ["owner", "admin", "editor"];
  const { data, error } = await supabase
    .from("user_roles")
    .select("organization_id")
    .eq("user_id", userId)
    .in("role", writableRoles);
  if (error) throw error;
  return [...new Set(data.map(({ organization_id }) => organization_id))];
}

export async function fetchMemberOrganizationIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);
  if (error) throw error;
  return [...new Set(data.map(({ organization_id }) => organization_id))];
}

export async function fetchChampionships(organizationIds: string[]): Promise<Championship[]> {
  if (organizationIds.length === 0) return [];
  const { data, error } = await supabase
    .from("championships")
    .select(CHAMPIONSHIP_SELECT)
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchChampionship(championshipId: string): Promise<Championship> {
  const { data, error } = await supabase.rpc("get_championship_context", {
    p_championship_id: championshipId,
  });
  if (error) throw error;
  if (!data) throw new Error("championship:not_found");
  return data;
}

export async function fetchChampionshipOverview(
  organizationId: string,
  championshipId: string,
): Promise<ChampionshipOverview> {
  const [teamsResult, matchesResult, stagesResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("championship_id", championshipId),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("championship_id", championshipId),
    supabase
      .from("competition_stages")
      .select("name, status, sequence")
      .eq("organization_id", organizationId)
      .eq("championship_id", championshipId)
      .order("sequence", { ascending: true }),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (matchesResult.error) throw matchesResult.error;
  if (stagesResult.error) throw stagesResult.error;

  const teamIds = teamsResult.data.map((team) => team.id);
  let athletes = 0;
  if (teamIds.length > 0) {
    const athletesResult = await supabase
      .from("athletes")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("team_id", teamIds);
    if (athletesResult.error) throw athletesResult.error;
    athletes = athletesResult.count ?? 0;
  }

  const currentStage =
    stagesResult.data.find(({ status }) => status === "active") ?? stagesResult.data.at(0);

  return {
    teams: teamIds.length,
    athletes,
    matches: matchesResult.count ?? 0,
    currentStage: currentStage?.name ?? null,
  };
}

export async function createChampionshipAtomic(
  organizationId: string,
  slug: string,
  input: CreateChampionshipDTO,
): Promise<Championship> {
  const { data, error } = await supabase.rpc("create_championship", {
    p_organization_id: organizationId,
    p_name: input.name,
    p_slug: slug,
    p_season: input.season ?? undefined,
    p_description: input.description ?? undefined,
    p_starts_at: input.starts_at ?? undefined,
    p_ends_at: input.ends_at ?? undefined,
    p_is_public: input.is_public,
    p_category_name: input.category_name ?? "Categoria Principal",
    p_create_initial_stage: true,
  });
  if (error) throw error;
  if (!data) throw new Error("championship:transaction_failed");
  return data;
}

export async function updateChampionship(
  organizationId: string,
  championshipId: string,
  changes: UpdateChampionshipDTO,
): Promise<Championship> {
  const { data, error } = await supabase
    .from("championships")
    .update(changes)
    .eq("organization_id", organizationId)
    .eq("id", championshipId)
    .select(CHAMPIONSHIP_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChampionship(championshipId: string): Promise<void> {
  const { error } = await supabase.rpc("delete_championship", {
    p_championship_id: championshipId,
  });
  if (error) throw error;
}
