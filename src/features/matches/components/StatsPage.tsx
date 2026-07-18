import { BarChart3, Goal, Square, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipStats } from "@/features/matches/hooks/useMatches";

export function StatsPage({ championshipId }: { championshipId: string }) {
  const stats = useChampionshipStats(championshipId);
  const scorers = stats.data?.scorers ?? [];
  const cards = stats.data?.cards ?? [];
  const totals = stats.data?.totals ?? { matches: 0, goals: 0, yellows: 0, reds: 0 };

  return (
    <div className="space-y-4">
      <header>
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">Estatísticas</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Rankings gerados dos eventos registrados nas súmulas.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <TotalCard
          icon={BarChart3}
          label="Partidas"
          value={totals.matches}
          tone="text-sky-300 bg-sky-400/10"
        />
        <TotalCard icon={Goal} label="Gols" value={totals.goals} tone="text-neon bg-neon/10" />
        <TotalCard
          icon={Square}
          label="Amarelos"
          value={totals.yellows}
          tone="text-amber-300 bg-amber-400/10"
        />
        <TotalCard
          icon={Square}
          label="Vermelhos"
          value={totals.reds}
          tone="text-red-300 bg-red-400/10"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-arena p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-neon" />
            <h3 className="font-display text-sm font-bold">Artilheiros</h3>
          </div>
          {stats.isLoading && <Skeleton className="mt-3 h-32" />}
          {!stats.isLoading && scorers.length === 0 && (
            <p className="mt-6 text-center text-[10px] text-muted-foreground">
              Sem gols registrados.
            </p>
          )}
          {scorers.length > 0 && (
            <div className="mt-3 divide-y divide-white/[0.05]">
              {scorers.map((s, i) => (
                <div
                  key={s.athlete_id}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-2 py-2 text-xs"
                >
                  <span className="font-display text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.athlete_name}</p>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {s.team_name ?? "—"}
                    </p>
                  </div>
                  <span className="number-tabular font-display text-sm font-extrabold text-neon">
                    {s.goals}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-arena p-4">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4 text-amber-300" />
            <h3 className="font-display text-sm font-bold">Disciplina</h3>
          </div>
          {stats.isLoading && <Skeleton className="mt-3 h-32" />}
          {!stats.isLoading && cards.length === 0 && (
            <p className="mt-6 text-center text-[10px] text-muted-foreground">
              Sem cartões registrados.
            </p>
          )}
          {cards.length > 0 && (
            <div className="mt-3 divide-y divide-white/[0.05]">
              {cards.map((c) => (
                <div
                  key={c.athlete_id}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.athlete_name}</p>
                    <p className="truncate text-[9px] text-muted-foreground">
                      {c.team_name ?? "—"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Square className="h-3 w-3 fill-amber-300" /> {c.yellows}
                  </span>
                  <span className="inline-flex items-center gap-1 text-red-400">
                    <Square className="h-3 w-3 fill-red-400" /> {c.reds}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TotalCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="card-arena flex items-center gap-3 p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-extrabold leading-none tracking-[-0.05em]">
          {value}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      </div>
    </article>
  );
}
