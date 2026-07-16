import { useEffect, useMemo, useState, type ReactElement } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  Flag,
  Goal,
  MapPin,
  Play,
  Plus,
  Square,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionships } from "@/features/championships/hooks/useChampionships";
import { useTeams } from "@/features/teams/hooks/useTeams";
import type {
  MatchEventType,
  MatchStatus,
  MatchWithTeams,
  UpdateMatchInput,
} from "@/features/matches/api/matches";
import {
  useCreateMatch,
  useCreateMatchEvent,
  useDeleteMatch,
  useDeleteMatchEvent,
  useMatchEvents,
  useMatches,
  useUpdateMatch,
} from "@/features/matches/hooks/useMatches";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Partidas · IS Arena" }] }),
  component: MatchesPage,
});

const STATUS_LABEL: Record<MatchStatus, string> = {
  preparing: "Em preparação",
  scheduled: "Agendada",
  live: "Ao vivo",
  finished: "Finalizada",
  confirmed: "Confirmada",
  awaiting_confirmation: "Aguardando confirmação",
  postponed: "Adiada",
  cancelled: "Cancelada",
};

const STATUS_TONE: Record<MatchStatus, string> = {
  preparing: "border-violet-300/25 bg-violet-400/10 text-violet-300",
  scheduled: "border-sky-300/25 bg-sky-400/10 text-sky-300",
  live: "border-emerald-300/30 bg-emerald-400/15 text-emerald-300",
  finished: "border-white/10 bg-white/[0.04] text-muted-foreground",
  confirmed: "border-neon/30 bg-neon/10 text-neon",
  awaiting_confirmation: "border-amber-300/25 bg-amber-400/10 text-amber-300",
  postponed: "border-amber-300/25 bg-amber-400/10 text-amber-300",
  cancelled: "border-red-300/25 bg-red-400/10 text-red-300",
};

const EVENT_LABEL: Record<MatchEventType, string> = {
  goal: "Gol",
  own_goal: "Gol contra",
  penalty_goal: "Gol de pênalti",
  penalty_missed: "Pênalti perdido",
  yellow_card: "Cartão amarelo",
  red_card: "Cartão vermelho",
  substitution: "Substituição",
  assist: "Assistência",
  injury: "Lesão",
  period_start: "Início do período",
  period_end: "Fim do período",
  extra_time: "Acréscimo",
  note: "Anotação",
};

