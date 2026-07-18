import { describe, expect, it } from "vitest";
import {
  ChampionshipDomainError,
  translateChampionshipError,
} from "@/features/championships/errors/championship-errors";

describe("translateChampionshipError", () => {
  it.each([
    ["championship:forbidden", "FORBIDDEN"],
    ["championship:duplicate_slug", "DUPLICATE_SLUG"],
    ["championship:has_dependencies", "HAS_DEPENDENCIES"],
    ["championship:not_found", "NOT_FOUND"],
  ] as const)("traduz %s para %s", (message, code) => {
    expect(translateChampionshipError(new Error(message)).code).toBe(code);
  });

  it.each([
    ["23505", "DUPLICATE_SLUG"],
    ["42501", "FORBIDDEN"],
    ["PGRST116", "NOT_FOUND"],
  ] as const)("traduz o código PostgreSQL/PostgREST %s", (sourceCode, expectedCode) => {
    expect(translateChampionshipError({ code: sourceCode }).code).toBe(expectedCode);
  });

  it("preserva erros de domínio já traduzidos", () => {
    const original = new ChampionshipDomainError("INVALID_DATES");
    expect(translateChampionshipError(original)).toBe(original);
  });

  it("classifica falhas de fetch como erro de rede", () => {
    expect(translateChampionshipError(new TypeError("Failed to fetch")).code).toBe("NETWORK_ERROR");
  });
});
