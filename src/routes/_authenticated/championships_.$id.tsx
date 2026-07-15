import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Layers3, Shield, Trophy, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import {
  useChampionship,
  useChampionshipOverview,
} from "@/features/championships/hooks/useChampionship";
import {
  CHAMPIONSHIP_STATUS_LABELS,
  formatChampionshipDate,
  formatChampionshipDateTime,
  getChampionshipErrorMessage,
} from "@/features/championships/utils/championship-display";

export const Route = createFileRoute("/_authenticated/championships_/$id")({
  head: () => ({ meta: [{ title: "Detalhes do campeonato · IS Arena" }] }),
  component: ChampionshipDetailsPage,
});

const CHAMPIONSHIP_TABS = [
  { value: "overview", label: "Visão Geral" },
  { value: "teams", label: "Equipes" },
  { value: "athletes", label: "Atletas" },
  { value: "matches", label: "Jogos" },
  { value: "standings", label: "Classificação" },
  { value: "stats", label: "Estatísticas" },
  { value: "finance", label: "Financeiro" },
  { value: "settings", label: "Configurações" },
] as const;

function ChampionshipDetailsPage() {
  const { id } = Route.useParams();
  const championship = useChampionship(id);
  const overview = useChampionshipOverview(id);
  const { setActiveChampionship } = useChampionshipContext();

  useEffect(() => {
    setActiveChampionship(championship.data ?? null);
    return () => setActiveChampionship(null);
  }, [championship.data, setActiveChampionship]);

  if (championship.isLoading) return <ChampionshipDetailsSkeleton />;

  if (championship.error || !championship.data) {
    return (
      <div className="card-arena p-8 text-center" role="alert">
        <h2 className="font-display text-lg font-bold">Não foi possível abrir o campeonato</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          {getChampionshipErrorMessage(championship.error)}
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/championships">Voltar para campeonatos</Link>
        </Button>
      </div>
    );
  }

  const data = championship.data;
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/championships">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para campeonatos
        </Link>
      </Button>

      <section className="card-arena overflow-hidden">
        <div className="relative min-h-44 bg-gradient-to-br from-neon/15 via-sky-400/5 to-violet-400/10">
          {data.cover_url ? (
            <img
              src={data.cover_url}
              alt={`Capa de ${data.name}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <Trophy className="absolute right-8 top-1/2 h-28 w-28 -translate-y-1/2 text-white/[0.06]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/35 to-transparent" />
          <div className="relative flex min-h-44 items-end gap-4 p-5">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-neon backdrop-blur">
              <Trophy className="h-7 w-7" />
            </div>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start bg-white/[0.035] p-1">
            {CHAMPIONSHIP_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-[10px]">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <OverviewSummary
            loading={overview.isLoading}
            error={overview.error}
            data={overview.data}
            onRetry={() => overview.refetch()}
          />

          <section className="card-arena p-5">
            <h3 className="font-display text-sm font-bold">Sobre o campeonato</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {data.description || "Nenhuma descrição informada."}
            </p>
            <dl className="mt-5 grid gap-3 border-t border-white/[0.06] pt-4 text-[10px] sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Data inicial</dt>
                <dd className="mt-1 font-semibold">{formatChampionshipDate(data.starts_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Data final</dt>
                <dd className="mt-1 font-semibold">{formatChampionshipDate(data.ends_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Criado em</dt>
                <dd className="mt-1 font-semibold">
                  {formatChampionshipDateTime(data.created_at)}
                </dd>
              </div>
            </dl>
          </section>
        </TabsContent>

        {CHAMPIONSHIP_TABS.slice(1).map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <div className="card-arena flex min-h-48 flex-col items-center justify-center p-6 text-center">
              <Layers3 className="h-6 w-6 text-neon" />
              <h3 className="mt-3 font-display text-sm font-bold">{tab.label}</h3>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Estrutura preparada para a próxima etapa do módulo.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OverviewSummary({
  loading,
  error,
  data,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  data?: { teams: number; athletes: number; matches: number; currentStage: string | null };
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-arena p-5 text-center" role="alert">
        <p className="text-xs font-semibold">Não foi possível carregar o resumo.</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {getChampionshipErrorMessage(error)}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const items = [
    { label: "Equipes", value: data.teams, icon: Shield },
    { label: "Atletas", value: data.athletes, icon: Users },
    { label: "Partidas", value: data.matches, icon: CalendarDays },
    { label: "Fase atual", value: data.currentStage ?? "Não definida", icon: UserRound },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do campeonato">
      {items.map((item) => (
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
  );
}

function ChampionshipDetailsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Carregando detalhes do campeonato">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-44 rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
