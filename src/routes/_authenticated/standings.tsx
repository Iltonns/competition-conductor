import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Goal, ShieldCheck, Trophy } from "lucide-react";
import { StandingsTable, TeamCrest } from "@/components/arena/arena-ui";
import { GROUP_B_STANDINGS, STANDINGS, TEAMS } from "@/data/arena-demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/standings")({
  head: () => ({ meta: [{ title: "Classificação · IS Arena" }] }),
  component: StandingsPage,
});

function StandingsPage() {
  const [group, setGroup] = useState<"A" | "B">("A");
  const rows = group === "A" ? STANDINGS : GROUP_B_STANDINGS;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <InsightCard
          icon={Trophy}
          value={rows[0].team.name}
          label={`Líder do Grupo ${group}`}
          tone="neon"
        />
        <InsightCard
          icon={Goal}
          value={`${rows.reduce((sum, row) => sum + row.goalsFor, 0)} gols`}
          label="Marcados no grupo"
          tone="blue"
        />
        <InsightCard
          icon={ShieldCheck}
          value="2 vagas"
          label="Classificação direta"
          tone="emerald"
        />
      </section>

      <section className="card-arena min-w-0 p-3 sm:p-4">
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neon">
              Fase de grupos
            </p>
            <h2 className="mt-1 font-display text-base font-extrabold">Tabela de classificação</h2>
          </div>
          <div
            className="inline-flex w-fit rounded-lg border border-white/[0.07] bg-black/15 p-1"
            role="tablist"
            aria-label="Selecionar grupo"
          >
            {(["A", "B"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={group === value}
                onClick={() => setGroup(value)}
                className={cn(
                  "h-8 rounded-md px-4 text-[10px] font-semibold transition",
                  group === value
                    ? "bg-neon text-neon-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Grupo {value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <StandingsTable rows={rows} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[8px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-neon" /> Classificação direta
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-sky-300" /> Repescagem
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-sm bg-red-300" /> Eliminado
          </span>
        </div>
      </section>

      <section className="card-arena p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neon">
              Próxima fase
            </p>
            <h2 className="mt-1 font-display text-base font-extrabold">
              Cruzamento das semifinais
            </h2>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <KnockoutMatch
            seed="1º Grupo A"
            team={TEAMS.amazonas}
            opponentSeed="2º Grupo B"
            opponent={TEAMS.saoPedro}
          />
          <KnockoutMatch
            seed="1º Grupo B"
            team={TEAMS.unidosSul}
            opponentSeed="2º Grupo A"
            opponent={TEAMS.guarani}
          />
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Trophy;
  value: string;
  label: string;
  tone: "neon" | "blue" | "emerald";
}) {
  const colors = {
    neon: "bg-neon/10 text-neon",
    blue: "bg-sky-400/10 text-sky-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
  };
  return (
    <article className="card-arena flex items-center gap-3 p-4">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", colors[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate font-display text-sm font-extrabold">{value}</strong>
        <span className="mt-0.5 block text-[9px] text-muted-foreground">{label}</span>
      </span>
    </article>
  );
}

function KnockoutMatch({
  seed,
  team,
  opponentSeed,
  opponent,
}: {
  seed: string;
  team: typeof TEAMS.amazonas;
  opponentSeed: string;
  opponent: typeof TEAMS.amazonas;
}) {
  return (
    <article className="rounded-xl border border-white/[0.065] bg-black/15 p-3">
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">{seed}</span>
        <span className="flex items-center gap-2 text-[10px] font-semibold">
          <TeamCrest team={team} size="xs" />
          {team.name}
        </span>
      </div>
      <div className="my-1 h-px bg-white/[0.055]" />
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
          {opponentSeed}
        </span>
        <span className="flex items-center gap-2 text-[10px] font-semibold">
          <TeamCrest team={opponent} size="xs" />
          {opponent.name}
        </span>
      </div>
    </article>
  );
}
