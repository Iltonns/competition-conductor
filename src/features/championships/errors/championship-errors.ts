export type ChampionshipErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "INVALID_ORGANIZATION"
  | "ORGANIZATION_SELECTION_REQUIRED"
  | "DUPLICATE_SLUG"
  | "HAS_DEPENDENCIES"
  | "INVALID_DATES"
  | "INVALID_PAYLOAD"
  | "NETWORK_ERROR"
  | "TRANSACTION_FAILED"
  | "NOT_FOUND"
  | "UNKNOWN";

const ERROR_MESSAGES: Record<ChampionshipErrorCode, string> = {
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente.",
  FORBIDDEN: "Você não tem permissão para realizar esta operação.",
  INVALID_ORGANIZATION: "A organização informada não está disponível para sua conta.",
  ORGANIZATION_SELECTION_REQUIRED:
    "Sua conta gerencia mais de uma organização. Selecione uma organização antes de criar.",
  DUPLICATE_SLUG: "Já existe um campeonato com este endereço.",
  HAS_DEPENDENCIES:
    "Este campeonato possui equipes ou partidas vinculadas. Arquive-o para preservar o histórico.",
  INVALID_DATES: "A data final não pode ser anterior à data inicial.",
  INVALID_PAYLOAD: "Revise os dados informados e tente novamente.",
  NETWORK_ERROR: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
  TRANSACTION_FAILED: "A operação não foi concluída e nenhuma alteração foi mantida.",
  NOT_FOUND: "Campeonato não encontrado.",
  UNKNOWN: "Não foi possível concluir a operação.",
};

export class ChampionshipDomainError extends Error {
  constructor(
    public readonly code: ChampionshipErrorCode,
    options?: ErrorOptions,
  ) {
    super(ERROR_MESSAGES[code], options);
    this.name = "ChampionshipDomainError";
  }
}

function readError(error: unknown): { code?: string; message?: string } {
  if (typeof error !== "object" || error === null) return {};
  return {
    code: "code" in error && typeof error.code === "string" ? error.code : undefined,
    message: "message" in error && typeof error.message === "string" ? error.message : undefined,
  };
}

export function translateChampionshipError(error: unknown): ChampionshipDomainError {
  if (error instanceof ChampionshipDomainError) return error;

  const { code, message = "" } = readError(error);
  const domainKey = message.match(/championship:([a-z_]+)/)?.[1];
  const domainCodes: Record<string, ChampionshipErrorCode> = {
    authentication_required: "AUTHENTICATION_REQUIRED",
    forbidden: "FORBIDDEN",
    invalid_organization: "INVALID_ORGANIZATION",
    duplicate_slug: "DUPLICATE_SLUG",
    has_dependencies: "HAS_DEPENDENCIES",
    invalid_dates: "INVALID_DATES",
    invalid_payload: "INVALID_PAYLOAD",
    invalid_slug: "INVALID_PAYLOAD",
    transaction_failed: "TRANSACTION_FAILED",
    not_found: "NOT_FOUND",
  };

  if (domainKey && domainCodes[domainKey]) {
    return new ChampionshipDomainError(domainCodes[domainKey], { cause: error });
  }
  if (code === "23505") return new ChampionshipDomainError("DUPLICATE_SLUG", { cause: error });
  if (code === "22007") return new ChampionshipDomainError("INVALID_DATES", { cause: error });
  if (code === "P0002" || code === "PGRST116")
    return new ChampionshipDomainError("NOT_FOUND", { cause: error });
  if (code === "42501") return new ChampionshipDomainError("FORBIDDEN", { cause: error });
  if (
    error instanceof TypeError ||
    /failed to fetch|network|load failed|connection/i.test(message)
  ) {
    return new ChampionshipDomainError("NETWORK_ERROR", { cause: error });
  }
  return new ChampionshipDomainError("UNKNOWN", { cause: error });
}

export async function withChampionshipErrorTranslation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw translateChampionshipError(error);
  }
}
