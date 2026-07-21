import { useState } from "react";
import { CalendarClock, Check, Flag, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches } from "@/features/matches/hooks/useMatches";
import {
  useRefereeActions,
  useRefereeAssignments,
  useRefereeUnavailability,
  useReferees,
} from "../hooks/useSportsOperations";

export function RefereesPage({ championshipId }: { championshipId: string }) {
  const referees = useReferees(championshipId);
  const assignments = useRefereeAssignments(championshipId);
  const unavailability = useRefereeUnavailability(championshipId);
  const matches = useMatches(championshipId);
  const actions = useRefereeActions(championshipId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("main");
  const [refereeId, setRefereeId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState("main");
  const [fee, setFee] = useState("0");
  const [unavailableRefereeId, setUnavailableRefereeId] = useState("");
  const [unavailableFrom, setUnavailableFrom] = useState("");
  const [unavailableUntil, setUnavailableUntil] = useState("");
  const [unavailableReason, setUnavailableReason] = useState("");
  if (referees.isLoading || assignments.isLoading || unavailability.isLoading || matches.isLoading)
    return <Skeleton className="h-96" />;
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.16em] text-neon">Operação esportiva</p>
        <h2 className="font-display text-xl font-extrabold">Arbitragem</h2>
        <p className="text-xs text-muted-foreground">
          Cadastro, escala, confirmação e conflito de horário.
        </p>
      </header>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <section className="card-arena p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <Plus className="h-4 w-4 text-neon" /> Novo árbitro
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Função padrão</Label>
              <select
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="main">Árbitro principal</option>
                <option value="assistant">Assistente</option>
                <option value="fourth">Quarto árbitro</option>
                <option value="table">Mesário</option>
              </select>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Button
            className="mt-3"
            disabled={!name.trim() || actions.save.isPending}
            onClick={async () => {
              try {
                await actions.save.mutateAsync({
                  id: null,
                  payload: {
                    full_name: name,
                    default_role: role,
                    email,
                    phone,
                    default_fee: 0,
                    availability: {},
                  },
                });
                setName("");
                setEmail("");
                setPhone("");
                toast.success("Árbitro cadastrado.");
              } catch {
                toast.error("Não foi possível cadastrar.");
              }
            }}
          >
            Cadastrar
          </Button>
        </section>
        <section className="card-arena p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold">
            <CalendarClock className="h-4 w-4 text-neon" /> Designar partida
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
            >
              <option value="">Selecione a partida</option>
              {(matches.data ?? []).map((match) => (
                <option key={match.id} value={match.id}>
                  {match.home_team?.name} × {match.away_team?.name} —{" "}
                  {match.scheduled_at
                    ? new Date(match.scheduled_at).toLocaleString("pt-BR")
                    : "sem data"}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={refereeId}
              onChange={(e) => setRefereeId(e.target.value)}
            >
              <option value="">Selecione o árbitro</option>
              {(referees.data ?? [])
                .filter((referee) => referee.status === "active")
                .map((referee) => (
                  <option key={referee.id} value={referee.id}>
                    {referee.full_name}
                  </option>
                ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={assignmentRole}
              onChange={(e) => setAssignmentRole(e.target.value)}
            >
              <option value="main">Principal</option>
              <option value="assistant_1">Assistente 1</option>
              <option value="assistant_2">Assistente 2</option>
              <option value="fourth">Quarto árbitro</option>
              <option value="table">Mesário</option>
            </select>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="Valor previsto"
            />
          </div>
          <Button
            className="mt-3"
            disabled={!matchId || !refereeId || actions.assign.isPending}
            onClick={async () => {
              try {
                await actions.assign.mutateAsync({
                  matchId,
                  refereeId,
                  role: assignmentRole,
                  fee: Number(fee),
                });
                toast.success("Designação salva.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Conflito na designação.");
              }
            }}
          >
            <Flag className="h-4 w-4" /> Designar
          </Button>
        </section>
      </div>
      <section className="card-arena p-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold">
          <CalendarClock className="h-4 w-4 text-neon" /> Registrar indisponibilidade
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={unavailableRefereeId}
            onChange={(event) => setUnavailableRefereeId(event.target.value)}
          >
            <option value="">Selecione o árbitro</option>
            {(referees.data ?? []).map((referee) => (
              <option key={referee.id} value={referee.id}>
                {referee.full_name}
              </option>
            ))}
          </select>
          <Input
            aria-label="Início da indisponibilidade"
            type="datetime-local"
            value={unavailableFrom}
            onChange={(event) => setUnavailableFrom(event.target.value)}
          />
          <Input
            aria-label="Fim da indisponibilidade"
            type="datetime-local"
            value={unavailableUntil}
            onChange={(event) => setUnavailableUntil(event.target.value)}
          />
          <Input
            value={unavailableReason}
            onChange={(event) => setUnavailableReason(event.target.value)}
            placeholder="Motivo (opcional)"
          />
        </div>
        <Button
          className="mt-3"
          disabled={
            !unavailableRefereeId ||
            !unavailableFrom ||
            !unavailableUntil ||
            actions.saveUnavailability.isPending
          }
          onClick={async () => {
            try {
              await actions.saveUnavailability.mutateAsync({
                refereeId: unavailableRefereeId,
                startsAt: new Date(unavailableFrom).toISOString(),
                endsAt: new Date(unavailableUntil).toISOString(),
                reason: unavailableReason,
              });
              setUnavailableFrom("");
              setUnavailableUntil("");
              setUnavailableReason("");
              toast.success("Indisponibilidade registrada.");
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Conflito com uma designação existente.",
              );
            }
          }}
        >
          Registrar período
        </Button>
        <div className="mt-4 space-y-2">
          {(unavailability.data ?? []).map((period) => (
            <div
              key={period.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-xs"
            >
              <span>
                {period.referee?.full_name ?? "Árbitro"} ·{" "}
                {new Date(period.starts_at).toLocaleString("pt-BR")} até{" "}
                {new Date(period.ends_at).toLocaleString("pt-BR")}
                {period.reason ? ` · ${period.reason}` : ""}
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remover indisponibilidade"
                onClick={async () => {
                  try {
                    await actions.deleteUnavailability.mutateAsync(period.id);
                    toast.success("Indisponibilidade removida.");
                  } catch {
                    toast.error("Não foi possível remover o período.");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className="card-arena overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <h3 className="font-display text-sm font-bold">Quadro de arbitragem</h3>
        </div>
        {(referees.data ?? []).map((referee) => (
          <div
            key={referee.id}
            className="flex items-center justify-between border-b border-white/5 px-4 py-3"
          >
            <div>
              <strong className="text-sm">{referee.full_name}</strong>
              <p className="text-[10px] text-muted-foreground">
                {referee.email || referee.phone || "Sem contato"}
              </p>
            </div>
            <Badge variant={referee.status === "active" ? "default" : "secondary"}>
              {referee.default_role} · {referee.status}
            </Badge>
          </div>
        ))}
        {(referees.data?.length ?? 0) === 0 && (
          <p className="p-8 text-center text-xs text-muted-foreground">
            Nenhum árbitro cadastrado.
          </p>
        )}
      </section>
      <section className="card-arena p-4">
        <h3 className="font-display text-sm font-bold">Designações recentes</h3>
        <div className="mt-3 space-y-2">
          {(assignments.data ?? []).map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border border-white/10 p-3 text-xs"
            >
              <span>
                {assignment.referee?.full_name ?? "Árbitro"} · {assignment.assignment_role}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{assignment.confirmation_status}</Badge>
                {assignment.confirmation_status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await actions.setAssignmentStatus.mutateAsync({
                            assignmentId: assignment.id,
                            status: "confirmed",
                          });
                          toast.success("Designação confirmada.");
                        } catch (error) {
                          toast.error(
                            error instanceof Error ? error.message : "Conflito de agenda.",
                          );
                        }
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        const note = window.prompt("Motivo da recusa:");
                        if (!note?.trim()) return;
                        await actions.setAssignmentStatus.mutateAsync({
                          assignmentId: assignment.id,
                          status: "declined",
                          note,
                        });
                        toast.success("Designação recusada.");
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Recusar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
