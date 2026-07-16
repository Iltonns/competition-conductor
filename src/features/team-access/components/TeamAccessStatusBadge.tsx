import { Badge } from "@/components/ui/badge";
import type { TeamAccessState } from "../types/team-access.types";

const LABELS: Record<TeamAccessState, string> = {
  not_generated: "Não gerado",
  valid: "Ativo",
  active: "Ativo",
  blocked: "Bloqueado",
  revoked: "Revogado",
  replaced: "Substituído",
  expired: "Expirado",
  invalid: "Inválido",
  unavailable: "Indisponível",
  access_limit: "Limite atingido",
  rate_limited: "Muitas tentativas",
};

export function TeamAccessStatusBadge({ state }: { state: TeamAccessState }) {
  const className =
    state === "active" || state === "valid"
      ? "border-neon/30 bg-neon/10 text-neon"
      : state === "blocked" || state === "expired" || state === "access_limit"
        ? "border-amber-300/30 bg-amber-400/10 text-amber-200"
        : state === "not_generated"
          ? "border-white/10 bg-white/[0.04] text-muted-foreground"
          : "border-red-300/30 bg-red-400/10 text-red-200";
  return (
    <Badge variant="outline" className={className}>
      {LABELS[state]}
    </Badge>
  );
}
