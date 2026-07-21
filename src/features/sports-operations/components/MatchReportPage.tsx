import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileDown, LockKeyhole, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { MatchWithTeams } from "@/features/matches/api/matches";
import { useMatchEvents } from "@/features/matches/hooks/useMatches";
import type { LineupEntry, LineupWithAthlete } from "../api/sports-operations";
import {
  useEligibleAthletes,
  useLineups,
  useMatchReport,
  useReportActions,
  useSaveLineup,
} from "../hooks/useSportsOperations";

export function MatchReportPage({
  championshipId,
  match,
}: {
  championshipId: string;
  match: MatchWithTeams;
}) {
  const report = useMatchReport(match.id);
  const lineups = useLineups(match.id);
  const events = useMatchEvents(championshipId, match.id);
  const actions = useReportActions(championshipId, match.id);
  const [homeScore, setHomeScore] = useState(String(match.home_score ?? 0));
  const [awayScore, setAwayScore] = useState(String(match.away_score ?? 0));
  const [firstAdded, setFirstAdded] = useState("0");
  const [secondAdded, setSecondAdded] = useState("0");
  const [notes, setNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  useEffect(() => {
    if (!report.data) return;
    setHomeScore(String(report.data.regular_home_score ?? match.home_score ?? 0));
    setAwayScore(String(report.data.regular_away_score ?? match.away_score ?? 0));
    setFirstAdded(String(report.data.first_half_added_minutes));
    setSecondAdded(String(report.data.second_half_added_minutes));
    setNotes(report.data.notes ?? "");
  }, [report.data, match.home_score, match.away_score]);

  if (report.isLoading || lineups.isLoading || events.isLoading)
    return <Skeleton className="h-96" />;
  const locked = report.data?.status === "homologated";
  const lineupLocked =
    locked ||
    ((["live", "finished", "confirmed"] as string[]).includes(match.status) &&
      report.data?.status !== "reopened");
  const save = async () => {
    try {
      await actions.save.mutateAsync({
        regular_home_score: Number(homeScore),
        regular_away_score: Number(awayScore),
        first_half_added_minutes: Number(firstAdded),
        second_half_added_minutes: Number(secondAdded),
        notes,
        attachments: [],
      });
      toast.success("Súmula salva e versionada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a súmula.");
    }
  };

  return (
    <div className="space-y-4 print:bg-white print:text-black">
      <section className="card-arena p-4 print:border-black print:bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Súmula oficial
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              {match.home_team?.name ?? "Mandante"} × {match.away_team?.name ?? "Visitante"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {match.scheduled_at
                ? new Date(match.scheduled_at).toLocaleString("pt-BR")
                : "Data a definir"}{" "}
              · {match.venue ?? "Local a definir"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={locked ? "default" : "secondary"}>
              {locked ? "Homologada" : report.data?.status === "reopened" ? "Reaberta" : "Rascunho"}
            </Badge>
            {report.data && <Badge variant="outline">v{report.data.version}</Badge>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[1fr_72px_24px_72px_1fr] items-center gap-2 text-center">
          <strong>{match.home_team?.name}</strong>
          <Input
            aria-label="Placar do mandante"
            type="number"
            min={0}
            value={homeScore}
            disabled={locked}
            onChange={(event) => setHomeScore(event.target.value)}
          />
          <span>×</span>
          <Input
            aria-label="Placar do visitante"
            type="number"
            min={0}
            value={awayScore}
            disabled={locked}
            onChange={(event) => setAwayScore(event.target.value)}
          />
          <strong>{match.away_team?.name}</strong>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {match.home_team_id && (
          <LineupEditor
            championshipId={championshipId}
            matchId={match.id}
            teamId={match.home_team_id}
            teamName={match.home_team?.name ?? "Mandante"}
            locked={lineupLocked}
            current={lineups.data ?? []}
          />
        )}
        {match.away_team_id && (
          <LineupEditor
            championshipId={championshipId}
            matchId={match.id}
            teamId={match.away_team_id}
            teamName={match.away_team?.name ?? "Visitante"}
            locked={lineupLocked}
            current={lineups.data ?? []}
          />
        )}
      </div>

      <section className="card-arena p-4">
        <h3 className="font-display text-sm font-bold">Eventos e ocorrências</h3>
        <div className="mt-3 space-y-2">
          {(events.data ?? []).map((event) => (
            <div
              key={event.id}
              className="flex gap-3 rounded-lg border border-white/10 px-3 py-2 text-xs"
            >
              <strong className="w-10">{event.minute == null ? "—" : `${event.minute}'`}</strong>
              <span>{event.type.replaceAll("_", " ")}</span>
              <span className="text-muted-foreground">{event.note}</span>
            </div>
          ))}
          {(events.data?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
          )}
        </div>
      </section>

      <section className="card-arena grid gap-4 p-4 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Acréscimos 1º tempo</Label>
            <Input
              type="number"
              min={0}
              value={firstAdded}
              disabled={locked}
              onChange={(event) => setFirstAdded(event.target.value)}
            />
          </div>
          <div>
            <Label>Acréscimos 2º tempo</Label>
            <Input
              type="number"
              min={0}
              value={secondAdded}
              disabled={locked}
              onChange={(event) => setSecondAdded(event.target.value)}
            />
          </div>
        </div>
        <div>
          <Label>Observações oficiais</Label>
          <Textarea
            value={notes}
            disabled={locked}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()} disabled={!locked}>
          <FileDown className="h-4 w-4" /> Imprimir / PDF
        </Button>
        {!locked && (
          <Button variant="outline" onClick={save} disabled={actions.save.isPending}>
            <Save className="h-4 w-4" /> Salvar rascunho
          </Button>
        )}
        {!locked && (
          <Button
            onClick={async () => {
              try {
                await actions.homologate.mutateAsync();
                toast.success("Súmula homologada e bloqueada.");
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Há pendências para homologar.",
                );
              }
            }}
            disabled={match.status !== "finished" || actions.homologate.isPending}
          >
            <ShieldCheck className="h-4 w-4" /> Homologar
          </Button>
        )}
        {locked && (
          <div className="flex gap-2">
            <Input
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              placeholder="Justificativa obrigatória"
            />
            <Button
              variant="destructive"
              disabled={!reopenReason.trim() || actions.reopen.isPending}
              onClick={async () => {
                try {
                  await actions.reopen.mutateAsync(reopenReason);
                  setReopenReason("");
                  toast.success("Súmula reaberta com auditoria.");
                } catch {
                  toast.error("Não foi possível reabrir.");
                }
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reabrir
            </Button>
          </div>
        )}
      </div>
      {locked && (
        <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" /> Eventos e escalações estão fechados nesta versão
          homologada.
        </p>
      )}
    </div>
  );
}

function LineupEditor({
  championshipId,
  matchId,
  teamId,
  teamName,
  locked,
  current,
}: {
  championshipId: string;
  matchId: string;
  teamId: string;
  teamName: string;
  locked: boolean;
  current: LineupWithAthlete[];
}) {
  const eligible = useEligibleAthletes(championshipId, teamId);
  const mutation = useSaveLineup(championshipId, matchId);
  const currentTeam = useMemo(
    () => current.filter((row) => row.team_id === teamId),
    [current, teamId],
  );
  const [entries, setEntries] = useState<Record<string, LineupEntry>>({});
  useEffect(() => {
    setEntries(
      Object.fromEntries(
        currentTeam.map((row) => [
          row.athlete_id,
          {
            athlete_id: row.athlete_id,
            role: row.lineup_role as "starter" | "substitute",
            is_captain: row.is_captain,
            jersey_number: row.jersey_number,
            position: row.position,
          },
        ]),
      ),
    );
  }, [currentTeam]);
  const toggle = (athlete: NonNullable<typeof eligible.data>[number]) =>
    setEntries((state) =>
      state[athlete.id]
        ? Object.fromEntries(Object.entries(state).filter(([id]) => id !== athlete.id))
        : {
            ...state,
            [athlete.id]: {
              athlete_id: athlete.id,
              role: "substitute",
              is_captain: false,
              jersey_number: athlete.jersey_number,
              position: athlete.position,
            },
          },
    );
  return (
    <section className="card-arena p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">{teamName}</h3>
        <Badge variant="outline">{Object.keys(entries).length} escalados</Badge>
      </div>
      <div className="mt-3 space-y-2">
        {(eligible.data ?? []).map((athlete) => {
          const selected = entries[athlete.id];
          return (
            <div
              key={athlete.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 p-2 text-xs"
            >
              <input
                type="checkbox"
                checked={Boolean(selected)}
                disabled={locked}
                onChange={() => toggle(athlete)}
              />
              <span>
                #{athlete.jersey_number ?? "—"} {athlete.full_name}
              </span>
              {selected && (
                <select
                  aria-label={`Função de ${athlete.full_name}`}
                  className="rounded border border-white/10 bg-background p-1"
                  value={selected.role}
                  disabled={locked}
                  onChange={(event) =>
                    setEntries((state) => ({
                      ...state,
                      [athlete.id]: {
                        ...selected,
                        role: event.target.value as LineupEntry["role"],
                      },
                    }))
                  }
                >
                  <option value="starter">Titular</option>
                  <option value="substitute">Reserva</option>
                </select>
              )}
              {selected && (
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`captain-${teamId}`}
                    checked={selected.is_captain}
                    disabled={locked}
                    onChange={() =>
                      setEntries((state) =>
                        Object.fromEntries(
                          Object.entries(state).map(([id, entry]) => [
                            id,
                            { ...entry, is_captain: id === athlete.id },
                          ]),
                        ),
                      )
                    }
                  />{" "}
                  Capitão
                </label>
              )}
            </div>
          );
        })}
      </div>
      {!locked && (
        <Button
          className="mt-3 w-full"
          variant="outline"
          disabled={mutation.isPending}
          onClick={async () => {
            try {
              await mutation.mutateAsync({ teamId, entries: Object.values(entries) });
              toast.success(`Escalação de ${teamName} salva.`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Escalação inválida.");
            }
          }}
        >
          <CheckCircle2 className="h-4 w-4" /> Salvar escalação
        </Button>
      )}
    </section>
  );
}
