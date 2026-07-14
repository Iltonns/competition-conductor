import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  Championship,
  ChampionshipDependencies,
  UpdateChampionshipDTO,
} from "../types/championship.types";

type ExistingTables = Database["public"]["Tables"];
type SettingsTable = {
  Row: {
    id: string;
    organization_id: string;
    championship_id: string;
    competition_format: string;
    points_win: number;
    points_draw: number;
    points_loss: number;
  };
  Insert: {
    organization_id: string;
    championship_id: string;
    competition_format?: string;
    points_win?: number;
    points_draw?: number;
    points_loss?: number;
  };
  Update: Record<string, never>;
  Relationships: [];
};
type CategoryTable = {
  Row: { id: string; organization_id: string; championship_id: string; name: string };
  Insert: { organization_id: string; championship_id: string; name: string };
  Update: Record<string, never>;
  Relationships: [];
};
type LinkTable = {
  Row: { id: string; organization_id: string; championship_id: string };
  Insert: { organization_id: string; championship_id: string };
  Update: Record<string, never>;
  Relationships: [];
};
type FeatureDatabase = {
  public: {
    Tables: ExistingTables & {
      championship_settings: SettingsTable;
      championship_categories: CategoryTable;
      registrations: LinkTable;
      championship_registrations: LinkTable;
      championship_teams: LinkTable;
    };
    Views: Database["public"]["Views"];
    Functions: Database["public"]["Functions"];
    Enums: Database["public"]["Enums"];
    CompositeTypes: Database["public"]["CompositeTypes"];
  };
};

const client = supabase as unknown as SupabaseClient<FeatureDatabase>;

export async function findOrganizationIdForUser(userId: string): Promise<string> {
  const { data, error } = await client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.organization_id)
    throw new Error("Sua conta ainda não está vinculada a uma organização.");
  return data.organization_id;
}

export async function fetchChampionships(organizationId: string): Promise<Championship[]> {
  const { data, error } = await client
    .from("championships")
    .select(
      "id, organization_id, name, slug, season, status, is_public, cover_url, description, starts_at, ends_at, created_at, updated_at, created_by",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertChampionship(
  payload: ExistingTables["championships"]["Insert"],
): Promise<Championship> {
  const { data, error } = await client.from("championships").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function insertChampionshipSettings(
  organizationId: string,
  championshipId: string,
): Promise<void> {
  const { error } = await client.from("championship_settings").insert({
    organization_id: organizationId,
    championship_id: championshipId,
    competition_format: "groups_knockout",
    points_win: 3,
    points_draw: 1,
    points_loss: 0,
  });
  if (error) throw error;
}

export async function insertDefaultChampionshipCategory(
  organizationId: string,
  championshipId: string,
): Promise<void> {
  const { error } = await client.from("championship_categories").insert({
    organization_id: organizationId,
    championship_id: championshipId,
    name: "Categoria Principal",
  });
  if (error) throw error;
}

export async function updateChampionship(
  organizationId: string,
  championshipId: string,
  changes: UpdateChampionshipDTO,
): Promise<Championship> {
  const { data, error } = await client
    .from("championships")
    .update(changes)
    .eq("organization_id", organizationId)
    .eq("id", championshipId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

function isMissingRelation(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    Boolean(error.message?.includes("Could not find the table"))
  );
}

async function countLinks(
  table:
    "matches" | "teams" | "registrations" | "championship_registrations" | "championship_teams",
  organizationId: string,
  championshipId: string,
): Promise<number | null> {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("championship_id", championshipId);
  if (error && isMissingRelation(error)) return null;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchChampionshipDependencies(
  organizationId: string,
  championshipId: string,
): Promise<ChampionshipDependencies> {
  const [matches, directTeams, linkedTeams, registrations, championshipRegistrations] =
    await Promise.all([
      countLinks("matches", organizationId, championshipId),
      countLinks("teams", organizationId, championshipId),
      countLinks("championship_teams", organizationId, championshipId),
      countLinks("registrations", organizationId, championshipId),
      countLinks("championship_registrations", organizationId, championshipId),
    ]);
  return {
    matches: matches ?? 0,
    teams: Math.max(directTeams ?? 0, linkedTeams ?? 0),
    registrations: Math.max(registrations ?? 0, championshipRegistrations ?? 0),
  };
}

export async function deleteChampionship(
  organizationId: string,
  championshipId: string,
): Promise<void> {
  const { error } = await client
    .from("championships")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", championshipId);
  if (error) throw error;
}
