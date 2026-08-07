import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Goal, Square, Trash2 } from "lucide-react";
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
import { useCreateMatchEvent, useDeleteMatchEvent } from "@/features/matches/hooks/useMatches";
import type { MatchEventRow, MatchEventType, MatchWithTeams } from "@/features/matches/api/matches";
import { useEligibleAthletes, useSubstitutions } from "../hooks/useSportsOperations";
import type { SubstitutionWithAthletes } from "../api/sports-operations";

type QuickMode = "goal" | "card" | "substitution";

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

/** Cor do marcador na linha do tempo, seguindo a paleta do mockup. */
const EVENT_COLOR: Partial<Record<MatchEventType, string>> = {
  goal: "oklch(60% 0.15 150)",
  own_goal: "oklch(58% 0.19 25)",
  penalty_goal: "oklch(60% 0.15 150)",
  penalty_missed: "oklch(58% 0.19 25)",
  yellow_card: "oklch(80% 0.13 85)",
  red_card: "oklch(58% 0.19 25)",
  substitution: "oklch(47% 0.17 258)",
  injury: "oklch(58% 0.19 25)",
};

const eventColor = (type: MatchEventType) => EVENT_COLOR[type] ?? "oklch(60% 0.02 258)";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Item unificado da linha do tempo — eventos e substituições no mesmo lugar. */
type TimelineItem = {
  key: string;
  minute: number | null;
  color: string;
  label: string;
  detail: string;
  onRemove?: () => void;
};

/**
 * Bloco de registro rápido da súmula (mockup "Súmula (mobile)"): placar,
 * três ações grandes e uma lista única de eventos.
 *
 * Gol e cartão gravam via `record_match_event`; substituição usa o mesmo
 * fluxo do editor completo (`saveSubstitution`), para não criar um segundo
 * caminho de escrita para o mesmo dado.
 */
