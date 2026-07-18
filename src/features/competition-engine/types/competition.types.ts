export type CompetitionFormat = "round_robin" | "groups" | "knockout" | "groups_knockout";

export type Tiebreaker =
  "points" | "wins" | "goal_difference" | "goals_for" | "head_to_head" | "fair_play" | "draw";

export interface FixtureDraft {
  roundNumber: number;
  leg: 1 | 2;
  homeTeamId: string;
  awayTeamId: string;
}

export interface RankingEntry {
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  goalDifference: number;
  goalsFor: number;
  disciplinaryPoints: number;
}

export interface QualifiedTeam {
  teamId: string;
  sourceStageId: string;
  sourceGroupId: string | null;
  sourcePosition: number;
  seed: number;
}
