import { useState } from "react";
import { CheckCircle2, Scale, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddStandingsAdjustment,
  useCompetitionGroups,
  useCompetitionStages,
  useHomologateStandings,
} from "@/features/competition-engine/hooks/useCompetitionEngine";
import { useStandings } from "@/features/matches/hooks/useMatches";
import { cn } from "@/lib/utils";

export function StandingsPage({ championshipId }: { championshipId: string }) {
  const [stageId, setStageId] = useState("base");
  const [groupId, setGroupId] = useState("all");
  const stages = useCompetitionStages(championshipId);
  const groups = useCompetitionGroups(championshipId, stageId === "base" ? undefined : stageId);
  const standings = useStandings(
    championshipId,
    stageId === "base" ? null : stageId,
    groupId === "all" ? null : groupId,
  );
  const adjust = useAddStandingsAdjustment(championshipId);
  const homologate = useHomologateStandings(championshipId);
  const rows = standings.data ?? [];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">Classificação</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Tabela calculada automaticamente a partir das partidas finalizadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={stageId}
            onValueChange={(value) => {
              setStageId(value);
              setGroupId("all");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Geral do campeonato</SelectItem>
              {stages.data
                ?.filter((stage) => stage.status !== "archived")
                .map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={groupId} onValueChange={setGroupId} disabled={stageId === "base"}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sem grupo / geral</SelectItem>
              {groups.data
                ?.filter((group) => group.stage_id === stageId)
                .map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={!rows.length || homologate.isPending}
            onClick={async () => {
              if (!confirm("Homologar esta classificação? O ato será auditado.")) return;
              try {
                await homologate.mutateAsync({
                  stageId: stageId === "base" ? null : stageId,
                  groupId: groupId === "all" ? null : groupId,
                });
                toast.success("Classificação homologada.");
              } catch {
                toast.error("Finalize a fase antes da homologação.");
              }
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Homologar
          </Button>
        </div>
      </header>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full border px-2 py-1",
              rows[0].status === "homologated"
                ? "border-neon/30 bg-neon/10 text-neon"
                : "border-amber-300/30 bg-amber-400/10 text-amber-200",
            )}
          >
            {rows[0].status === "homologated" ? "Homologada" : "Provisória"}
          </span>
          <span className="text-muted-foreground">
            Pontuação e desempates seguem o regulamento configurado.
          </span>
        </div>
      )}

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
                  <th className="py-2 pr-4 text-center">Ajuste</th>
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
                    <td className="py-2.5 pr-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Aplicar punição ou bônus"
                        onClick={async () => {
                          const value = prompt(`Ajuste de pontos para ${r.team_name}:`, "-1");
                          if (value === null || !Number.isInteger(Number(value))) return;
                          const reason = prompt("Justificativa obrigatória:");
                          if (!reason?.trim()) return;
                          try {
                            await adjust.mutateAsync({
                              stageId: stageId === "base" ? null : stageId,
                              groupId: groupId === "all" ? null : groupId,
                              teamId: r.team_id,
                              points: Number(value),
                              reason,
                            });
                            toast.success("Ajuste aplicado e auditado.");
                          } catch {
                            toast.error("Não foi possível aplicar o ajuste.");
                          }
                        }}
                      >
                        <Scale className="h-3.5 w-3.5" />
                      </Button>
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