function MatchesPage() {
  const championships = useChampionships();
  const [championshipId, setChampionshipId] = useState<string>("");

  useEffect(() => {
    if (!championshipId && championships.data?.length) {
      setChampionshipId(championships.data[0].id);
    }
  }, [championships.data, championshipId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">
            Partidas & Súmula
          </h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Agende jogos, registre gols, cartões e finalize partidas em tempo real.
          </p>
        </div>
        <div className="min-w-[220px]">
          <Label className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            Campeonato
          </Label>
          <Select value={championshipId} onValueChange={setChampionshipId}>
            <SelectTrigger className="mt-1 h-9 border-white/[0.08] bg-white/[0.03] text-xs">
              <SelectValue placeholder="Selecione um campeonato" />
            </SelectTrigger>
            <SelectContent>
              {(championships.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {championships.isLoading && <Skeleton className="h-64 w-full" />}
      {!championships.isLoading && (championships.data?.length ?? 0) === 0 && (
        <EmptyState
          title="Nenhum campeonato ainda"
          hint="Crie um campeonato antes de agendar partidas."
        />
      )}

      {championshipId && <MatchesBoard championshipId={championshipId} />}
    </div>
  );
}

function MatchesBoard({ championshipId }: { championshipId: string }) {
  const matches = useMatches(championshipId);
  const teams = useTeams(championshipId);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (matches.data && !selectedId && matches.data.length) {
      setSelectedId(matches.data[0].id);
    }
    if (matches.data && selectedId && !matches.data.some((m) => m.id === selectedId)) {
      setSelectedId(matches.data[0]?.id ?? null);
    }
  }, [matches.data, selectedId]);

  const selected = matches.data?.find((m) => m.id === selectedId) ?? null;
  const availableTeams = (teams.data ?? []).map((t) => ({
    id: t.team.id,
    name: t.team.short_name || t.team.name,
    full_name: t.team.name,
  }));

  return (
    <>
      <div className="flex justify-end">
        <Button
          onClick={() => setCreating(true)}
          className="h-9 bg-neon text-neon-foreground hover:bg-neon/90"
          disabled={availableTeams.length < 2}
        >
          <Plus className="h-4 w-4" /> Nova partida
        </Button>
      </div>

      {availableTeams.length < 2 && (
        <p className="text-[10px] text-amber-300">
          Cadastre ao menos duas equipes no campeonato para criar partidas.
        </p>
      )}

      <section className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <div className="card-arena p-4">
          <h3 className="font-display text-sm font-bold">Todas as partidas</h3>
          <div className="mt-3 space-y-2">
            {matches.isLoading && <Skeleton className="h-16" />}
            {!matches.isLoading && (matches.data?.length ?? 0) === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-[10px] text-muted-foreground">
                Nenhuma partida cadastrada.
              </p>
            )}
            {(matches.data ?? []).map((m) => (
              <MatchListItem
                key={m.id}
                match={m}
                selected={m.id === selectedId}
                onClick={() => setSelectedId(m.id)}
              />
            ))}
          </div>
        </div>

        <div className="card-arena p-4">
          {selected ? (
            <MatchPanel championshipId={championshipId} match={selected} />
          ) : (
            <EmptyState
              title="Selecione uma partida"
              hint="Escolha uma partida à esquerda para gerenciar a súmula."
            />
          )}
        </div>
      </section>

      <CreateMatchDialog
        open={creating}
        onOpenChange={setCreating}
        championshipId={championshipId}
        teams={availableTeams}
      />
    </>
  );
}

function MatchListItem({
  match,
  selected,
  onClick,
}: {
  match: MatchWithTeams;
  selected: boolean;
  onClick: () => void;
}) {
  const date = match.scheduled_at
    ? new Date(match.scheduled_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sem data";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "block w-full rounded-xl border p-3 text-left transition",
        selected
          ? "border-neon/40 bg-neon/[0.06]"
          : "border-white/[0.06] bg-black/15 hover:border-white/15",
      )}
    >
      <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{match.phase || match.round || "Fase única"}</span>
        <span className={cn("rounded-full border px-2 py-0.5", STATUS_TONE[match.status])}>
          {STATUS_LABEL[match.status]}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="truncate text-right text-xs font-semibold">
          {match.home_team?.name ?? "—"}
        </span>
        <span className="number-tabular font-display text-base font-extrabold tracking-[-0.03em]">
          {match.home_score ?? 0} - {match.away_score ?? 0}
        </span>
        <span className="truncate text-xs font-semibold">{match.away_team?.name ?? "—"}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3 w-3" /> {date}
        </span>
        {match.venue && (
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" /> {match.venue}
          </span>
        )}
      </div>
    </button>
  );
}

