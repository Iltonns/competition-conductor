import type { Database } from "@/integrations/supabase/types";

export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type ChampionshipTeam = Database["public"]["Tables"]["championship_teams"]["Row"];

export interface TeamInChampionship {
  team: Team;
  registration: ChampionshipTeam;
}

export interface TeamInput {
  name: string;
  short_name?: string;
  abbreviation?: string;
  slug?: string;
  crest_url?: string;
  cover_url?: string;
  primary_color?: string;
  secondary_color?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  foundation_year?: number;
  category?: string;
  gender?: string;
  description?: string;
  history?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  registration_number?: string;
  internal_notes?: string;
}
