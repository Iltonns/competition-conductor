import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStandings } from "@/features/matches/hooks/useMatches";
import { cn } from "@/lib/utils";

export function StandingsPage({ championshipId }: { championshipId: string }) {
  const standings = useStandings(championshipId);
  const rows = standings.data ?? [];

  return (
    <div className="space-y-4">
      <header>
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">Classificação</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Tabela calculada automaticamente a partir das partidas finalizadas.
          </p>
        </div>
      </header>

      <div className="card-arena overflow-hidden">
        {standings.isLoading && (
          <div className="p-6">
            <Skeleton className="h-40" />
          </div>
        )}
        {!standings.isLoading && rows.length === 0 && (
          <div className="grid place-items-center gap-2 p-12 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground" />
            <p className="font-display text-sm font-bold">Nenhuma partida finalizada</p>
            <p className="text-[10px] text-muted-foreground">
              Finalize partidas para popular a classificação.
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="w-10 py-2 pl-4 text-left">#</th>
                  <th className="py-2 text-left">Equipe</th>
                  <th className="py-2 text-center">P</th>
                  <th className="py-2 text-center">J</th>
                  <th className="py-2 text-center">V</th>
                  <th className="py-2 text-center">E</th>
                  <th className="py-2 text-center">D</th>
                  <th className="py-2 text-center">GP</th>
                  <th className="py-2 text-center">GC</th>
                  <th className="py-2 pr-4 text-center">SG</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.team_id}
                    className="border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                  >
                    <td className="py-2.5 pl-4">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full font-display text-[10px] font-bold",
                          i < 4
                            ? "bg-neon/15 text-neon"
                            : i >= rows.length - 2
                              ? "bg-red-500/10 text-red-300"
                              : "bg-white/5 text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold">{r.team_short || r.team_name}</td>
                    <td className="number-tabular py-2.5 text-center font-display text-sm font-extrabold text-neon">
                      {r.points}
                    </td>
                    <td className="number-tabular py-2.5 text-center">{r.played}</td>
                    <td className="number-tabular py-2.5 text-center">{r.wins}</td>
                    <td className="number-tabular py-2.5 text-center">{r.draws}</td>
                    <td className="number-tabular py-2.5 text-center">{r.losses}</td>
                    <td className="number-tabular py-2.5 text-center">{r.goals_for}</td>
                    <td className="number-tabular py-2.5 text-center">{r.goals_against}</td>
                    <td className="number-tabular py-2.5 pr-4 text-center">
                      {r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
