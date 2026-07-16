import type { Database } from "@/integrations/supabase/types";

type TeamRow = Database["public"]["Tables"]["teams"]["Row"];

export type Team = TeamRow & {
  abbreviation?: string | null;
  slug?: string | null;
  cover_url?: string | null;
  secondary_color?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  foundation_year?: number | null;
  category?: string | null;
  gender?: string | null;
  description?: string | null;
  history?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  website?: string | null;
  registration_number?: string | null;
  internal_notes?: string | null;
};

export interface ChampionshipTeam {
  id: string;
  championship_id: string;
  team_id: string;
  organization_id: string;
  status: string;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
}

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
