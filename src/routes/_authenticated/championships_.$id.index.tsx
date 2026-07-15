import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Shield, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { useChampionshipOverview } from "@/features/championships/hooks/useChampionship";
import {
  formatChampionshipDate,
  formatChampionshipDateTime,
  getChampionshipErrorMessage,
} from "@/features/championships/utils/championship-display";

export const Route = createFileRoute("/_authenticated/championships_/$id/")({
  component: ChampionshipOverviewPage,
});

function ChampionshipOverviewPage() {
  const { activeChampionship } = useChampionshipContext();
  const overview = useChampionshipOverview(activeChampionship ?? undefined);

  if (!activeChampionship) return <Skeleton className="h-72 rounded-xl" />;

  return (
    <div className="space-y-4">
      {overview.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
      {overview.error && (
        <div className="card-arena p-5 text-center" role="alert">
          <p className="text-xs font-semibold">Não foi possível carregar o resumo.</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {getChampionshipErrorMessage(overview.error)}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => overview.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {overview.data && (
        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumo do campeonato"
        >
          {[
            { label: "Equipes", value: overview.data.teams, icon: Shield },
            { label: "Atletas", value: overview.data.athletes, icon: Users },
            { label: "Partidas", value: overview.data.matches, icon: CalendarDays },
            {
              label: "Fase atual",
              value: overview.data.currentStage ?? "Não definida",
              icon: UserRound,
            },
          ].map((item) => (
            <article key={item.label} className="card-arena flex min-h-24 items-center gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-black">{item.value}</p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="card-arena p-5">
        <h3 className="font-display text-sm font-bold">Sobre o campeonato</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {activeChampionship.description || "Nenhuma descrição informada."}
        </p>
        <dl className="mt-5 grid gap-3 border-t border-white/[0.06] pt-4 text-[10px] sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Data inicial</dt>
            <dd className="mt-1 font-semibold">
              {formatChampionshipDate(activeChampionship.starts_at)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data final</dt>
            <dd className="mt-1 font-semibold">
              {formatChampionshipDate(activeChampionship.ends_at)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Criado em</dt>
            <dd className="mt-1 font-semibold">
              {formatChampionshipDateTime(activeChampionship.created_at)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
