import { describe, expect, it } from "vitest";
import {
  CHAMPIONSHIP_STATUS_LABELS,
  formatChampionshipDate,
  formatChampionshipDateTime,
  getChampionshipErrorMessage,
} from "@/features/championships/utils/championship-display";
import { withChampionshipErrorTranslation } from "@/features/championships/errors/championship-errors";

describe("championship display", () => {
  it("expõe rótulos para todos os estados conhecidos", () => {
    expect(CHAMPIONSHIP_STATUS_LABELS.draft).toBe("Rascunho");
    expect(CHAMPIONSHIP_STATUS_LABELS.active).toBe("Ativo");
    expect(CHAMPIONSHIP_STATUS_LABELS.archived).toBe("Arquivado");
  });

  it("trata uma data ainda não definida", () => {
    expect(formatChampionshipDate(null)).toBe("Não definida");
  });

  it("formata datas para o padrão brasileiro", () => {
    expect(formatChampionshipDate("2026-07-18")).toBe("18/07/2026");
    expect(formatChampionshipDateTime("2026-07-18T15:30:00Z")).toMatch(/18\/07\/2026/);
  });

  it("traduz erros antes de apresentá-los na interface", () => {
    expect(getChampionshipErrorMessage(new Error("championship:forbidden"))).toContain("permissão");
  });
});

describe("withChampionshipErrorTranslation", () => {
  it("preserva o resultado de uma operação bem-sucedida", async () => {
    await expect(withChampionshipErrorTranslation(async () => "ok")).resolves.toBe("ok");
  });

  it("converte falhas internas em erro de domínio", async () => {
    await expect(
      withChampionshipErrorTranslation(async () => {
        throw new Error("championship:invalid_dates");
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATES" });
  });
});
