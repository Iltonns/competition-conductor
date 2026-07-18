import type {
  FixtureDraft,
  QualifiedTeam,
  RankingEntry,
  Tiebreaker,
} from "../types/competition.types";

export function generateRoundRobin(teamIds: readonly string[], legs: 1 | 2): FixtureDraft[] {
  const uniqueTeams = [...new Set(teamIds)];
  if (uniqueTeams.length < 2) return [];
  const bye = "__bye__";
  const rotation = uniqueTeams.length % 2 === 0 ? [...uniqueTeams] : [...uniqueTeams, bye];
  const roundsPerLeg = rotation.length - 1;
  const fixtures: FixtureDraft[] = [];

  for (let round = 0; round < roundsPerLeg; round++) {
    for (let pair = 0; pair < rotation.length / 2; pair++) {
      const first = rotation[pair];
      const second = rotation[rotation.length - 1 - pair];
      if (first === bye || second === bye) continue;
      const reverse = (round + pair) % 2 === 1;
      fixtures.push({
        roundNumber: round + 1,
        leg: 1,
        homeTeamId: reverse ? second : first,
        awayTeamId: reverse ? first : second,
      });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }

  if (legs === 2) {
    fixtures.push(
      ...fixtures.map((fixture) => ({
        roundNumber: fixture.roundNumber + roundsPerLeg,
        leg: 2 as const,
        homeTeamId: fixture.awayTeamId,
        awayTeamId: fixture.homeTeamId,
      })),
    );
  }
  return fixtures;
}

export function findFixtureConflicts(fixtures: readonly FixtureDraft[]): string[] {
  const conflicts: string[] = [];
  const pairKeys = new Set<string>();
  const roundTeams = new Set<string>();
  for (const fixture of fixtures) {
    const pair = [fixture.homeTeamId, fixture.awayTeamId].sort().join(":");
    const pairKey = `${fixture.leg}:${pair}`;
    if (pairKeys.has(pairKey))
      conflicts.push(`Confronto duplicado no turno ${fixture.leg}: ${pair}`);
    pairKeys.add(pairKey);
    for (const teamId of [fixture.homeTeamId, fixture.awayTeamId]) {
      const roundKey = `${fixture.roundNumber}:${teamId}`;
      if (roundTeams.has(roundKey))
        conflicts.push(`Equipe ${teamId} duplicada na rodada ${fixture.roundNumber}`);
      roundTeams.add(roundKey);
    }
  }
  return conflicts;
}

export function rankEntries(
  entries: readonly RankingEntry[],
  tiebreakers: readonly Tiebreaker[],
): RankingEntry[] {
  const ordered = tiebreakers.filter((criterion) => criterion !== "points");
  return [...entries].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    for (const criterion of ordered) {
      const difference = compareCriterion(left, right, criterion);
      if (difference !== 0) return difference;
    }
    return left.teamName.localeCompare(right.teamName) || left.teamId.localeCompare(right.teamId);
  });
}

function compareCriterion(left: RankingEntry, right: RankingEntry, criterion: Tiebreaker) {
  if (criterion === "wins") return right.wins - left.wins;
  if (criterion === "goal_difference") return right.goalDifference - left.goalDifference;
  if (criterion === "goals_for") return right.goalsFor - left.goalsFor;
  if (criterion === "fair_play") return left.disciplinaryPoints - right.disciplinaryPoints;
  // Confronto direto exige os jogos do subconjunto empatado e é aplicado no backend.
  // Sorteio nunca é aleatório no cliente: o desempate final determinístico preserva idempotência.
  return 0;
}

export function getWalkoverScore(winner: "home" | "away", scoreFor: number, scoreAgainst: number) {
  return winner === "home"
    ? { homeScore: scoreFor, awayScore: scoreAgainst }
    : { homeScore: scoreAgainst, awayScore: scoreFor };
}

export function computeGroupAdvancement(
  stageId: string,
  groupRankings: ReadonlyArray<{ groupId: string | null; teamIds: readonly string[] }>,
  qualifiersPerGroup: number,
): QualifiedTeam[] {
  if (qualifiersPerGroup < 1) return [];
  const qualified: QualifiedTeam[] = [];
  for (const group of groupRankings) {
    group.teamIds.slice(0, qualifiersPerGroup).forEach((teamId, index) => {
      qualified.push({
        teamId,
        sourceStageId: stageId,
        sourceGroupId: group.groupId,
        sourcePosition: index + 1,
        seed: qualified.length + 1,
      });
    });
  }
  return qualified;
}