export function MatchQuickActions({
  championshipId,
  match,
  events,
  locked,
}: {
  championshipId: string;
  match: MatchWithTeams;
  events: MatchEventRow[];
  locked: boolean;
}) {
  const [mode, setMode] = useState<QuickMode | null>(null);
  const deleteEvent = useDeleteMatchEvent(championshipId, match.id);
  const substitutions = useSubstitutions(championshipId, match.id);

  const teamName = (teamId: string | null) =>
    teamId === match.home_team_id
      ? (match.home_team?.name ?? "Mandante")
      : teamId === match.away_team_id
        ? (match.away_team?.name ?? "Visitante")
        : "—";

  const timeline = useMemo<TimelineItem[]>(() => {
    const fromEvents: TimelineItem[] = events.map((event) => ({
      key: `event-${event.id}`,
      minute: event.minute,
      color: eventColor(event.type),
      label: EVENT_LABEL[event.type],
      detail: [teamName(event.team_id), event.note].filter(Boolean).join(" · "),
      onRemove: locked
        ? undefined
        : async () => {
            try {
              await deleteEvent.mutateAsync(event.id);
              toast.success("Evento removido.");
            } catch {
              toast.error("Não foi possível remover o evento.");
            }
          },
    }));

    const fromSubs: TimelineItem[] = (substitutions.data ?? []).map(
      (item: SubstitutionWithAthletes) => ({
        key: `sub-${item.id}`,
        minute: item.minute,
        color: eventColor("substitution"),
        label: "Substituição",
        detail: `Sai ${item.athlete_out?.full_name ?? "—"} · Entra ${item.athlete_in?.full_name ?? "—"}`,
        onRemove: locked ? undefined : () => substitutions.remove.mutate(item.id),
      }),
    );

    return [...fromEvents, ...fromSubs].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, substitutions.data, locked]);

  return (
    <section className="card-arena p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">Registro rápido</h3>
        {match.status === "live" && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
            AO VIVO
          </span>
        )}
      </div>

      {/* Identificação das equipes. O placar não se repete aqui: o do topo é o
          placar oficial da súmula, editável, e pode divergir do da partida. */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-4">
        <TeamBadge name={match.home_team?.name ?? "Mandante"} tone="oklch(47% 0.17 258)" />
        <span className="text-xs font-bold text-muted-foreground">x</span>
        <TeamBadge name={match.away_team?.name ?? "Visitante"} tone="oklch(55% 0.09 250)" />
      </div>

      {/* Três ações grandes */}
      {!locked && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickButton
            icon={Goal}
            label="Gol"
            color="oklch(60% 0.15 150)"
            onClick={() => setMode("goal")}
          />
          <QuickButton
            icon={Square}
            label="Cartão"
            color="oklch(80% 0.13 85)"
            onClick={() => setMode("card")}
          />
          <QuickButton
            icon={ArrowRightLeft}
            label="Substituição"
            color="oklch(47% 0.17 258)"
            onClick={() => setMode("substitution")}
          />
        </div>
      )}

      {/* Linha do tempo unificada */}
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">
        Eventos registrados
      </p>
      <div className="mt-2">
        {timeline.length === 0 && (
          <p className="py-4 text-xs text-muted-foreground">Nenhum evento registrado.</p>
        )}
        {timeline.map((item) => (
          <div key={item.key} className="flex items-center gap-3 border-t border-border py-2.5">
            <span className="number-tabular w-8 text-xs font-bold text-muted-foreground">
              {item.minute == null ? "—" : `${item.minute}'`}
            </span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{item.label}</p>
              {item.detail && (
                <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
              )}
            </div>
            {item.onRemove && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                aria-label={`Remover ${item.label}`}
                onClick={item.onRemove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <QuickEventDialog
        mode={mode}
        championshipId={championshipId}
        match={match}
        substitutions={substitutions}
        onClose={() => setMode(null)}
      />
    </section>
  );
}

function TeamBadge({ name, tone }: { name: string; tone: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <span
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-full font-display text-[11px] font-bold text-white"
        style={{ background: tone }}
      >
        {initials(name)}
      </span>
      <p className="mt-1.5 truncate text-xs font-bold">{name}</p>
    </div>
  );
}

function QuickButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: typeof Goal;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[58px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[13px] font-bold transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" style={{ color }} />
      {label}
    </button>
  );
}

function QuickEventDialog({
  mode,
  championshipId,
  match,
  substitutions,
  onClose,
}: {
  mode: QuickMode | null;
  championshipId: string;
  match: MatchWithTeams;
  substitutions: ReturnType<typeof useSubstitutions>;
  onClose: () => void;
}) {
  const [teamId, setTeamId] = useState(match.home_team_id ?? match.away_team_id ?? "");
  const [athleteId, setAthleteId] = useState("");
  const [athleteInId, setAthleteInId] = useState("");
  const [minute, setMinute] = useState("");
  const [cardType, setCardType] = useState<"yellow_card" | "red_card">("yellow_card");

  const createEvent = useCreateMatchEvent(championshipId, match.id);
  const eligible = useEligibleAthletes(championshipId, teamId);
  const athletes = eligible.data ?? [];

  // Trocar de equipe invalida os atletas escolhidos.
  useEffect(() => {
    setAthleteId("");
    setAthleteInId("");
  }, [teamId]);

  useEffect(() => {
    if (mode) {
      setMinute("");
      setAthleteId("");
      setAthleteInId("");
    }
  }, [mode]);

  const teamOptions = [
    match.home_team ? { id: match.home_team.id, name: match.home_team.name } : null,
    match.away_team ? { id: match.away_team.id, name: match.away_team.name } : null,
  ].filter((option): option is { id: string; name: string } => option !== null);

  const title =
    mode === "goal" ? "Registrar gol" : mode === "card" ? "Registrar cartão" : "Substituição";

  const canSubmit =
    mode === "substitution" ? Boolean(teamId && athleteId && athleteInId) : Boolean(teamId);

  const submit = async () => {
    try {
      if (mode === "substitution") {
        await substitutions.save.mutateAsync({
          teamId,
          athleteOutId: athleteId,
          athleteInId,
          minute: minute ? Number(minute) : 0,
          period: "second_half",
        });
        toast.success("Substituição registrada.");
      } else {
        await createEvent.mutateAsync({
          match_id: match.id,
          team_id: teamId,
          athlete_id: athleteId || null,
          type: mode === "goal" ? "goal" : cardType,
          minute: minute ? Number(minute) : null,
          note: null,
        });
        toast.success(mode === "goal" ? "Gol registrado." : "Cartão registrado.");
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar. Tente novamente.",
      );
    }
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Equipe como par de chips — um toque */}
          <div>
            <Label className="text-xs">Equipe</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {teamOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTeamId(option.id)}
                  className={
                    teamId === option.id
                      ? "truncate rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                      : "truncate rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  }
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {mode === "card" && (
            <div>
              <Label className="text-xs">Tipo de cartão</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(
                  [
                    ["yellow_card", "Amarelo"],
                    ["red_card", "Vermelho"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCardType(value)}
                    className={
                      cardType === value
                        ? "rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                        : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">
              {mode === "substitution" ? "Sai" : "Atleta"}
              {mode !== "substitution" && " (opcional)"}
            </Label>
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={eligible.isLoading ? "Carregando..." : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {athletes.map((athlete) => (
                  <SelectItem key={athlete.id} value={athlete.id}>
                    #{athlete.jersey_number ?? "—"} {athlete.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "substitution" && (
            <div>
              <Label className="text-xs">Entra</Label>
              <Select value={athleteInId} onValueChange={setAthleteInId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {athletes
                    .filter((athlete) => athlete.id !== athleteId)
                    .map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        #{athlete.jersey_number ?? "—"} {athlete.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Minuto</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              max={180}
              inputMode="numeric"
              value={minute}
              placeholder="—"
              onChange={(event) => setMinute(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || createEvent.isPending || substitutions.save.isPending}
          >
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
