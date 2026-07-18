import { describe, expect, it } from "vitest";
import {
  canTransitionMatch,
  getAllowedMatchTransitions,
  matchTransitionNeedsReason,
} from "@/features/matches/utils/match-lifecycle";

describe("ciclo de vida de partidas", () => {
  it("permite o fluxo normal agendada, ao vivo e finalizada", () => {
    expect(canTransitionMatch("scheduled", "live")).toBe(true);
    expect(canTransitionMatch("live", "finished")).toBe(true);
  });

  it("bloqueia saltos e mutações incompatíveis", () => {
    expect(canTransitionMatch("scheduled", "finished")).toBe(false);
    expect(canTransitionMatch("finished", "cancelled")).toBe(false);
    expect(getAllowedMatchTransitions("cancelled")).toEqual([]);
  });

  it("exige motivo para adiamento e cancelamento", () => {
    expect(matchTransitionNeedsReason("postponed")).toBe(true);
    expect(matchTransitionNeedsReason("cancelled")).toBe(true);
    expect(matchTransitionNeedsReason("live")).toBe(false);
  });
});
