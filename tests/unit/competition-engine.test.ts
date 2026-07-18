import { describe, expect, it } from "vitest";
import {
  computeGroupAdvancement,
  findFixtureConflicts,
  generateRoundRobin,
  getWalkoverScore,
  rankEntries,
} from "@/features/competition-engine/utils/competition-engine";

describe("motor da competição", () => {
  it("gera turno único sem duplicar confrontos", () => {
    const fixtures = generateRoundRobin(["a", "b", "c", "d"], 1);
    expect(fixtures).toHaveLength(6);
    expect(findFixtureConflicts(fixtures)).toEqual([]);
  });

  it("gera ida e volta invertendo o mando", () => {
    const fixtures = generateRoundRobin(["a", "b", "c", "d"], 2);
    expect(fixtures).toHaveLength(12);
    expect(fixtures.filter((fixture) => fixture.leg === 2)).toHaveLength(6);
    expect(findFixtureConflicts(fixtures)).toEqual([]);
    for (const firstLeg of fixtures.filter((fixture) => fixture.leg === 1)) {
      expect(fixtures).toContainEqual({
        roundNumber: firstLeg.roundNumber + 3,
        leg: 2,
        homeTeamId: firstLeg.awayTeamId,
        awayTeamId: firstLeg.homeTeamId,
      });
    }
  });

  it("trata número ímpar com uma folga por rodada", () => {
    const fixtures = generateRoundRobin(["a", "b", "c"], 1);
    expect(fixtures).toHaveLength(3);
    expect(findFixtureConflicts(fixtures)).toEqual([]);
  });

  it("aplica desempates na ordem configurada", () => {
    const rows = [
      {
        teamId: "a",
        teamName: "A",
        points: 9,
        wins: 2,
        goalDifference: 8,
        goalsFor: 10,
        disciplinaryPoints: 2,
      },
      {
        teamId: "b",
        teamName: "B",
        points: 9,
        wins: 3,
        goalDifference: 2,
        goalsFor: 6,
        disciplinaryPoints: 1,
      },
    ];
    expect(rankEntries(rows, ["points", "wins", "goal_difference"])[0].teamId).toBe("b");
    expect(rankEntries(rows, ["points", "goal_difference", "wins"])[0].teamId).toBe("a");
  });

  it("calcula WO para os dois mandos", () => {
    expect(getWalkoverScore("home", 3, 0)).toEqual({ homeScore: 3, awayScore: 0 });
    expect(getWalkoverScore("away", 3, 0)).toEqual({ homeScore: 0, awayScore: 3 });
  });

  it("gera avanço reproduzível com origem e seed", () => {
    expect(
      computeGroupAdvancement(
        "stage-1",
        [
          { groupId: "a", teamIds: ["a1", "a2", "a3"] },
          { groupId: "b", teamIds: ["b1", "b2", "b3"] },
        ],
        2,
      ),
    ).toEqual([
      { teamId: "a1", sourceStageId: "stage-1", sourceGroupId: "a", sourcePosition: 1, seed: 1 },
      { teamId: "a2", sourceStageId: "stage-1", sourceGroupId: "a", sourcePosition: 2, seed: 2 },
      { teamId: "b1", sourceStageId: "stage-1", sourceGroupId: "b", sourcePosition: 1, seed: 3 },
      { teamId: "b2", sourceStageId: "stage-1", sourceGroupId: "b", sourcePosition: 2, seed: 4 },
    ]);
  });
});
