import { useEffect } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionshipSidebar } from "@/features/championships/components/ChampionshipSidebar";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { ChampionshipDomainError } from "@/features/championships/errors/championship-errors";
import { useChampionship } from "@/features/championships/hooks/useChampionship";
import {
  CHAMPIONSHIP_STATUS_LABELS,
  getChampionshipErrorMessage,
} from "@/features/championships/utils/championship-display";

export const Route = createFileRoute("/_authenticated/championships_/$id")({
  head: () => ({ meta: [{ title: "Campeonato · IS Arena" }] }),
  component: ChampionshipLayout,
});

function ChampionshipLayout() {
  const { id } = Route.useParams();
  const championship = useChampionship(id);
  const { setActiveChampionship } = useChampionshipContext();

  useEffect(() => {
    setActiveChampionship(championship.data ?? null);
    return () => setActiveChampionship(null);
  }, [championship.data, setActiveChampionship]);

  if (championship.isLoading) return <ChampionshipLayoutSkeleton />;

  if (championship.error || !championship.data) {
    const forbidden =
      championship.error instanceof ChampionshipDomainError &&
      championship.error.code === "FORBIDDEN";
    return (
      <div className="card-arena p-8 text-center" role="alert">
        <h2 className="font-display text-lg font-bold">
          {forbidden ? "Acesso negado" : "Campeonato não encontrado"}
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          {getChampionshipErrorMessage(championship.error)}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => championship.refetch()}>
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link to="/championships">Voltar</Link>
          </Button>
        </div>
      </div>
    );
  }

  const data = championship.data;
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/championships">
          <ArrowLeft className="h-3.5 w-3.5" /> Campeonatos
        </Link>
      </Button>

      <section className="card-arena overflow-hidden">
        <div className="relative min-h-40 bg-gradient-to-br from-neon/15 via-sky-400/5 to-violet-400/10">
          {data.cover_url ? (
            <img
              src={data.cover_url}
              alt={`Capa de ${data.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Trophy className="absolute right-8 top-1/2 h-24 w-24 -translate-y-1/2 text-white/[0.06]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/35 to-transparent" />
          <div className="relative flex min-h-40 items-end gap-4 p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25 text-neon backdrop-blur">
              <Trophy className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{CHAMPIONSHIP_STATUS_LABELS[data.status]}</Badge>
                <Badge variant="outline">{data.is_public ? "Público" : "Privado"}</Badge>
              </div>
              <h2 className="truncate font-display text-xl font-black sm:text-2xl">{data.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.season || "Temporada não informada"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="lg:flex lg:items-start lg:gap-4">
        <ChampionshipSidebar championshipId={data.id} />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function ChampionshipLayoutSkeleton() {
  return (
    <div className="space-y-4" aria-label="Carregando campeonato">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-40 rounded-xl" />
      <div className="flex gap-4">
        <Skeleton className="hidden h-96 w-52 lg:block" />
        <Skeleton className="h-72 flex-1" />
      </div>
    </div>
  );
}
