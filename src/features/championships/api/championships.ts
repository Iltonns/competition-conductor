import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  Championship,
  ChampionshipOverview,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "../types/championship.types";

const CHAMPIONSHIP_SELECT = "*" as const;

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
  const { data, error } = await supabase
    .from("championships")
    .select(CHAMPIONSHIP_SELECT)
    .eq("id", championshipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("championship:not_found");
  return data;
}

export async function fetchChampionshipOverview(
  organizationId: string,
  championshipId: string,
): Promise<ChampionshipOverview> {
  const [teamsResult, matchesResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("championship_id", championshipId),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("championship_id", championshipId),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (matchesResult.error) throw matchesResult.error;

  const athletesResult = await supabase
    .from("athletes")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (athletesResult.error) throw athletesResult.error;

  return {
    teams: teamsResult.count ?? 0,
    athletes: athletesResult.count ?? 0,
    matches: matchesResult.count ?? 0,
    currentStage: "Fase principal",
  };
}

export async function createChampionshipAtomic(
  organizationId: string,
  slug: string,
  input: CreateChampionshipDTO,
): Promise<Championship> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("championships")
    .insert({
      organization_id: organizationId,
      name: input.name,
      slug,
      season: input.season,
      description: input.description,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      is_public: input.is_public,
      created_by: userData.user?.id ?? null,
    })
    .select(CHAMPIONSHIP_SELECT)
    .single();
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
  const { error } = await supabase.from("championships").delete().eq("id", championshipId);
  if (error) throw error;
}
