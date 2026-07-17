import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Shield, Trophy, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { useChampionshipOverview } from "@/features/championships/hooks/useChampionship";
import {
  CHAMPIONSHIP_STATUS_LABELS,
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
      {/*
        Capa do campeonato. Antes vivia no layout do cockpit (repetida em
        toda tela); agora é conteúdo só da Visão geral, para o cabeçalho
        persistente do ChampionshipShell ficar enxuto (plano seção 3.3).
      */}
      <section className="card-arena overflow-hidden">
        <div className="relative min-h-32 bg-gradient-to-br from-neon/15 via-sky-400/5 to-violet-400/10">
          {activeChampionship.cover_url ? (
            <img
              src={activeChampionship.cover_url}
              alt={`Capa de ${activeChampionship.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Trophy className="absolute right-8 top-1/2 h-20 w-20 -translate-y-1/2 text-white/[0.06]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/35 to-transparent" />
          <div className="relative flex min-h-32 items-end gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {CHAMPIONSHIP_STATUS_LABELS[activeChampionship.status]}
                </Badge>
                <Badge variant="outline">
                  {activeChampionship.is_public ? "Público" : "Privado"}
                </Badge>
              </div>
              <h2 className="truncate font-display text-lg font-black sm:text-xl">
                {activeChampionship.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeChampionship.season || "Temporada não informada"}
              </p>
            </div>
          </div>
        </div>
      </section>

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
