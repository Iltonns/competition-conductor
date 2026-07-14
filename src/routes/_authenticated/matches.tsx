import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Flag,
  Goal,
  MapPin,
  Plus,
  Search,
  Square,
  Timer,
} from "lucide-react";
import {
  MatchRow,
  SectionHeader,
  TeamCrest,
} from "@/components/arena/arena-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MATCH_EVENTS, TEAMS, UPCOMING_MATCHES } from "@/data/arena-demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Partidas e súmula · IS Arena" }] }),
  component: MatchesPage,
});

const STATUS_FILTERS = [
  "Todas",
  "Agendadas",
  "Em andamento",
  "Finalizadas",
] as const;

function MatchesPage() {
  const [filter, setFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("Todas");
  const [tab, setTab] = useState<"Eventos" | "Escalações" | "Estatísticas">(
    "Eventos",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div
          className="compact-scrollbar flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Filtrar partidas"
        >
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filter === status}
              onClick={() => setFilter(status)}
              className={cn(
                "h-8 shrink-0 rounded-lg border px-3 text-[9px] font-semibold transition",
                filter === status
                  ? "border-neon/30 bg-neon text-neon-foreground"
                  : "border-white/[0.07] bg-white/[0.025] text-muted-foreground hover:text-foreground",
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 xl:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar partida..."
              aria-label="Buscar partida"
              className="h-8 border-white/[0.07] bg-white/[0.025] pl-9 text-[9px]"
            />
          </div>
          <Button className="h-8 shrink-0 bg-neon px-3 text-[9px] text-neon-foreground hover:bg-neon/90">
            <Plus className="h-3.5 w-3.5" /> Nova partida
          </Button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
        <div className="space-y-4">
          <div className="card-arena p-4">
            <SectionHeader
              title="Próximas partidas"
              action="Calendário completo"
            />
            <div className="mt-3 space-y-2">
              {UPCOMING_MATCHES.map((match) => (
                <MatchRow key={match.id} {...match} compact />
              ))}
            </div>
          </div>

          <div className="card-arena p-4">
            <SectionHeader title="Operação da rodada" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ActionCard
                icon={CalendarClock}
                value="2"
                label="Jogos agendados"
                tone="text-sky-300 bg-sky-400/10"
              />
              <ActionCard
                icon={FileText}
                value="1"
                label="Súmula pendente"
                tone="text-amber-300 bg-amber-400/10"
              />
              <ActionCard
                icon={CheckCircle2}
                value="6"
                label="Finalizadas"
                tone="text-emerald-300 bg-emerald-400/10"
              />
              <ActionCard
                icon={Flag}
                value="4"
                label="Árbitros escalados"
                tone="text-violet-300 bg-violet-400/10"
              />
            </div>
          </div>
        </div>

        <div className="card-arena overflow-hidden">
          <div className="border-b border-white/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />{" "}
                2º tempo
              </span>
              <span className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                Semifinal · Jogo de ida
              </span>
              <button
                className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-muted-foreground"
                aria-label="Relatório da súmula"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <ScoreTeam team={TEAMS.amazonas} />
              <div className="text-center">
                <strong className="number-tabular font-display text-4xl font-extrabold tracking-[-0.07em] sm:text-5xl">
                  3 - 1
                </strong>
                <span className="mt-1 flex items-center justify-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-neon">
                  <Timer className="h-3 w-3" /> 89'
                </span>
              </div>
              <ScoreTeam team={TEAMS.guarani} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> 05 JUL · 15:00
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Arena da Montanha
              </span>
            </div>
          </div>

          <div className="flex border-b border-white/[0.06] px-3">
            {(["Eventos", "Escalações", "Estatísticas"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "relative h-11 flex-1 text-[8px] font-semibold uppercase tracking-[0.1em] transition",
                    tab === item
                      ? "text-neon after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-neon"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <div className="p-4">
            {tab === "Eventos" && (
              <div className="divide-y divide-white/[0.055]">
                {MATCH_EVENTS.map((event) => (
                  <div
                    key={`${event.minute}-${event.player}`}
                    className="grid grid-cols-[36px_28px_1fr] items-center gap-2 py-2.5"
                  >
                    <strong className="number-tabular text-[10px]">
                      {event.minute}
                    </strong>
                    <EventIcon type={event.type} />
                    <span className="min-w-0">
                      <span className="block truncate text-[10px] font-semibold">
                        {event.player}
                      </span>
                      <span className="block text-[8px] text-muted-foreground">
                        {event.team.name}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "Escalações" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[TEAMS.amazonas, TEAMS.guarani].map((team) => (
                  <div
                    key={team.id}
                    className="rounded-xl border border-white/[0.06] bg-black/15 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <TeamCrest team={team} size="sm" />
                      <strong className="text-[10px]">{team.name}</strong>
                    </div>
                    <ol className="mt-3 space-y-2 text-[9px] text-muted-foreground">
                      {[
                        "Goleiro titular",
                        "Defensor central",
                        "Meio-campista",
                        "Atacante",
                      ].map((player, index) => (
                        <li key={player} className="flex justify-between">
                          <span>
                            {index + 1}. {player}
                          </span>
                          <span className="text-foreground/45">Titular</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {tab === "Estatísticas" && (
              <div className="space-y-4">
                <StatBar label="Posse de bola" home={58} away={42} />
                <StatBar label="Finalizações" home={14} away={8} max={18} />
                <StatBar label="Chutes no gol" home={7} away={3} max={10} />
                <StatBar label="Escanteios" home={6} away={2} max={8} />
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
              <Button className="h-9 bg-emerald-400/10 px-2 text-[8px] text-emerald-300 hover:bg-emerald-400/15">
                <Goal className="h-3.5 w-3.5" /> Gol
              </Button>
              <Button className="h-9 bg-amber-400/10 px-2 text-[8px] text-amber-300 hover:bg-amber-400/15">
                <Square className="h-3.5 w-3.5 fill-current" /> Cartão
              </Button>
              <Button className="h-9 bg-sky-400/10 px-2 text-[8px] text-sky-300 hover:bg-sky-400/15">
                <ArrowLeftRight className="h-3.5 w-3.5" /> Substituição
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScoreTeam({ team }: { team: typeof TEAMS.amazonas }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <TeamCrest team={team} size="lg" showStars />
      <strong className="max-w-full truncate text-center text-[10px] sm:text-xs">
        {team.name}
      </strong>
    </div>
  );
}

function EventIcon({ type }: { type: (typeof MATCH_EVENTS)[number]["type"] }) {
  const styles = {
    goal: "bg-emerald-400/10 text-emerald-300",
    yellow: "bg-amber-400/10 text-amber-300",
    substitution: "bg-sky-400/10 text-sky-300",
  };
  const icons = {
    goal: <Circle className="h-3.5 w-3.5 fill-current" />,
    yellow: <Square className="h-3.5 w-3.5 fill-current" />,
    substitution: <ArrowLeftRight className="h-3.5 w-3.5" />,
  };
  return (
    <span
      className={cn("grid h-7 w-7 place-items-center rounded-lg", styles[type])}
    >
      {icons[type]}
    </span>
  );
}

function ActionCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof CalendarClock;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
      <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <strong className="mt-3 block font-display text-xl font-extrabold">
        {value}
      </strong>
      <span className="text-[8px] text-muted-foreground">{label}</span>
    </article>
  );
}

function StatBar({
  label,
  home,
  away,
  max = 100,
}: {
  label: string;
  home: number;
  away: number;
  max?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 grid grid-cols-[28px_1fr_28px] items-center gap-2 text-[9px]">
        <strong className="text-neon">{home}</strong>
        <span className="text-center text-muted-foreground">{label}</span>
        <strong className="text-right text-sky-300">{away}</strong>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="flex h-1.5 justify-end overflow-hidden rounded-l-full bg-white/[0.045]">
          <span
            className="h-full rounded-full bg-neon"
            style={{ width: `${Math.min((home / max) * 100, 100)}%` }}
          />
        </div>
        <div className="h-1.5 overflow-hidden rounded-r-full bg-white/[0.045]">
          <span
            className="block h-full rounded-full bg-sky-300"
            style={{ width: `${Math.min((away / max) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
