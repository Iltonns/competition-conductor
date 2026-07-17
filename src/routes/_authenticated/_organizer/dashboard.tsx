import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FilePlus2,
  Goal,
  Shield,
  ShieldPlus,
  Trophy,
  UserRoundPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  KpiCard,
  MatchRow,
  PlayerAvatar,
  SectionHeader,
  StandingsTable,
  TeamCrest,
} from "@/components/arena/arena-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { fetchDashboardData, type DashboardData } from "@/features/dashboard/dashboard.service";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/_organizer/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · IS Arena" }] }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  {
    label: "Nova Partida",
    to: "/matches",
    icon: CalendarDays,
    tone: "text-neon bg-neon/10",
  },
  {
    label: "Novo Atleta",
    to: "/athletes",
    icon: UserRoundPlus,
    tone: "text-emerald-300 bg-emerald-400/10",
  },
  {
    label: "Nova Equipe",
    to: "/teams",
    icon: ShieldPlus,
    tone: "text-sky-300 bg-sky-400/10",
  },
  {
    label: "Súmula",
    to: "/matches",
    icon: ClipboardList,
    tone: "text-orange-300 bg-orange-400/10",
  },
] as const;

function Dashboard() {
  const { activeChampionship } = useChampionshipContext();
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const dashboard = useQuery({
    queryKey: ["dashboard", activeChampionship?.id ?? "all", year],
    queryFn: () => fetchDashboardData(activeChampionship?.id, year),
  });

  if (dashboard.isLoading) {
    return (
      <div className="space-y-4" aria-label="Carregando dashboard">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="card-arena p-6">
        <h2 className="font-display text-lg font-bold">Não foi possível carregar o dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique sua conexão e tente novamente. Nenhum dado de demonstração foi exibido.
        </p>
        <Button className="mt-4" onClick={() => dashboard.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const displayName = user?.user_metadata?.display_name?.split(" ")[0] || "Organizador";
  return (
    <div className="space-y-4">
      <MobileDashboard data={dashboard.data} displayName={displayName} />
      <DesktopDashboard data={dashboard.data} year={year} onYearChange={setYear} />
    </div>
  );
}

function DesktopDashboard({
  data,
  year,
  onYearChange,
}: {
  data: DashboardData;
  year: number;
  onYearChange: (year: number) => void;
}) {
  return (
    <div className="hidden space-y-4 lg:block">
      <section className="grid grid-cols-4 gap-3" aria-label="Indicadores da competição">
        <KpiCard
          icon={Trophy}
          value={data.activeChampionships}
          label="Campeonatos ativos"
          tone="violet"
        />
        <KpiCard icon={Shield} value={data.teams} label="Equipes cadastradas" tone="emerald" />
        <KpiCard icon={Users} value={data.athletes} label="Atletas registrados" tone="amber" />
        <KpiCard
          icon={CalendarDays}
          value={data.finishedMatches}
          label="Partidas realizadas"
          tone="blue"
        />
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="card-arena col-span-8 p-4">
          <SectionHeader title="Próximas partidas" action="Ver todas" />
          <div className="mt-3 grid gap-2">
            {data.upcomingMatches.map((match) => (
              <MatchRow key={match.id} {...match} compact />
            ))}
            {data.upcomingMatches.length === 0 && <EmptyState text="Nenhuma partida agendada." />}
          </div>
        </div>

        <div className="card-arena col-span-4 p-4">
          <SectionHeader title="Artilharia" action="Ver ranking" />
          <ol className="mt-2 divide-y divide-white/[0.055]">
            {data.scorers.slice(0, 4).map((scorer) => (
              <li key={scorer.name} className="flex items-center gap-2.5 py-2">
                <span className="w-3 text-center font-display text-[9px] font-bold text-muted-foreground">
                  {scorer.position}
                </span>
                <PlayerAvatar initials={scorer.initials} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold">{scorer.name}</span>
                  <span className="block truncate text-[8px] text-muted-foreground">
                    {scorer.team.name}
                  </span>
                </span>
                <span className="text-right">
                  <strong className="block font-display text-sm font-extrabold">
                    {scorer.goals}
                  </strong>
                  <span className="block text-[7px] text-muted-foreground">gols</span>
                </span>
              </li>
            ))}
            {data.scorers.length === 0 && <EmptyState text="Nenhum gol registrado." />}
          </ol>
        </div>
      </section>

      <section className="card-arena overflow-hidden p-4">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Desempenho geral" />
          <label className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="sr-only">Temporada do gráfico</span>
            <select
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 text-[9px] text-foreground outline-none focus:border-neon/30"
            >
              {data.years.map((availableYear) => (
                <option key={availableYear} value={availableYear}>
                  {availableYear}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_150px] items-stretch gap-4">
          <div className="h-[150px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.performance}
                margin={{ top: 8, right: 6, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashboard-performance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.88 0.22 128)" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="oklch(0.88 0.22 128)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="oklch(1 0 0 / 0.045)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.68 0.012 252)", fontSize: 8 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.5 0.012 252)", fontSize: 8 }}
                />
                <Tooltip
                  cursor={{ stroke: "oklch(0.88 0.22 128 / 0.22)" }}
                  contentStyle={{
                    background: "oklch(0.13 0.018 255 / 0.96)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                    borderRadius: 10,
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="goals"
                  stroke="oklch(0.88 0.22 128)"
                  strokeWidth={1.8}
                  fill="url(#dashboard-performance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center border-l border-white/[0.06] pl-5">
            <span className="text-[9px] text-muted-foreground">Total de gols</span>
            <strong className="number-tabular mt-1 font-display text-4xl font-extrabold tracking-[-0.06em]">
              {data.performance.reduce((total, month) => total + month.goals, 0)}
            </strong>
            <span className="mt-2 text-[9px] text-muted-foreground">Temporada {year}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileDashboard({ data, displayName }: { data: DashboardData; displayName: string }) {
  return (
    <div className="space-y-4 lg:hidden">
      <section>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.04em]">
          Olá, {displayName} <span aria-hidden="true">👋</span>
        </h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Vamos fazer hoje um grande jogo.</p>
      </section>

      <section className="hero-media relative min-h-[150px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[url('/assets/championship-trophy.webp')] shadow-[0_24px_54px_-36px_rgba(0,0,0,.95)]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
        <div className="relative flex min-h-[150px] flex-col items-start justify-center p-4">
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neon">
            Campeonato em destaque
          </span>
          <h3 className="mt-2 max-w-[150px] font-display text-[1.35rem] font-extrabold uppercase leading-[0.98] tracking-[-0.045em]">
            {data.featuredChampionship?.name ?? "Nenhum campeonato"}
          </h3>
          <span className="mt-1 text-[11px] font-semibold">
            {data.featuredChampionship?.season ?? "Cadastre seu primeiro campeonato"}
          </span>
          {data.featuredChampionship && (
            <Button
              asChild
              className="mt-3 h-7 bg-white/10 px-3 text-[9px] text-white backdrop-blur hover:bg-white/15"
            >
              <Link to="/championships/$id" params={{ id: data.featuredChampionship.id }}>
                Ver campeonato
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Próximo jogo" action="Ver todos" />
        <div className="mt-2">
          {data.upcomingMatches[0] ? (
            <MatchRow {...data.upcomingMatches[0]} />
          ) : (
            <EmptyState text="Nenhuma partida agendada." />
          )}
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="Ações rápidas">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="card-arena flex min-h-[72px] flex-col items-center justify-center gap-2 px-1.5 py-2 text-center transition active:scale-[0.98]"
          >
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${action.tone}`}>
              <action.icon className="h-4 w-4" />
            </span>
            <span className="text-[7px] font-semibold leading-tight text-muted-foreground">
              {action.label}
            </span>
          </Link>
        ))}
      </section>

      <section className="card-arena p-3.5">
        <SectionHeader title="Últimos resultados" action="Ver todos" />
        <div className="mt-2 divide-y divide-white/[0.06]">
          {data.recentResults.map((result) => (
            <div
              key={result.id}
              className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <TeamCrest team={result.home} size="xs" />
                <span className="truncate text-[9px] font-semibold">{result.home.name}</span>
              </span>
              <strong className="font-display text-sm font-extrabold">{result.homeScore}</strong>
              <span className="flex min-w-0 items-center justify-end gap-2">
                <span className="truncate text-right text-[9px] font-semibold">
                  {result.away.name}
                </span>
                <TeamCrest team={result.away} size="xs" />
              </span>
              <strong className="font-display text-sm font-extrabold">{result.awayScore}</strong>
            </div>
          ))}
          {data.recentResults.length === 0 && <EmptyState text="Nenhum resultado finalizado." />}
        </div>
      </section>

      <section className="card-arena p-3.5">
        <SectionHeader title="Classificação" action="Tabela completa" />
        <div className="mt-2">
          {data.standings.length > 0 ? (
            <StandingsTable rows={data.standings} compact />
          ) : (
            <EmptyState text="A classificação aparecerá após os primeiros jogos." />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-arena p-3">
          <Goal className="h-4 w-4 text-neon" />
          <strong className="mt-3 block font-display text-2xl font-extrabold">
            {data.totalGoals}
          </strong>
          <span className="text-[8px] text-muted-foreground">Gols na temporada</span>
        </div>
        <div className="card-arena p-3">
          <FilePlus2 className="h-4 w-4 text-sky-300" />
          <strong className="mt-3 block font-display text-2xl font-extrabold">
            {data.finalizedReports}
          </strong>
          <span className="text-[8px] text-muted-foreground">Súmulas finalizadas</span>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-[10px] text-muted-foreground">
      {text}
    </p>
  );
}
