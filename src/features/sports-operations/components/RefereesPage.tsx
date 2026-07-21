import { useState } from "react";
import { CalendarClock, Flag, Plus } from "lucide-react";
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
  useReferees,
} from "../hooks/useSportsOperations";

export function RefereesPage({ championshipId }: { championshipId: string }) {
  const referees = useReferees(championshipId);
  const assignments = useRefereeAssignments(championshipId);
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
  if (referees.isLoading || assignments.isLoading || matches.isLoading)
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
              <Badge variant="outline">{assignment.confirmation_status}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
