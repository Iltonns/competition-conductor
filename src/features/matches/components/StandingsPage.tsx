import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Scale, Trophy } from "lucide-react";
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
  useCompetitionRounds,
  useCompetitionStages,
  useHomologateStandings,
} from "@/features/competition-engine/hooks/useCompetitionEngine";
import { useMatches, useStandings } from "@/features/matches/hooks/useMatches";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, StandingRow } from "@/features/matches/api/matches";

/** Paleta de avatar por equipe — derivada do id, estável entre renders. */
const TEAM_COLORS = [
  "oklch(47% 0.17 258)",
  "oklch(60% 0.1 210)",
  "oklch(60% 0.14 45)",
  "oklch(52% 0.15 300)",
  "oklch(58% 0.1 110)",
  "oklch(58% 0.16 15)",
];

function teamColor(id: string) {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return TEAM_COLORS[sum % TEAM_COLORS.length];
}

function teamInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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

  const scopeName = useMemo(() => {
    if (groupId !== "all") {
      const group = groups.data?.find((item) => item.id === groupId);
      if (group) return group.name;
    }
    if (stageId !== "base") {
      const stage = stages.data?.find((item) => item.id === stageId);
      if (stage) return stage.name;
    }
    return "Classificação geral";
  }, [groupId, groups.data, stageId, stages.data]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.03em]">Classificação</h2>
          <p className="mt-1 text-xs text-muted-foreground">
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
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-semibold",
              rows[0].status === "homologated"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-[oklch(85%_0.09_85)] bg-[oklch(97%_0.03_85)] text-[oklch(38%_0.09_70)]",
            )}
          >
            {rows[0].status === "homologated" ? "Homologada" : "Provisória"}
          </span>
          <span className="text-muted-foreground">
            Pontuação e desempates seguem o regulamento configurado.
          </span>
        </div>
      )}

      {/* Tabela + painel de rodada, como no mockup */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <StandingsGroupCard
          name={scopeName}
          rows={rows}
          isLoading={standings.isLoading}
          onAdjust={async (row) => {
            const value = prompt(`Ajuste de pontos para ${row.team_name}:`, "-1");
            if (value === null || !Number.isInteger(Number(value))) return;
            const reason = prompt("Justificativa obrigatória:");
            if (!reason?.trim()) return;
            try {
              await adjust.mutateAsync({
                stageId: stageId === "base" ? null : stageId,
                groupId: groupId === "all" ? null : groupId,
                teamId: row.team_id,
                points: Number(value),
                reason,
              });
              toast.success("Ajuste aplicado e auditado.");
            } catch {
              toast.error("Não foi possível aplicar o ajuste.");
            }
          }}
        />

        <RoundPanel championshipId={championshipId} stageId={stageId === "base" ? null : stageId} />
      </div>
    </div>
  );
}

