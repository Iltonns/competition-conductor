import { createFileRoute, Link } from "@tanstack/react-router";
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
import {
  RECENT_RESULTS,
  SCORERS,
  STANDINGS,
  TEAMS,
  UPCOMING_MATCHES,
} from "@/data/arena-demo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · IS Arena" }] }),
  component: Dashboard,
});

const PERFORMANCE = [
  { month: "Jan", goals: 10 },
  { month: "Fev", goals: 25 },
  { month: "Mar", goals: 18 },
  { month: "Abr", goals: 31 },
  { month: "Mai", goals: 28 },
  { month: "Jun", goals: 49 },
  { month: "Jul", goals: 34 },
  { month: "Ago", goals: 44 },
  { month: "Set", goals: 31 },
  { month: "Out", goals: 50 },
  { month: "Nov", goals: 42 },
  { month: "Dez", goals: 62 },
];

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
  return (
    <div className="space-y-4">
      <MobileDashboard />
      <DesktopDashboard />
    </div>
  );
}

function DesktopDashboard() {
  return (
    <div className="hidden space-y-4 lg:block">
      <section
        className="grid grid-cols-4 gap-3"
        aria-label="Indicadores da competição"
      >
        <KpiCard
          icon={Trophy}
          value={8}
          label="Campeonatos ativos"
          tone="violet"
          delta="+2"
        />
        <KpiCard
          icon={Shield}
          value={32}
          label="Equipes cadastradas"
          tone="emerald"
          delta="+4"
        />
        <KpiCard
          icon={Users}
          value={432}
          label="Atletas registrados"
          tone="amber"
          delta="+18"
        />
        <KpiCard
          icon={CalendarDays}
          value={112}
          label="Partidas realizadas"
          tone="blue"
          delta="+9"
        />
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="card-arena col-span-8 p-4">
          <SectionHeader title="Próximas partidas" action="Ver todas" />
          <div className="mt-3 grid gap-2">
            {UPCOMING_MATCHES.map((match) => (
              <MatchRow key={match.id} {...match} compact />
            ))}
          </div>
        </div>

        <div className="card-arena col-span-4 p-4">
          <SectionHeader title="Artilharia" action="Ver ranking" />
          <ol className="mt-2 divide-y divide-white/[0.055]">
            {SCORERS.slice(0, 4).map((scorer) => (
              <li key={scorer.name} className="flex items-center gap-2.5 py-2">
                <span className="w-3 text-center font-display text-[9px] font-bold text-muted-foreground">
                  {scorer.position}
                </span>
                <PlayerAvatar initials={scorer.initials} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-semibold">
                    {scorer.name}
                  </span>
                  <span className="block truncate text-[8px] text-muted-foreground">
                    {scorer.team.name}
                  </span>
                </span>
                <span className="text-right">
                  <strong className="block font-display text-sm font-extrabold">
                    {scorer.goals}
                  </strong>
                  <span className="block text-[7px] text-muted-foreground">
                    gols
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card-arena overflow-hidden p-4">
        <div className="flex items-start justify-between gap-4">
          <SectionHeader title="Desempenho geral" />
          <label className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="sr-only">Temporada do gráfico</span>
            <select className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 text-[9px] text-foreground outline-none focus:border-neon/30">
              <option>2026</option>
              <option>2025</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_150px] items-stretch gap-4">
          <div className="h-[150px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PERFORMANCE}
                margin={{ top: 8, right: 6, left: -28, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="dashboard-performance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="oklch(0.88 0.22 128)"
                      stopOpacity={0.34}
                    />
                    <stop
                      offset="100%"
                      stopColor="oklch(0.88 0.22 128)"
                      stopOpacity={0}
                    />
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
            <span className="text-[9px] text-muted-foreground">
              Total de gols
            </span>
            <strong className="number-tabular mt-1 font-display text-4xl font-extrabold tracking-[-0.06em]">
              312
            </strong>
            <span className="mt-2 text-[9px] font-semibold text-neon">
              +12% vs 2025
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileDashboard() {
  return (
    <div className="space-y-4 lg:hidden">
      <section>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.04em]">
          Olá, Lucas <span aria-hidden="true">👋</span>
        </h2>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Vamos fazer hoje um grande jogo.
        </p>
      </section>

      <section className="hero-media relative min-h-[150px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[url('/assets/championship-trophy.webp')] shadow-[0_24px_54px_-36px_rgba(0,0,0,.95)]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent" />
        <div className="relative flex min-h-[150px] flex-col items-start justify-center p-4">
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-neon">
            Campeonato em destaque
          </span>
          <h3 className="mt-2 max-w-[150px] font-display text-[1.35rem] font-extrabold uppercase leading-[0.98] tracking-[-0.045em]">
            Copa da Baixada
          </h3>
          <span className="mt-1 text-[11px] font-semibold">2026</span>
          <Button className="mt-3 h-7 bg-white/10 px-3 text-[9px] text-white backdrop-blur hover:bg-white/15">
            Ver campeonato
          </Button>
        </div>
      </section>

      <section>
        <SectionHeader title="Próximo jogo" action="Ver todos" />
        <div className="mt-2">
          <MatchRow {...UPCOMING_MATCHES[0]} />
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="Ações rápidas">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="card-arena flex min-h-[72px] flex-col items-center justify-center gap-2 px-1.5 py-2 text-center transition active:scale-[0.98]"
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${action.tone}`}
            >
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
          {RECENT_RESULTS.map((result) => (
            <div
              key={result.id}
              className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <TeamCrest team={result.home} size="xs" />
                <span className="truncate text-[9px] font-semibold">
                  {result.home.name}
                </span>
              </span>
              <strong className="font-display text-sm font-extrabold">
                {result.homeScore}
              </strong>
              <span className="flex min-w-0 items-center justify-end gap-2">
                <span className="truncate text-right text-[9px] font-semibold">
                  {result.away.name}
                </span>
                <TeamCrest team={result.away} size="xs" />
              </span>
              <strong className="font-display text-sm font-extrabold">
                {result.awayScore}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card-arena p-3.5">
        <SectionHeader title="Classificação" action="Tabela completa" />
        <div className="mt-2">
          <StandingsTable rows={STANDINGS} compact />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card-arena p-3">
          <Goal className="h-4 w-4 text-neon" />
          <strong className="mt-3 block font-display text-2xl font-extrabold">
            312
          </strong>
          <span className="text-[8px] text-muted-foreground">
            Gols na temporada
          </span>
        </div>
        <div className="card-arena p-3">
          <FilePlus2 className="h-4 w-4 text-sky-300" />
          <strong className="mt-3 block font-display text-2xl font-extrabold">
            24
          </strong>
          <span className="text-[8px] text-muted-foreground">
            Súmulas finalizadas
          </span>
        </div>
      </section>

      <div className="sr-only">Equipe em destaque: {TEAMS.amazonas.name}</div>
    </div>
  );
}
