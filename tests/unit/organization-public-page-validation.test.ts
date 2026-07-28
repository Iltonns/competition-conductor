import { describe, expect, it } from "vitest";
import {
  normalizeOrganizationSlug,
  validateOrganizationPublicPage,
} from "../../src/features/organization-public-page/utils/organization-public-page-validation";

describe("organization public page validation", () => {
  it("normalizes accents and unsafe separators", () => {
    expect(normalizeOrganizationSlug("  Associação São João / Futebol  ")).toBe(
      "associacao-sao-joao-futebol",
    );
  });

  it("rejects insecure links", () => {
    expect(
      validateOrganizationPublicPage({
        slug: "arena-oficial",
        headline: "Arena Oficial",
        description: "Uma organização esportiva.",
        social_links: { instagram: "javascript:alert(1)" },
        show_contact_email: false,
        show_contact_phone: false,
      }),
    ).toBe("Todos os links públicos devem usar HTTPS.");
  });

  it("accepts a valid public profile", () => {
    expect(
      validateOrganizationPublicPage({
        slug: "arena-oficial",
        headline: "Arena Oficial",
        description: "Uma organização esportiva.",
        social_links: { instagram: "https://instagram.com/arena" },
        show_contact_email: true,
        show_contact_phone: false,
      }),
    ).toBeNull();
  });
});
