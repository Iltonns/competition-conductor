import { describe, expect, it } from "vitest";
import type { OrganizationProfileInput } from "../types/organization-settings.types";
import { assignableRoles, validateOrganizationProfile } from "./organization-settings-validation";

const validProfile: OrganizationProfileInput = {
  name: "IS Arena",
  logo_url: "https://cdn.example.com/logo.png",
  contact_email: "contato@example.com",
  contact_phone: "",
  website_url: "https://example.com",
  city: "São Paulo",
  state: "SP",
  timezone: "America/Sao_Paulo",
  locale: "pt-BR",
};

describe("organization settings validation", () => {
  it("accepts a valid organization profile", () => {
    expect(validateOrganizationProfile(validProfile)).toBeNull();
  });

  it("rejects insecure external URLs", () => {
    expect(
      validateOrganizationProfile({ ...validProfile, website_url: "http://example.com" }),
    ).toContain("HTTPS");
    expect(
      validateOrganizationProfile({ ...validProfile, logo_url: "javascript:alert(1)" }),
    ).toContain("HTTPS");
  });

  it("does not expose owner or admin assignment to administrators", () => {
    expect(assignableRoles("admin", true)).toEqual(["editor", "viewer"]);
    expect(assignableRoles("owner", true)).toContain("owner");
  });
});
