import { createFileRoute } from "@tanstack/react-router";
import {
  Trophy,
  Users,
  Shield,
  Calendar,
  Goal,
  TrendingUp,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · IS Arena" }] }),
  component: Dashboard,
});

const KPIS = [
  { label: "Campeonatos ativos", value: 8, delta: "+2", icon: Trophy, tone: "neon" as const },
  { label: "Equipes cadastradas", value: 32, delta: "+4", icon: Shield, tone: "info" as const },
  { label: "Atletas registrados", value: 432, delta: "+18", icon: Users, tone: "violet" as const },
  { label: "Partidas realizadas", value: 112, delta: "+9", icon: Calendar, tone: "warning" as const },
  { label: "Gols marcados", value: 312, delta: "+12%", icon: Goal, tone: "neon" as const },
];

const PERFORMANCE = [
  { m: "Jan", v: 12 },
  { m: "Fev", v: 22 },
  { m: "Mar", v: 34 },
  { m: "Abr", v: 28 },
  { m: "Mai", v: 44 },
  { m: "Jun", v: 52 },
  { m: "Jul", v: 61 },
  { m: "Ago", v: 48 },
  { m: "Set", v: 66 },
  { m: "Out", v: 74 },
  { m: "Nov", v: 82 },
  { m: "Dez", v: 78 },
];

const STANDINGS = [
  { p: 1, t: "Amazonas EC", pts: 12, j: 5, v: 4, e: 0, d: 1, sg: 8 },
  { p: 2, t: "Guarani FC", pts: 10, j: 5, v: 3, e: 1, d: 1, sg: 5 },
  { p: 3, t: "Real Unidos", pts: 8, j: 5, v: 2, e: 2, d: 1, sg: 3 },
  { p: 4, t: "Vila Nova FC", pts: 4, j: 5, v: 1, e: 1, d: 3, sg: -2 },
];

const SCORERS = [
  { n: "João Pedro", t: "Amazonas EC", g: 8 },
  { n: "Matheus Lima", t: "Guarani FC", g: 6 },
  { n: "Carlos Eduardo", t: "Real Unidos", g: 5 },
  { n: "Vinícius Rocha", t: "Guarani FC", g: 5 },
];

