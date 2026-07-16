import { Skeleton } from "@/components/ui/skeleton";
import { useTeamAccessHistory } from "../hooks/useTeamAccess";

const EVENT_LABELS: Record<string, string> = {
  generated: "Link gerado",
  blocked: "Link bloqueado",
  unblocked: "Link desbloqueado",
  revoked: "Link revogado",
  replaced: "Link substituído",
  expiration_extended: "Validade alterada",
  permissions_updated: "Permissões alteradas",
  valid_access: "Acesso válido",
  expired_attempt: "Tentativa com link expirado",
  blocked_attempt: "Tentativa com link bloqueado",
  revoked_attempt: "Tentativa com link revogado",
  replaced_attempt: "Tentativa com link substituído",
  unavailable_attempt: "Tentativa com campeonato indisponível",
  access_limit_attempt: "Tentativa após limite de acessos",
};

export function TeamAccessHistory({
  championshipId,
  teamId,
  enabled,
}: {
  championshipId: string;
  teamId: string;
  enabled: boolean;
}) {
  const query = useTeamAccessHistory(championshipId, teamId, enabled);
  if (!enabled) return null;
  if (query.isLoading) return <Skeleton className="h-28 rounded-xl" />;
  if (query.error) {
    return <p className="text-xs text-red-200">Não foi possível carregar o histórico.</p>;
  }
  if (!query.data?.length) {
    return <p className="text-xs text-muted-foreground">Nenhuma ação registrada.</p>;
  }
  return (
    <ol className="space-y-2" aria-label="Histórico do acesso da equipe">
      {query.data.map((event) => (
        <li key={event.id} className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-xs">
              {EVENT_LABELS[event.event_type] ?? event.event_type}
            </strong>
            <time className="text-[10px] text-muted-foreground">
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(event.created_at))}
            </time>
          </div>
          {event.reason && <p className="mt-1 text-xs text-muted-foreground">{event.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
