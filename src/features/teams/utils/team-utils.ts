export function slugifyTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTeamErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("team:duplicate") || message.includes("23505"))
    return "Já existe uma equipe com este slug ou vínculo neste campeonato.";
  if (message.includes("team:forbidden") || message.includes("42501"))
    return "Você não possui permissão para administrar equipes deste campeonato.";
  if (message.includes("team:has_history"))
    return "A equipe possui histórico esportivo e deve ser arquivada.";
  if (message.includes("team:not_found") || message.includes("P0002"))
    return "Equipe não encontrada neste campeonato.";
  if (message.includes("team:invalid_payload") || message.includes("22023"))
    return "Revise os dados informados.";
  return "Não foi possível concluir a operação. Tente novamente.";
}
