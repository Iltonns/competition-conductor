import { translateChampionshipError } from "../errors/championship-errors";
import type { ChampionshipStatus } from "../types/championship.types";

export const CHAMPIONSHIP_STATUS_LABELS: Record<ChampionshipStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  registration_open: "Inscrições abertas",
  preparing: "Em preparação",
  active: "Ativo",
  suspended: "Suspenso",
  finished: "Finalizado",
  archived: "Arquivado",
};

export function formatChampionshipDate(date: string | null): string {
  if (!date) return "Não definida";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T00:00:00`));
}

export function formatChampionshipDateTime(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function getChampionshipErrorMessage(error: unknown): string {
  return translateChampionshipError(error).message;
}
