import type { Database, Json } from "@/integrations/supabase/types";
import type {
  CompetitionFormat,
  FixtureDraft,
  QualifiedTeam,
  Tiebreaker,
} from "./competition.types";

export type CompetitionSettingsRow = Database["public"]["Tables"]["championship_settings"]["Row"];
export type CompetitionStage = Database["public"]["Tables"]["competition_stages"]["Row"];
export type CompetitionGroup = Database["public"]["Tables"]["competition_groups"]["Row"];
export type CompetitionRound = Database["public"]["Tables"]["competition_rounds"]["Row"];

export interface CompetitionSettingsInput {
  competition_format: CompetitionFormat;
  legs: 1 | 2;
  group_count: number | null;
  qualifiers_per_group: number | null;
  third_place_match: boolean;
  points_win: number;
  points_draw: number;
  points_loss: number;
  tiebreakers: Tiebreaker[];
  allow_draw: boolean;
  uses_extra_time: boolean;
  uses_penalties: boolean;
  wo_score_for: number;
  wo_score_against: number;
  minimum_rest_hours: number;
  min_athletes_per_team: number | null;
  max_athletes_per_team: number | null;
  max_goalkeepers_per_team: number | null;
  max_staff_per_team: number | null;
  minimum_athlete_age: number | null;
  maximum_athlete_age: number | null;
  registration_starts_at: string | null;
  registration_ends_at: string | null;
  require_athlete_document: boolean;
  require_athlete_photo: boolean;
  require_shirt_number: boolean;
  allow_duplicate_shirt_numbers: boolean;
  allow_athlete_multiple_teams: boolean;
  allow_roster_changes_after_start: boolean;
  yellow_cards_for_suspension: number;
  custom_rules: Json;
}

export interface StageInput {
  name: string;
  stage_type: "league" | "groups" | "knockout" | "custom";
  sequence: number;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  settings: Json;
}

export interface StageTeam {
  id: string;
  team_id: string;
  group_id: string | null;
  seed: number | null;
  source_stage_id: string | null;
  source_group_id: string | null;
  source_position: number | null;
  assignment_method: string;
  team_name: string;
  team_short_name: string | null;
}

export interface FixtureCommitInput {
  championshipId: string;
  stageId: string;
  groupId: string | null;
  clientRequestId: string;
  fixtures: FixtureDraft[];
  firstKickoff: string;
  roundIntervalHours: number;
}

export interface AdvancementInput {
  championshipId: string;
  sourceStageId: string;
  targetStageId: string;
  clientRequestId: string;
  qualifiedTeams: QualifiedTeam[];
}

export interface StageStanding {
  team_id: string;
  group_id: string | null;
  position: number;
  points: number;
}