const RESULTS = [
  { home: "Real Unidos", away: "Vila Nova FC", hs: 2, as: 1, date: "03 JUL" },
  { home: "Amazonas EC", away: "Guarani FC", hs: 3, as: 1, date: "01 JUL" },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Temporada 2026
          </div>
          <h2 className="mt-1 font-display text-2xl font-black md:text-3xl">
            Bem-vindo de volta, <span className="text-neon">organizador</span>.
          </h2>
          <p className="text-sm text-muted-foreground">
            Aqui está o que está acontecendo na sua competição hoje.
          </p>
        </div>
        <Button className="bg-neon text-neon-foreground hover:bg-neon/90">
          + Novo Campeonato
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {KPIS.map((k) => (
          <div key={k.label} className="card-arena p-4">
            <div
              className={
                "grid h-9 w-9 place-items-center rounded-lg " +
                (k.tone === "neon"
                  ? "bg-neon/15 text-neon"
                  : k.tone === "info"
                    ? "bg-info/15 text-info"
                    : k.tone === "violet"
                      ? "bg-violet/15 text-violet"
                      : "bg-warning/15 text-warning")
              }
            >
              <k.icon className="h-4 w-4" />
            </div>
            <div className="mt-3 font-display text-3xl font-black">{k.value}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{k.label}</span>
              <span className="ml-auto shrink-0 text-neon">{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Next match + Scorers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-arena relative overflow-hidden lg:col-span-2">
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_100%_0%,var(--color-neon-soft),transparent_60%)]" />
          <div className="relative p-5 md:p-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>Semifinal · Jogo de Ida</span>
              <Badge className="bg-neon text-neon-foreground">Próximo jogo</Badge>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamBig name="Amazonas EC" abbr="AEC" tone="neon" />
              <div className="text-center">
                <div className="font-display text-5xl font-black md:text-6xl">VS</div>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> 05 JUL · 15:00
                </div>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Arena da Montanha
                </div>
              </div>
              <TeamBig name="Guarani FC" abbr="GFC" tone="info" />
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 border-t border-border pt-4 text-center">
              {[
                { l: "Dias", v: "03" },
                { l: "Horas", v: "14" },
                { l: "Min", v: "22" },
                { l: "Seg", v: "07" },
              ].map((c) => (
                <div key={c.l}>
                  <div className="font-display text-2xl font-black text-neon">{c.v}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {c.l}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Button variant="outline" size="sm" className="border-border bg-card/60">
                Ver partida <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="card-arena p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Artilharia
            </h3>
            <button className="text-xs text-muted-foreground hover:text-neon">
              Ver ranking
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {SCORERS.map((s, i) => (
              <li key={s.n} className="flex items-center gap-3">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-[11px] font-semibold">
                  {i + 1}
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-info/15 text-[10px] font-bold text-info">
                  {s.n
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.n}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{s.t}</div>
                </div>
                <div className="font-display text-lg font-black text-neon">{s.g}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Standings + performance */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-arena lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Desempenho geral
            </h3>
            <div className="text-right">
              <div className="font-display text-2xl font-black">312</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Total de gols · +12% vs 2025
              </div>
            </div>
          </div>
          <div className="h-56 px-3 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.9 0.24 128)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.9 0.24 128)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="m" stroke="oklch(0.72 0.02 258)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.02 258)" fontSize={11} width={28} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.025 260)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.9 0.24 128)"
                  strokeWidth={2.5}
                  fill="url(#perf)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-arena p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Classificação
            </h3>
            <button className="text-xs text-muted-foreground hover:text-neon">Ver tudo</button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-1.5 text-left font-medium">Pos</th>
                  <th className="py-1.5 text-left font-medium">Equipe</th>
                  <th className="py-1.5 text-right font-medium">P</th>
                  <th className="py-1.5 text-right font-medium">J</th>
                  <th className="py-1.5 text-right font-medium">SG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {STANDINGS.map((r) => (
                  <tr key={r.t} className={r.p === 1 ? "text-neon" : ""}>
                    <td className="py-2">
                      <span
                        className={
                          "grid h-6 w-6 place-items-center rounded text-[11px] font-bold " +
                          (r.p === 1 ? "bg-neon/15 text-neon" : "bg-secondary text-foreground")
                        }
                      >
                        {r.p}
                      </span>
                    </td>
                    <td className="py-2 font-semibold">{r.t}</td>
                    <td className="py-2 text-right font-display font-black">{r.pts}</td>
                    <td className="py-2 text-right text-muted-foreground">{r.j}</td>
                    <td className="py-2 text-right">{r.sg > 0 ? `+${r.sg}` : r.sg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latest results */}
      <div className="card-arena p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">
            Últimos resultados
          </h3>
          <button className="text-xs text-muted-foreground hover:text-neon">Ver todos</button>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {RESULTS.map((r, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 text-sm">
              <div className="text-right font-semibold">{r.home}</div>
              <div className="rounded-md border border-border bg-secondary px-3 py-1 text-center font-display font-black">
                {r.hs} - {r.as}
                <div className="text-[9px] font-normal uppercase tracking-widest text-muted-foreground">
                  {r.date}
                </div>
              </div>
              <div className="font-semibold">{r.away}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TeamBig({ name, abbr, tone }: { name: string; abbr: string; tone: "neon" | "info" }) {
  const c = tone === "neon" ? "bg-neon/15 text-neon" : "bg-info/15 text-info";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`grid h-20 w-20 place-items-center rounded-2xl border border-border ${c} font-display text-2xl font-black`}>
        {abbr}
      </div>
      <div className="text-center text-sm font-semibold">{name}</div>
    </div>
  );
}
