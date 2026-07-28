import { describe, expect, it } from "vitest";
import {
  ageFromBirthDate,
  participationLabel,
  totalPages,
} from "@/features/global-directory/utils/directory-display";

describe("global directory display helpers", () => {
  it("calculates pagination boundaries", () => {
    expect(totalPages(0, 20)).toBe(1);
    expect(totalPages(41, 20)).toBe(3);
  });

  it("calculates age without exposing document data", () => {
    expect(ageFromBirthDate("2000-08-10", new Date("2026-07-27T12:00:00Z"))).toBe(25);
    expect(ageFromBirthDate(null)).toBeNull();
  });

  it("describes a competitive participation", () => {
    expect(
      participationLabel({
        id: "link",
        championship_id: "championship",
        championship_name: "Copa Arena",
        championship_status: "active",
        team_id: "team",
        team_name: "Atlético",
        status: "approved",
      }),
    ).toBe("Copa Arena · Atlético");
  });
});
