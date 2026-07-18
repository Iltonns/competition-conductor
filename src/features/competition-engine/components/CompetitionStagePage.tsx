import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarRange, CheckCircle2, Eye, Plus, Shuffle, Users } from "lucide-react";
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
import { useTeams } from "@/features/teams/hooks/useTeams";
import {
  useAssignTeamToStage,
  useCommitFixtureGeneration,
  useCompetitionGroups,
  useCompetitionRounds,
  useCompetitionSettings,
  useCompetitionStage,
  useCompetitionStages,
  useConfirmStageAdvancement,
  useGenerateCompetitionGroups,
  useSaveCompetitionGroup,
  useStageStandings,
  useStageTeams,
} from "../hooks/useCompetitionEngine";
import {
  computeGroupAdvancement,
  findFixtureConflicts,
  generateRoundRobin,
} from "../utils/competition-engine";
import type { FixtureDraft, QualifiedTeam } from "../types/competition.types";

export function CompetitionStagePage({
  championshipId,
  stageId,
}: {
  championshipId: string;
  stageId: string;
}) {
  const stage = useCompetitionStage(championshipId, stageId);
  const stages = useCompetitionStages(championshipId);
  const settings = useCompetitionSettings(championshipId);
  const groups = useCompetitionGroups(championshipId, stageId);
  const rounds = useCompetitionRounds(championshipId, stageId);
  const stageTeams = useStageTeams(championshipId, stageId);
  const standings = useStageStandings(championshipId, stageId);
  const championshipTeams = useTeams(championshipId);
  const saveGroup = useSaveCompetitionGroup(championshipId, stageId);
  const generateGroups = useGenerateCompetitionGroups(championshipId, stageId);
  const assign = useAssignTeamToStage(championshipId, stageId);
  const commit = useCommitFixtureGeneration(championshipId);
  const advance = useConfirmStageAdvancement(championshipId);
  const [teamId, setTeamId] = useState("");
  const [groupId, setGroupId] = useState<string>("none");
  const [generationGroup, setGenerationGroup] = useState<string>("none");
  const [preview, setPreview] = useState<FixtureDraft[] | null>(null);
  const [firstKickoff, setFirstKickoff] = useState("");
  const [intervalHours, setIntervalHours] = useState(168);
  const [advancementPreview, setAdvancementPreview] = useState<QualifiedTeam[] | null>(null);

  const availableTeams = championshipTeams.data?.map((entry) => entry.team) ?? [];
  const nextStage = stages.data
    ?.filter((item) => item.status !== "archived" && item.sequence > (stage.data?.sequence ?? 0))
    .sort((a, b) => a.sequence - b.sequence)[0];
  const qualifiers = useMemo(() => {
    if (!stage.data || !standings.data) return [];
    const grouped = new Map<string | null, string[]>();
    for (const row of standings.data)
      grouped.set(row.group_id, [...(grouped.get(row.group_id) ?? []), row.team_id]);
    return computeGroupAdvancement(
      stage.data.id,
      [...grouped].map(([scope, teamIds]) => ({ groupId: scope, teamIds })),
      settings.data?.qualifiers_per_group ?? 1,
    );
  }, [settings.data?.qualifiers_per_group, stage.data, standings.data]);

  if (stage.isLoading) return <Skeleton className="h-[500px]" />;
  if (!stage.data) return <div className="card-arena p-8">Fase não encontrada.</div>;

  const createConfiguredGroups = async () => {
    const count = settings.data?.group_count ?? 0;
    if (!count) return toast.error("Defina a quantidade de grupos no regulamento.");
    try {
      await generateGroups.mutateAsync(count);
      toast.success("Grupos criados de forma reproduzível.");
    } catch {
      toast.error("Não foi possível criar todos os grupos.");
    }
  };

  const prepareFixtures = () => {
    const scope = generationGroup === "none" ? null : generationGroup;
    const ids = (stageTeams.data ?? [])
      .filter((entry) => entry.group_id === scope)
      .map((entry) => entry.team_id);
    const fixtures = generateRoundRobin(ids, (settings.data?.legs ?? 1) as 1 | 2);
    const conflicts = findFixtureConflicts(fixtures);
    if (ids.length < 2) return toast.error("Distribua ao menos duas equipes neste escopo.");
    if (conflicts.length) return toast.error(conflicts[0]);
    setFirstKickoff(
      stage.data.starts_at
        ? `${stage.data.starts_at}T19:00`
        : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    );
    setIntervalHours(Math.max(settings.data?.minimum_rest_hours ?? 24, 24));
    setPreview(fixtures);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/championships/$id/structure" params={{ id: championshipId }}>
              <ArrowLeft className="h-4 w-4" /> Estrutura
            </Link>
          </Button>
          <h2 className="mt-2 font-display text-lg font-extrabold">{stage.data.name}</h2>
          <p className="text-xs text-muted-foreground">
            {stage.data.stage_type} · sequência {stage.data.sequence} · {stage.data.status}
          </p>
        </div>
        {stage.data.status === "finished" && nextStage && (
          <Button onClick={() => setAdvancementPreview(qualifiers)} disabled={!qualifiers.length}>
            <CheckCircle2 className="h-4 w-4" /> Preparar avanço
          </Button>
        )}
      </header>

      <section className="card-arena p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold">Grupos</h3>
            <p className="text-[10px] text-muted-foreground">
              Distribuição manual; sorteio aleatório não é oferecido sem regra versionada.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={createConfiguredGroups}>
              Criar da configuração
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const name = prompt("Nome do grupo:");
                if (!name?.trim()) return;
                try {
                  await saveGroup.mutateAsync({
                    groupId: null,
                    name,
                    sequence: (groups.data?.length ?? 0) + 1,
                  });
                } catch {
                  toast.error("Grupo duplicado ou inválido.");
                }
              }}
            >
              <Plus className="h-3 w-3" /> Grupo
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {groups.data?.map((group) => (
            <span key={group.id} className="rounded-full border border-white/10 px-3 py-1 text-xs">
              {group.name}
            </span>
          ))}
          {!groups.data?.length && (
            <span className="text-xs text-muted-foreground">
              Fase sem grupos: equipes ficam no escopo geral.
            </span>
          )}
        </div>
      </section>

      <section className="card-arena p-4">
        <h3 className="font-display text-sm font-bold">Equipes da fase</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem grupo</SelectItem>
              {groups.data?.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!teamId || assign.isPending}
            onClick={async () => {
              try {
                await assign.mutateAsync({ teamId, groupId: groupId === "none" ? null : groupId });
                setTeamId("");
                toast.success("Equipe distribuída.");
              } catch {
                toast.error("Equipe ou grupo inválido.");
              }
            }}
          >
            <Users className="h-4 w-4" /> Distribuir
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stageTeams.data?.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/10 p-3 text-xs">
              <strong>{entry.team_short_name || entry.team_name}</strong>
              <p className="text-muted-foreground">
                {groups.data?.find((group) => group.id === entry.group_id)?.name ?? "Sem grupo"}
                {entry.seed ? ` · seed ${entry.seed}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-arena p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold">Rodadas e confrontos</h3>
            <p className="text-[10px] text-muted-foreground">
              Preview obrigatório; uma nova geração nunca apaga partidas existentes.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={generationGroup} onValueChange={setGenerationGroup}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Escopo geral</SelectItem>
                {groups.data?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={prepareFixtures}>
              <Eye className="h-4 w-4" /> Gerar preview
            </Button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {rounds.data?.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs"
            >
              <span>
                <CalendarRange className="mr-2 inline h-3 w-3" />
                {round.name}
              </span>
              <span className="text-muted-foreground">
                {round.starts_at ? new Date(round.starts_at).toLocaleString("pt-BR") : "Sem data"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <FixturePreview
        open={preview !== null}
        fixtures={preview ?? []}
        firstKickoff={firstKickoff}
        intervalHours={intervalHours}
        minimumRest={settings.data?.minimum_rest_hours ?? 24}
        onKickoff={setFirstKickoff}
        onInterval={setIntervalHours}
        onClose={() => setPreview(null)}
        onConfirm={async () => {
          if (!preview || !firstKickoff) return;
          try {
            await commit.mutateAsync({
              championshipId,
              stageId,
              groupId: generationGroup === "none" ? null : generationGroup,
              clientRequestId: crypto.randomUUID(),
              fixtures: preview,
              firstKickoff: new Date(firstKickoff).toISOString(),
              roundIntervalHours: intervalHours,
            });
            toast.success("Confrontos persistidos e geração versionada.");
            setPreview(null);
          } catch {
            toast.error("A geração viola descanso, escopo ou confronto existente.");
          }
        }}
        pending={commit.isPending}
      />
      <AdvancementPreview
        open={advancementPreview !== null}
        teams={advancementPreview ?? []}
        nextStageName={nextStage?.name ?? ""}
        teamNames={new Map(availableTeams.map((team) => [team.id, team.name]))}
        onClose={() => setAdvancementPreview(null)}
        pending={advance.isPending}
        onConfirm={async () => {
          if (!nextStage || !advancementPreview) return;
          try {
            await advance.mutateAsync({
              championshipId,
              sourceStageId: stageId,
              targetStageId: nextStage.id,
              clientRequestId: crypto.randomUUID(),
              qualifiedTeams: advancementPreview,
            });
            toast.success("Avanço confirmado, auditado e idempotente.");
            setAdvancementPreview(null);
          } catch {
            toast.error("O avanço já existe ou as fases não estão no estado correto.");
          }
        }}
      />
    </div>
  );
}

function FixturePreview({
  open,
  fixtures,
  firstKickoff,
  intervalHours,
  minimumRest,
  onKickoff,
  onInterval,
  onClose,
  onConfirm,
  pending,
}: {
  open: boolean;
  fixtures: FixtureDraft[];
  firstKickoff: string;
  intervalHours: number;
  minimumRest: number;
  onKickoff: (value: string) => void;
  onInterval: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview da geração</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Primeiro jogo</Label>
            <Input
              className="mt-1"
              type="datetime-local"
              value={firstKickoff}
              onChange={(event) => onKickoff(event.target.value)}
            />
          </div>
          <div>
            <Label>Intervalo entre rodadas (horas)</Label>
            <Input
              className="mt-1"
              type="number"
              min={minimumRest}
              value={intervalHours}
              onChange={(event) => onInterval(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-auto rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2">Rodada</th>
                <th>Turno</th>
                <th>Mandante</th>
                <th>Visitante</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => (
                <tr
                  key={`${fixture.leg}-${fixture.homeTeamId}-${fixture.awayTeamId}`}
                  className="border-t border-white/5 text-center"
                >
                  <td className="p-2">{fixture.roundNumber}</td>
                  <td>{fixture.leg}</td>
                  <td>{fixture.homeTeamId}</td>
                  <td>{fixture.awayTeamId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending || !firstKickoff || intervalHours < minimumRest}
          >
            <Shuffle className="h-4 w-4" /> Confirmar geração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function AdvancementPreview({
  open,
  teams,
  nextStageName,
  teamNames,
  onClose,
  onConfirm,
  pending,
}: {
  open: boolean;
  teams: QualifiedTeam[];
  nextStageName: string;
  teamNames: Map<string, string>;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview do avanço para {nextStageName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {teams.map((team) => (
            <div
              key={team.teamId}
              className="flex justify-between rounded-lg border border-white/10 px-3 py-2 text-xs"
            >
              <span>{teamNames.get(team.teamId) ?? team.teamId}</span>
              <span>
                posição {team.sourcePosition} · seed {team.seed}
              </span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            Confirmar avanço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
