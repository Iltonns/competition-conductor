import { describe, expect, it } from "vitest";
import type { ChampionshipIdentityInput } from "@/features/championship-settings/api/championship-settings";
import {
  isDangerConfirmationValid,
  validateChampionshipIdentity,
} from "@/features/championship-settings/utils/championship-settings-validation";

const identity: ChampionshipIdentityInput = {
  name: "Copa Regional",
  season: "2026",
  description: "",
  starts_at: "2026-08-01",
  ends_at: "2026-09-01",
  city: "",
  state: "",
  contact_email: "",
  contact_phone: "",
  website_url: "https://example.com",
  instagram_url: "",
};

describe("championship settings validation", () => {
  it("accepts a valid identity", () => {
    expect(validateChampionshipIdentity(identity)).toBeNull();
  });

  it("rejects an inverted period and insecure external URLs", () => {
    expect(
      validateChampionshipIdentity({
        ...identity,
        starts_at: "2026-09-02",
        ends_at: "2026-09-01",
      }),
    ).toContain("data final");
    expect(
      validateChampionshipIdentity({
        ...identity,
        website_url: "http://example.com",
      }),
    ).toContain("HTTPS");
  });

  it("requires exact name and a bounded justification for dangerous actions", () => {
    expect(isDangerConfirmationValid("Copa Regional", "Copa Regional", "Motivo válido")).toBe(true);
    expect(isDangerConfirmationValid("copa regional", "Copa Regional", "Motivo válido")).toBe(
      false,
    );
    expect(isDangerConfirmationValid("Copa Regional", "Copa Regional", "curto")).toBe(false);
  });
});
