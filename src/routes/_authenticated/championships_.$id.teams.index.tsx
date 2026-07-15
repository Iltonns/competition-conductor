import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamCard } from "@/features/teams/components/TeamCard";
import { useTeams } from "@/features/teams/hooks/useTeams";
import { getTeamErrorMessage } from "@/features/teams/utils/team-utils";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams/")({
  head: () => ({ meta: [{ title: "Equipes do campeonato · IS Arena" }] }),
  component: TeamsListPage,
});

function TeamsListPage() {
  const { id } = Route.useParams();
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

  if (query.isLoading)
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando equipes">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  if (query.error)
    return (
      <State
        title="Não foi possível carregar as equipes"
        description={getTeamErrorMessage(query.error)}
        action={
          <Button variant="outline" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        }
      />
    );

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-black">Equipes</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastro e participação neste campeonato.
          </p>
        </div>
        <Button asChild>
          <Link to="/championships/$id/teams/new" params={{ id }}>
            <Plus className="h-4 w-4" /> Nova equipe
          </Link>
        </Button>
      </header>
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
      {filtered.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, limit).map((item) => (
              <TeamCard key={item.registration.id} championshipId={id} item={item} />
            ))}
          </div>
          {limit < filtered.length && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setLimit((value) => value + 12)}>
                Carregar mais
              </Button>
            </div>
          )}
        </>
      ) : (
        <State
          title={query.data?.length ? "Nenhuma equipe encontrada" : "Nenhuma equipe cadastrada"}
          description={
            query.data?.length
              ? "Ajuste a busca ou os filtros."
              : "Cadastre a primeira equipe deste campeonato."
          }
          icon
          action={
            !query.data?.length ? (
              <Button asChild>
                <Link to="/championships/$id/teams/new" params={{ id }}>
                  Cadastrar equipe
                </Link>
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}

function State({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <section
      className="card-arena flex min-h-64 flex-col items-center justify-center p-6 text-center"
      role="status"
    >
      {icon && (
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon">
          <Shield className="h-6 w-6" />
        </span>
      )}
      <h2 className="mt-4 font-display text-sm font-bold">{title}</h2>
      <p className="mt-1 max-w-sm text-[10px] text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
