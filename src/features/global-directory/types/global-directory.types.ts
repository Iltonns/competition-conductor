export interface DirectoryOrganization {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface DirectoryChampionship {
  id: string;
  name: string;
  status: string;
}

export interface CompetitiveParticipation {
  id: string;
  championship_id: string;
  championship_name: string;
  championship_status: string;
  team_id: string;
  team_name: string;
  status: string;
  shirt_number?: number | null;
  position?: string | null;
}

export interface GlobalTeam {
  id: string;
  organization_id: string;
  name: string;
  short_name: string | null;
  abbreviation: string | null;
  crest_url: string | null;
  city: string | null;
  state: string | null;
  status: string;
  email: string | null;
  website: string | null;
  created_at: string;
  participations: CompetitiveParticipation[];
}

export interface GlobalAthlete {
  id: string;
  organization_id: string;
  full_name: string;
  sport_name: string | null;
  photo_url: string | null;
  birth_date: string | null;
  nationality: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
  participations: CompetitiveParticipation[];
}

export interface DirectoryFilters {
  search: string;
  status: string;
  championshipId: string;
  page: number;
  pageSize: number;
}

export interface DirectoryPage<T> {
  items: T[];
  total: number;
  championships: DirectoryChampionship[];
}
