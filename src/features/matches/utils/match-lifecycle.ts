import type { MatchStatus } from "../api/matches";

const TRANSITIONS: Partial<Record<MatchStatus, readonly MatchStatus[]>> = {
  preparing: ["live", "postponed", "cancelled"],
  scheduled: ["live", "postponed", "cancelled"],
  postponed: ["scheduled", "cancelled"],
  live: ["finished", "postponed", "cancelled"],
  finished: ["live"],
};

export function getAllowedMatchTransitions(status: MatchStatus): readonly MatchStatus[] {
  return TRANSITIONS[status] ?? [];
}

export function canTransitionMatch(from: MatchStatus, to: MatchStatus): boolean {
  return getAllowedMatchTransitions(from).includes(to);
}

export function matchTransitionNeedsReason(status: MatchStatus): boolean {
  return status === "postponed" || status === "cancelled";
}
