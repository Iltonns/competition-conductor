import { useState } from "react";
import { Ban, Gavel } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeams } from "@/features/teams/hooks/useTeams";
import { useEligibleAthletes } from "../hooks/useSportsOperations";
import { useSanctionActions, useSanctions } from "../hooks/useSportsOperations";

export function SanctionsPage({ championshipId }: { championshipId: string }) {
  const sanctions = useSanctions(championshipId);
  const teams = useTeams(championshipId);
  const actions = useSanctionActions(championshipId);
  const [teamId, setTeamId] = useState("");
  const athletes = useEligibleAthletes(championshipId, teamId);
  const [athleteId, setAthleteId] = useState("");
  const [reason, setReason] = useState("");
  const [matches, setMatches] = useState("1");
  if (sanctions.isLoading || teams.isLoading) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[0.16em] text-neon">Disciplina</p>
        <h2 className="font-display text-xl font-extrabold">Sanções e suspensões</h2>
        <p className="text-xs text-muted-foreground">
          Cartões geram suspensões automáticas; decisões manuais exigem fundamento.
        </p>
      </header>
      <section className="card-arena p-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold">
          <Gavel className="h-4 w-4 text-neon" /> Nova sanção manual
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div>
            <Label>Equipe</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setAthleteId("");
              }}
            >
              <option value="">Selecione</option>
              {(teams.data ?? []).map(({ team }) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Atleta</Label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
            >
              <option value="">Equipe inteira</option>
              {(athletes.data ?? []).map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Partidas suspenso</Label>
            <Input
              type="number"
              min={0}
              value={matches}
              onChange={(e) => setMatches(e.target.value)}
            />
          </div>
          <div>
            <Label>Fundamento / justificativa</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <Button
          className="mt-3"
          disabled={!teamId || !reason.trim() || actions.save.isPending}
          onClick={async () => {
            try {
              await actions.save.mutateAsync({
                team_id: teamId,
                athlete_id: athleteId || null,
                sanction_type: "suspension",
                reason,
                matches_suspended: Number(matches),
                starts_at: new Date().toISOString(),
              });
              setReason("");
              toast.success("Sanção aplicada.");
            } catch {
              toast.error("Não foi possível aplicar a sanção.");
            }
          }}
        >
          <Ban className="h-4 w-4" /> Aplicar sanção
        </Button>
      </section>
      <section className="card-arena overflow-hidden">
        {(sanctions.data ?? []).map((sanction) => (
          <div
            key={sanction.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3"
          >
            <div>
              <strong className="text-sm">
                {sanction.athlete?.full_name ?? sanction.team?.name ?? "Participante"}
              </strong>
              <p className="text-[10px] text-muted-foreground">
                {sanction.reason} · {sanction.matches_suspended} partida(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sanction.status === "active" ? "destructive" : "secondary"}>
                {sanction.status}
              </Badge>
              {sanction.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const revocationReason = window.prompt("Justificativa para revogação:");
                    if (!revocationReason) return;
                    try {
                      await actions.revoke.mutateAsync({
                        id: sanction.id,
                        reason: revocationReason,
                      });
                      toast.success("Sanção revogada com auditoria.");
                    } catch {
                      toast.error("Falha ao revogar.");
                    }
                  }}
                >
                  Revogar
                </Button>
              )}
            </div>
          </div>
        ))}
        {(sanctions.data?.length ?? 0) === 0 && (
          <p className="p-8 text-center text-xs text-muted-foreground">
            Nenhuma sanção registrada.
          </p>
        )}
      </section>
    </div>
  );
}