function MatchPanel({ championshipId, match }: { championshipId: string; match: MatchWithTeams }) {
  const update = useUpdateMatch(championshipId, match.id);
  const del = useDeleteMatch(championshipId);
  const events = useMatchEvents(match.id);
  const createEvent = useCreateMatchEvent(championshipId, match.id);
  const deleteEvent = useDeleteMatchEvent(championshipId, match.id);

  const setStatus = async (status: MatchStatus) => {
    try {
      await update.mutateAsync({ status });
      toast.success("Status atualizado.");
    } catch (e) {
      toast.error("Falha ao atualizar status.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir esta partida e todos os eventos?")) return;
    try {
      await del.mutateAsync(match.id);
      toast.success("Partida excluída.");
    } catch {
      toast.error("Falha ao excluir.");
    }
  };

  const adjustScore = async (team: "home" | "away", delta: number) => {
    const current = (team === "home" ? match.home_score : match.away_score) ?? 0;
    const next = Math.max(0, current + delta);
    const changes: UpdateMatchInput = team === "home" ? { home_score: next } : { away_score: next };
    try {
      await update.mutateAsync(changes);
    } catch {
      toast.error("Falha ao atualizar placar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
            STATUS_TONE[match.status],
          )}
        >
          {STATUS_LABEL[match.status]}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-white/10 text-[10px]"
            onClick={() => setStatus("scheduled")}
          >
            <CalendarClock className="h-3 w-3" /> Agendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-emerald-400/30 text-emerald-200 text-[10px]"
            onClick={() => setStatus("live")}
          >
            <Play className="h-3 w-3" /> Ao vivo
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-white/10 text-[10px]"
            onClick={() => setStatus("finished")}
          >
            <CheckCircle2 className="h-3 w-3" /> Finalizar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-red-300 text-[10px] hover:bg-red-500/10 hover:text-red-200"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" /> Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamScoreCard
          name={match.home_team?.name ?? "—"}
          score={match.home_score ?? 0}
          onInc={() => adjustScore("home", 1)}
          onDec={() => adjustScore("home", -1)}
        />
        <div className="text-center">
          <p className="font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            Placar
          </p>
          <p className="number-tabular font-display text-4xl font-extrabold tracking-[-0.06em]">
            {match.home_score ?? 0}–{match.away_score ?? 0}
          </p>
          {match.scheduled_at && (
            <p className="mt-1 flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              {new Date(match.scheduled_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <TeamScoreCard
          name={match.away_team?.name ?? "—"}
          score={match.away_score ?? 0}
          onInc={() => adjustScore("away", 1)}
          onDec={() => adjustScore("away", -1)}
        />
      </div>

      <EventForm
        matchId={match.id}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        onSubmit={async (data) => {
          try {
            await createEvent.mutateAsync(data);
            toast.success("Evento registrado.");
          } catch {
            toast.error("Falha ao registrar evento.");
          }
        }}
      />

      <div>
        <h4 className="font-display text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Súmula
        </h4>
        <div className="mt-2 divide-y divide-white/[0.05] rounded-xl border border-white/[0.06] bg-black/15">
          {events.isLoading && (
            <div className="p-4">
              <Skeleton className="h-6" />
            </div>
          )}
          {!events.isLoading && (events.data?.length ?? 0) === 0 && (
            <p className="p-6 text-center text-[10px] text-muted-foreground">Sem eventos ainda.</p>
          )}
          {(events.data ?? []).map((e) => {
            const teamName =
              e.team_id === match.home_team_id
                ? match.home_team?.name
                : e.team_id === match.away_team_id
                  ? match.away_team?.name
                  : null;
            return (
              <div
                key={e.id}
                className="grid grid-cols-[42px_1fr_auto] items-center gap-2 px-3 py-2 text-xs"
              >
                <strong className="number-tabular text-[11px]">
                  {e.minute != null ? `${e.minute}'` : "—"}
                </strong>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    <EventIcon type={e.type} /> {EVENT_LABEL[e.type]}
                  </p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    {teamName ?? "—"}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <button
                  aria-label="Remover evento"
                  className="text-muted-foreground hover:text-red-300"
                  onClick={async () => {
                    try {
                      await deleteEvent.mutateAsync(e.id);
                    } catch {
                      toast.error("Falha ao remover evento.");
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TeamScoreCard({
  name,
  score,
  onInc,
  onDec,
}: {
  name: string;
  score: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3 text-center">
      <p className="truncate font-display text-sm font-bold">{name}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <Button size="sm" variant="outline" className="h-7 w-7 border-white/10 p-0" onClick={onDec}>
          −
        </Button>
        <span className="number-tabular w-8 font-display text-xl font-extrabold">{score}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 border-neon/30 bg-neon/10 p-0 text-neon"
          onClick={onInc}
        >
          +
        </Button>
      </div>
    </div>
  );
}

function EventIcon({ type }: { type: MatchEventType }) {
  const map: Record<MatchEventType, ReactElement> = {
    goal: <Goal className="mr-1 inline h-3 w-3 text-neon" />,
    own_goal: <Goal className="mr-1 inline h-3 w-3 text-red-300" />,
    penalty_goal: <Goal className="mr-1 inline h-3 w-3 text-neon" />,
    penalty_missed: <Goal className="mr-1 inline h-3 w-3 text-red-300" />,
    yellow_card: <Square className="mr-1 inline h-3 w-3 fill-amber-300 text-amber-300" />,
    red_card: <Square className="mr-1 inline h-3 w-3 fill-red-400 text-red-400" />,
    substitution: <ArrowRightLeft className="mr-1 inline h-3 w-3 text-sky-300" />,
    assist: <Flag className="mr-1 inline h-3 w-3 text-violet-300" />,
    injury: <Flag className="mr-1 inline h-3 w-3 text-red-300" />,
    period_start: <Play className="mr-1 inline h-3 w-3 text-sky-300" />,
    period_end: <CheckCircle2 className="mr-1 inline h-3 w-3 text-muted-foreground" />,
    extra_time: <Timer className="mr-1 inline h-3 w-3 text-amber-300" />,
    note: <Flag className="mr-1 inline h-3 w-3 text-muted-foreground" />,
  };
  return map[type];
}

function EventForm({
  matchId,
  homeTeam,
  awayTeam,
  onSubmit,
}: {
  matchId: string;
  homeTeam: MatchWithTeams["home_team"];
  awayTeam: MatchWithTeams["away_team"];
  onSubmit: (data: {
    match_id: string;
    team_id: string;
    athlete_id: string | null;
    type: MatchEventType;
    minute: number | null;
    note: string | null;
  }) => Promise<void>;
}) {
  const [teamId, setTeamId] = useState<string>(homeTeam?.id ?? "");
  const [type, setType] = useState<MatchEventType>("goal");
  const [minute, setMinute] = useState<string>("");
  const [athleteId, setAthleteId] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    setAthleteId("");
  }, [teamId]);

  const teamOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [];
    if (homeTeam) opts.push({ id: homeTeam.id, name: homeTeam.name });
    if (awayTeam) opts.push({ id: awayTeam.id, name: awayTeam.name });
    return opts;
  }, [homeTeam, awayTeam]);

  return (
    <form
      className="grid gap-2 rounded-xl border border-white/[0.07] bg-black/15 p-3 md:grid-cols-[1.1fr_1.1fr_1.4fr_.6fr_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!teamId) return;
        await onSubmit({
          match_id: matchId,
          team_id: teamId,
          athlete_id: athleteId || null,
          type,
          minute: minute ? Number(minute) : null,
          note: note || null,
        });
        setMinute("");
        setNote("");
      }}
    >
      <Select value={teamId} onValueChange={setTeamId}>
        <SelectTrigger className="h-8 border-white/10 bg-white/[0.03] text-[11px]">
          <SelectValue placeholder="Equipe" />
        </SelectTrigger>
        <SelectContent>
          {teamOptions.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => setType(v as MatchEventType)}>
        <SelectTrigger className="h-8 border-white/10 bg-white/[0.03] text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(EVENT_LABEL) as MatchEventType[]).map((t) => (
            <SelectItem key={t} value={t}>
              {EVENT_LABEL[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AthleteSelect
        teamId={teamId}
        athleteId={athleteId}
        onChange={setAthleteId}
        matchId={matchId}
      />

      <Input
        placeholder="min"
        inputMode="numeric"
        value={minute}
        onChange={(e) => setMinute(e.target.value.replace(/\D/g, ""))}
        className="h-8 border-white/10 bg-white/[0.03] text-[11px]"
      />
      <Input
        placeholder="Observação"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 border-white/10 bg-white/[0.03] text-[11px]"
      />
      <Button
        type="submit"
        className="h-8 bg-neon text-neon-foreground hover:bg-neon/90"
        disabled={!teamId}
      >
        <Plus className="h-3 w-3" /> Add
      </Button>
    </form>
  );
}

function AthleteSelect({
  teamId,
  athleteId,
  onChange,
  matchId,
}: {
  teamId: string;
  athleteId: string;
  onChange: (v: string) => void;
  matchId: string;
}) {
  // Get championshipId via match record — accessible via team via URL context not always,
  // but we already scoped the roster call by championship. Retrieve championshipId from parent via context is complex.
  // Simpler: derive championshipId by asking parent — but we have match_id and no direct access.
  // We use a lightweight lookup: reuse the existing useRoster if we know championshipId; here we
  // fetch a shallow athletes list scoped to team_id via useTeamAthletes helper.
  return (
    <AthleteSelectImpl
      teamId={teamId}
      athleteId={athleteId}
      onChange={onChange}
      matchId={matchId}
    />
  );
}

function AthleteSelectImpl({
  teamId,
  athleteId,
  onChange,
  matchId,
}: {
  teamId: string;
  athleteId: string;
  onChange: (v: string) => void;
  matchId: string;
}) {
  const [athletes, setAthletes] = useState<
    { id: string; full_name: string; jersey_number: number | null }[]
  >([]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!teamId) {
        setAthletes([]);
        return;
      }
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("athletes")
        .select("id, full_name, jersey_number")
        .eq("team_id", teamId)
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("full_name");
      if (!cancelled) setAthletes(data ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [teamId, matchId]);

  return (
    <Select value={athleteId} onValueChange={onChange}>
      <SelectTrigger className="h-8 border-white/10 bg-white/[0.03] text-[11px]">
        <SelectValue placeholder="Atleta (opcional)" />
      </SelectTrigger>
      <SelectContent>
        {athletes.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.jersey_number != null ? `#${a.jersey_number} ` : ""}
            {a.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CreateMatchDialog({
  open,
  onOpenChange,
  championshipId,
  teams,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  championshipId: string;
  teams: { id: string; name: string; full_name: string }[];
}) {
  const create = useCreateMatch(championshipId);
  const [homeId, setHomeId] = useState<string>("");
  const [awayId, setAwayId] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [phase, setPhase] = useState<string>("");

  useEffect(() => {
    if (open) {
      setHomeId("");
      setAwayId("");
      setScheduledAt("");
      setVenue("");
      setPhase("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!homeId || !awayId || homeId === awayId) {
      toast.error("Escolha duas equipes distintas.");
      return;
    }
    try {
      await create.mutateAsync({
        championship_id: championshipId,
        home_team_id: homeId,
        away_team_id: awayId,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        venue: venue || null,
        phase: phase || null,
      });
      toast.success("Partida criada.");
      onOpenChange(false);
    } catch (e) {
      toast.error("Falha ao criar partida.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova partida</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Mandante
              </Label>
              <Select value={homeId} onValueChange={setHomeId}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Visitante
              </Label>
              <Select value={awayId} onValueChange={setAwayId}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Data e hora
              </Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Fase / Rodada
              </Label>
              <Input
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                placeholder="Ex.: Rodada 3"
                className="mt-1 h-9"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Local
            </Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Estádio / Arena"
              className="mt-1 h-9"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-neon text-neon-foreground hover:bg-neon/90"
            onClick={handleCreate}
            disabled={create.isPending}
          >
            Criar partida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="card-arena grid place-items-center p-8 text-center">
      <p className="font-display text-sm font-bold">{title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}
