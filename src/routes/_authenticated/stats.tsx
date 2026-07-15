import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crosshair, Goal, Medal, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { PlayerAvatar, SectionHeader, TeamCrest } from "@/components/arena/arena-ui";
import { SCORERS, TEAMS } from "@/data/arena-demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "Estatísticas · IS Arena" }] }),
  component: StatisticsPage,
});

const FILTERS = ["Artilharia", "Assistências", "Cartões", "Goleiros"] as const;

function StatisticsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Artilharia");

  return (
    <div className="space-y-4">
      <div
        className="compact-scrollbar flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Tipo de estatística"
      >
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "h-8 shrink-0 rounded-lg border px-3 text-[9px] font-semibold transition",
              filter === item
                ? "border-neon/35 bg-neon text-neon-foreground"
                : "border-white/[0.07] bg-white/[0.025] text-muted-foreground hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[.82fr_1.18fr]">
        <div className="card-arena relative overflow-hidden p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(190,245,45,.12),transparent_45%)]" />
          <div className="relative text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neon">
              Líder da artilharia
            </p>
            <div className="relative mx-auto mt-8 w-fit">
              <div className="absolute -inset-4 rounded-full bg-[conic-gradient(#bdf22e_0_79%,#7654d6_79%_90%,rgba(255,255,255,.07)_90%)] shadow-[0_0_44px_-18px_var(--color-neon)]" />
              <div className="absolute -inset-[11px] rounded-full bg-card" />
              <PlayerAvatar
                initials={SCORERS[0].initials}
                size="lg"
                className="relative h-28 w-28 border-4 border-white/[0.06] text-2xl"
              />
              <span className="absolute -right-8 top-7 font-display text-4xl font-extrabold text-foreground">
                {SCORERS[0].goals}
              </span>
              <span className="absolute -right-8 top-[68px] text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
                gols
              </span>
            </div>
            <h2 className="mt-8 font-display text-xl font-extrabold tracking-[-0.04em]">
              {SCORERS[0].name}
            </h2>
            <p className="mt-1 text-[10px] text-muted-foreground">{SCORERS[0].team.name}</p>
            <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl border border-white/[0.06] bg-black/15 py-3">
              <Metric value="5" label="Jogos" />
              <Metric value="1,6" label="Média" />
              <Metric value="4" label="Vitórias" />
            </div>
          </div>
        </div>

        <div className="card-arena p-4">
          <SectionHeader title={`Ranking · ${filter}`} action="Exportar" />
          <ol className="mt-3 divide-y divide-white/[0.055]">
            {SCORERS.map((player) => (
              <li key={player.name} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-[10px] font-extrabold",
                    player.position === 1
                      ? "bg-neon text-neon-foreground"
                      : "bg-white/[0.045] text-muted-foreground",
                  )}
                >
                  {player.position}
                </span>
                <PlayerAvatar initials={player.initials} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold">{player.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[8px] text-muted-foreground">
                    <TeamCrest team={player.team} size="xs" /> {player.team.name}
                  </span>
                </span>
                <span className="text-right">
                  <strong className="block font-display text-xl font-extrabold">
                    {filter === "Artilharia" ? player.goals : Math.max(player.goals - 2, 1)}
                  </strong>
                  <span className="text-[8px] text-muted-foreground">
                    {filter === "Artilharia" ? "gols" : "eventos"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <SectionHeader title="Destaques por equipe" action="Visão completa" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TeamHighlight
            icon={Goal}
            label="Melhor ataque"
            value="14 gols"
            team={TEAMS.amazonas}
            tone="text-neon bg-neon/10"
          />
          <TeamHighlight
            icon={ShieldCheck}
            label="Melhor defesa"
            value="2 sofridos"
            team={TEAMS.unidosSul}
            tone="text-sky-300 bg-sky-400/10"
          />
          <TeamHighlight
            icon={TrendingUp}
            label="Maior aproveitamento"
            value="86%"
            team={TEAMS.guarani}
            tone="text-emerald-300 bg-emerald-400/10"
          />
          <TeamHighlight
            icon={Medal}
            label="Mais vitórias"
            value="4 vitórias"
            team={TEAMS.realUnidos}
            tone="text-amber-300 bg-amber-400/10"
          />
        </div>
      </section>

      <section className="card-arena flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-extrabold">Resumo inteligente da rodada</h2>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
            A rodada teve média de 3,4 gols por partida. O Amazonas EC liderou em finalizações e o
            Unidos do Sul terminou sem sofrer gols.
          </p>
        </div>
        <button className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[9px] font-semibold text-muted-foreground hover:text-foreground">
          <Crosshair className="h-3.5 w-3.5" /> Ver análise
        </button>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <span>
      <strong className="block font-display text-base font-extrabold">{value}</strong>
      <span className="text-[8px] text-muted-foreground">{label}</span>
    </span>
  );
}

function TeamHighlight({
  icon: Icon,
  label,
  value,
  team,
  tone,
}: {
  icon: typeof Goal;
  label: string;
  value: string;
  team: typeof TEAMS.amazonas;
  tone: string;
}) {
  return (
    <article className="card-arena card-interactive p-4">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tone)}>
          <Icon className="h-4 w-4" />
        </span>
        <TeamCrest team={team} size="sm" />
      </div>
      <p className="mt-4 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <strong className="mt-1 block font-display text-lg font-extrabold">{value}</strong>
      <span className="mt-1 block text-[9px] text-muted-foreground">{team.name}</span>
    </article>
  );
}
