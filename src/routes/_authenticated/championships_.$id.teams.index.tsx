import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { TeamCard } from "@/features/teams/components/TeamCard";
import { useTeams } from "@/features/teams/hooks/useTeams";
import { getTeamErrorMessage } from "@/features/teams/utils/team-utils";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import {
  ORGANIZATION_ROLE_LABEL,
  canManageRoster,
  useCurrentPlan,
} from "@/features/subscription/hooks/useCurrentPlan";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams/")({
  head: () => ({ meta: [{ title: "Equipes do campeonato · IS Arena" }] }),
  component: TeamsListPage,
});

function TeamsListPage() {
  const { id } = Route.useParams();
  const { organizationId } = useChampionshipContext();
  const { role } = useCurrentPlan(organizationId);
  const canManage = canManageRoster(role);
  const query = useTeams(id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(12);

  const filtered = useMemo(
    () =>
      (query.data ?? [])
        .filter(({ team, registration }) => {
          const matchesText = `${team.name} ${team.short_name ?? ""} ${team.city ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase());
          return matchesText && (status === "all" || registration.status === status);
        })
        .sort((a, b) => a.team.name.localeCompare(b.team.name)),
    [query.data, search, status],
  );

  return (
    <div className="space-y-4">
      {/* Header com título e tabs */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold tracking-[-0.03em]">
          {query.data ? `${query.data.length} equipes` : "Equipes"}
        </h1>

        {/* Tabs: Times | Atletas */}
        <div className="flex gap-1 rounded-xl bg-secondary/60 p-1">
          <span className="rounded-lg bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm">
            Times
          </span>
          <Link
            to="/championships/$id/athletes"
            params={{ id }}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Atletas
          </Link>
        </div>
      </div>

      {/* Banner informativo — só faz sentido para quem pode de fato gerenciar. */}
      {canManage && (
        <div className="rounded-xl border border-[oklch(85%_0.09_85)] bg-[oklch(97%_0.03_85)] px-4 py-3">
          <p className="text-sm font-semibold text-[oklch(38%_0.09_70)]">
            Abra uma equipe para gerar acessos e definir o que os técnicos podem inscrever.
          </p>
        </div>
      )}

      {/* Ações — habilitadas pelo papel real do usuário na organização */}
      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" asChild>
            <Link to="/championships/$id/teams/new" params={{ id }}>
              <Plus className="h-3.5 w-3.5" /> Nova equipe
            </Link>
          </Button>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            {role
              ? `Seu papel (${ORGANIZATION_ROLE_LABEL[role]}) permite apenas visualizar as equipes.`
              : "Você tem acesso somente de leitura a estas equipes."}
          </p>
        )}
      </div>

      {/* Search + filter */}
      <div className="card-arena flex flex-col gap-3 p-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar equipes</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou cidade"
          />
        </label>
        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Todos os status</option>
          <option value="approved">Ativas</option>
          <option value="archived">Arquivadas</option>
        </select>
      </div>

      {/* Content */}
      {query.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando equipes">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {query.error && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar as equipes"
          description={getTeamErrorMessage(query.error)}
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {!query.isLoading && !query.error && (
        <>
          {filtered.length ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, limit).map((item) => (
                  <TeamCard key={item.registration.id} championshipId={id} item={item} />
                ))}
              </div>
              {limit < filtered.length && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setLimit((v) => v + 12)}>
                    Carregar mais
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Shield}
              title={query.data?.length ? "Nenhuma equipe encontrada" : "Nenhuma equipe cadastrada"}
              description={
                query.data?.length
                  ? "Ajuste a busca ou os filtros."
                  : "Cadastre a primeira equipe deste campeonato."
              }
              action={
                !query.data?.length && canManage ? (
                  <Button asChild>
                    <Link to="/championships/$id/teams/new" params={{ id }}>
                      Cadastrar equipe
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}
    </div>
  );
}
