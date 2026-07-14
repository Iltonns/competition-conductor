import type { Database } from "@/integrations/supabase/types";

export type ChampionshipStatus = Database["public"]["Enums"]["championship_status"];

export type Championship = Database["public"]["Tables"]["championships"]["Row"];

export interface CreateChampionshipDTO {
  name: string;
  season: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_public: boolean;
}

export interface UpdateChampionshipDTO {
  name?: string;
  season?: string | null;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_public?: boolean;
  status?: ChampionshipStatus;
}

export interface ChampionshipDependencies {
  matches: number;
  registrations: number;
  teams: number;
}

export interface ChampionshipMutationContext {
  championshipId: string;
  organizationId: string;
}

export interface UpdateChampionshipVariables extends ChampionshipMutationContext {
  changes: UpdateChampionshipDTO;
}

export type DeleteChampionshipVariables = ChampionshipMutationContext;
