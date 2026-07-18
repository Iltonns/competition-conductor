import { describe, expect, it } from "vitest";
import { getTeamErrorMessage, slugifyTeamName } from "@/features/teams/utils/team-utils";

describe("slugifyTeamName", () => {
  it("normaliza acentos, espaços e símbolos", () => {
    expect(slugifyTeamName("  Associação Atlética São João!  ")).toBe(
      "associacao-atletica-sao-joao",
    );
  });

  it("remove separadores das extremidades", () => {
    expect(slugifyTeamName("---Equipe Azul---")).toBe("equipe-azul");
  });
});

describe("getTeamErrorMessage", () => {
  it.each([
    ["team:duplicate", "Já existe uma equipe"],
    ["42501", "não possui permissão"],
    ["team:has_history", "histórico esportivo"],
    ["P0002", "não encontrada"],
    ["team:invalid_payload", "Revise os dados"],
  ])("traduz %s", (source, expectedText) => {
    expect(getTeamErrorMessage(new Error(source))).toContain(expectedText);
  });

  it("não expõe uma mensagem interna desconhecida", () => {
    expect(getTeamErrorMessage(new Error("internal database detail"))).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    );
  });
});
