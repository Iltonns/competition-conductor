export interface RosterAthlete {
  id: string;
  athlete_id: string;
  full_name: string;
  sport_name: string | null;
  photo_url: string | null;
  birth_date: string | null;
  shirt_number: number | null;
  position: string | null;
  registration_status: string;
  is_goalkeeper: boolean;
  is_captain: boolean;
  active: boolean;
}

export interface AthleteInput {
  full_name: string;
  birth_date?: string;
  document_type?: string;
  document_number?: string;
  photo_url?: string;
  shirt_number?: number;
  position?: string;
  is_goalkeeper?: boolean;
  is_captain?: boolean;
}