function StandingsGroupCard({
  name,
  rows,
  isLoading,
  onAdjust,
}: {
  name: string;
  rows: StandingRow[];
  isLoading: boolean;
  onAdjust: (row: StandingRow) => void;
}) {
  if (isLoading) {
    return (
      <div className="card-arena p-6">
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="card-arena grid place-items-center gap-2 p-12 text-center">
        <Trophy className="h-8 w-8 text-muted-foreground" />
        <p className="font-display text-sm font-bold">Nenhuma partida finalizada</p>
        <p className="text-xs text-muted-foreground">
          Finalize partidas para popular a classificação.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <h3 className="font-display text-[15px] font-extrabold">{name}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[13px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.03em] text-muted-foreground">
              <th className="w-9 py-2 pl-5 text-left font-bold" />
              <th className="py-2 text-left font-bold">Time</th>
              {["Pts", "J", "V", "E", "D", "GP", "GC", "SG", "%"].map((label) => (
                <th key={label} className="w-9 py-2 text-center font-bold">
                  {label}
                </th>
              ))}
              <th className="w-12 py-2 pr-5 text-center font-bold">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const maxPoints = row.played * 3;
              const percentage = maxPoints > 0 ? Math.round((row.points / maxPoints) * 100) : 0;
              return (
                <tr key={row.team_id} className="border-t border-border/70">
                  <td className="py-2.5 pl-5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full font-display text-[8px] font-bold text-white"
                      style={{ background: teamColor(row.team_id) }}
                    >
                      {teamInitials(row.team_short || row.team_name)}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate py-2.5 font-semibold">
                    {row.team_short || row.team_name}
                  </td>
                  <td className="number-tabular py-2.5 text-center font-display font-extrabold text-primary">
                    {row.points}
                  </td>
                  <td className="number-tabular py-2.5 text-center">{row.played}</td>
                  <td className="number-tabular py-2.5 text-center">{row.wins}</td>
                  <td className="number-tabular py-2.5 text-center">{row.draws}</td>
                  <td className="number-tabular py-2.5 text-center">{row.losses}</td>
                  <td className="number-tabular py-2.5 text-center">{row.goals_for}</td>
                  <td className="number-tabular py-2.5 text-center">{row.goals_against}</td>
                  <td className="number-tabular py-2.5 text-center">
                    {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                  </td>
                  <td className="number-tabular py-2.5 text-center text-muted-foreground">
                    {percentage}
                  </td>
                  <td className="py-2.5 pr-5 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Aplicar punição ou bônus"
                      onClick={() => onAdjust(row)}
                    >
                      <Scale className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Painel lateral "Jogos" do mockup. Navega pelas rodadas reais da fase
 * (`competition_rounds`) e lista as partidas de cada uma. Sem fase
 * selecionada não há rodadas, então cai para as próximas partidas agendadas.
 */
function RoundPanel({
  championshipId,
  stageId,
}: {
  championshipId: string;
  stageId: string | null;
}) {
  const [index, setIndex] = useState(0);
  const rounds = useCompetitionRounds(championshipId, stageId ?? "");
  const roundList = useMemo(
    () => [...(rounds.data ?? [])].sort((a, b) => a.round_number - b.round_number),
    [rounds.data],
  );

  useEffect(() => setIndex(0), [stageId]);

  const activeRound = roundList[index] ?? null;
  const matches = useMatches(
    championshipId,
    activeRound ? { round: activeRound.name } : { status: "scheduled" },
  );
  const matchList = matches.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/championships/$id/matches" params={{ id: championshipId }}>
            Ver jogos
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/championships/$id/structure" params={{ id: championshipId }}>
            Fases e rodadas
          </Link>
        </Button>
      </div>

      {/* Seletor de rodada — barra escura do mockup */}
      <div className="flex items-center justify-between rounded-xl bg-foreground px-3 py-2.5 text-background">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-background hover:bg-background/15 hover:text-background"
          disabled={index <= 0}
          onClick={() => setIndex((value) => value - 1)}
          aria-label="Rodada anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-display text-sm font-extrabold">
          {activeRound ? activeRound.name : "Próximas partidas"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-background hover:bg-background/15 hover:text-background"
          disabled={index >= roundList.length - 1}
          onClick={() => setIndex((value) => value + 1)}
          aria-label="Próxima rodada"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {matches.isLoading && <Skeleton className="h-24 rounded-xl" />}

      {!matches.isLoading && matchList.length === 0 && (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
          {activeRound ? "Nenhuma partida nesta rodada." : "Nenhuma partida agendada."}
        </div>
      )}

      {matchList.slice(0, 8).map((match) => (
        <MatchMiniCard key={match.id} championshipId={championshipId} match={match} />
      ))}
    </div>
  );
}

function MatchMiniCard({
  championshipId,
  match,
}: {
  championshipId: string;
  match: MatchWithTeams;
}) {
  const homeName = match.home_team?.short_name || match.home_team?.name || "A definir";
  const awayName = match.away_team?.short_name || match.away_team?.name || "A definir";
  const finished = match.status === "finished";

  const when = match.scheduled_at
    ? new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(match.scheduled_at))
    : "Data a definir";

  return (
    <Link
      to="/championships/$id/matches/$matchId"
      params={{ id: championshipId, matchId: match.id }}
      className="block rounded-xl border border-border bg-card p-3.5 transition hover:border-primary/40"
    >
      <div className="flex items-center justify-between gap-2">
        <TeamSide id={match.home_team?.id ?? match.id} name={homeName} />
        <span className="font-display text-sm font-extrabold text-muted-foreground">
          {finished ? `${match.home_score ?? 0}–${match.away_score ?? 0}` : "x"}
        </span>
        <TeamSide id={match.away_team?.id ?? match.id} name={awayName} />
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">{when}</p>
    </Link>
  );
}

function TeamSide({ id, name }: { id: string; name: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <span
        className="mx-auto flex h-7 w-7 items-center justify-center rounded-full font-display text-[9px] font-bold text-white"
        style={{ background: teamColor(id) }}
      >
        {teamInitials(name)}
      </span>
      <p className="mt-1 truncate text-[10px] font-semibold">{name}</p>
    </div>
  );
}
