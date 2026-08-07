import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { useGlobalAthletes } from "@/features/global-directory/hooks/useGlobalDirectory";
import type { CompetitiveParticipation } from "@/features/global-directory/types/global-directory.types";

export const Route = createFileRoute("/_authenticated/championships_/$id/athletes")({
  head: () => ({ meta: [{ title: "Atletas do campeonato · IS Arena" }] }),
  component: ChampionshipAthletesPage,
});

const PAGE_SIZE = 25;

/** Rótulos de `championship_team_athletes.registration_status`. */
const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  approved: "Regular",
  pending: "Pendente",
  rejected: "Recusada",
  archived: "Arquivada",
};

function ChampionshipAthletesPage() {
  const { id } = Route.useParams();
  const { organizationId } = useChampionshipContext();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, status: "all", championshipId: id, page, pageSize: PAGE_SIZE }),
    [search, id, page],
  );
  const query = useGlobalAthletes(organizationId, filters);

  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* Header com título e tabs — espelha a página de Equipes */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold tracking-[-0.03em]">
          {query.data ? `${total} atletas` : "Atletas"}
        </h1>

        <div className="flex gap-1 rounded-xl bg-secondary/60 p-1">
          <Link
            to="/championships/$id/teams"
            params={{ id }}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Times
          </Link>
          <span className="rounded-lg bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm">
            Atletas
          </span>
        </div>
      </div>

      {/* Busca */}
      <div className="card-arena p-3">
        <label className="relative block">
          <span className="sr-only">Buscar atletas</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou nome esportivo"
          />
        </label>
      </div>

      {query.isLoading && (
        <div className="space-y-2" aria-label="Carregando atletas">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      )}

      {query.error && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os atletas"
          description={
            query.error instanceof Error ? query.error.message : "Tente novamente em instantes."
          }
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {!query.isLoading && !query.error && query.data && (
        <>
          {query.data.items.length ? (
            <>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Cabeçalho da tabela — some no mobile, onde cada linha vira card */}
                <div className="hidden grid-cols-[2fr_1.4fr_1.2fr_1fr] gap-3 bg-secondary/50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.03em] text-muted-foreground sm:grid">
                  <span>Atleta</span>
                  <span>Equipe</span>
                  <span>Posição</span>
                  <span>Status</span>
                </div>
                {query.data.items.map((athlete) => {
                  const participation = athlete.participations.find(
                    (item) => item.championship_id === id,
                  );
                  return (
                    <AthleteRow
                      key={athlete.id}
                      name={athlete.full_name}
                      sportName={athlete.sport_name}
                      participation={participation}
                    />
                  );
                })}
              </div>

              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {page} de {lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Users}
              title={search ? "Nenhum atleta encontrado" : "Nenhum atleta inscrito"}
              description={
                search
                  ? "Ajuste a busca para encontrar outros atletas."
                  : "Os atletas aparecem aqui conforme as equipes fazem as inscrições."
              }
            />
          )}
        </>
      )}
    </div>
  );
}

function AthleteRow({
  name,
  sportName,
  participation,
}: {
  name: string;
  sportName: string | null;
  participation: CompetitiveParticipation | undefined;
}) {
  const status = participation?.status;
  const isRegular = status === "approved";

  return (
    <div className="grid grid-cols-1 gap-1 border-t border-border px-5 py-3 sm:grid-cols-[2fr_1.4fr_1.2fr_1fr] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {sportName && sportName !== name && (
          <p className="truncate text-xs text-muted-foreground">{sportName}</p>
        )}
      </div>
      <span className="truncate text-[13px] text-muted-foreground">
        {participation?.team_name ?? "Sem equipe"}
      </span>
      <span className="truncate text-[13px] text-muted-foreground">
        {participation?.position ?? "—"}
      </span>
      <Badge variant={isRegular ? "secondary" : "outline"} className="w-fit text-[10px]">
        {status ? (REGISTRATION_STATUS_LABELS[status] ?? status) : "Sem inscrição"}
      </Badge>
    </div>
  );
}
