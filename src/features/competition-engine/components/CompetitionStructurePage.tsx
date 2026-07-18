import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Archive, ChevronRight, Plus, Settings2, Workflow } from "lucide-react";
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
import {
  useArchiveCompetitionStage,
  useCompetitionStages,
  useSaveCompetitionStage,
} from "../hooks/useCompetitionEngine";
import type { CompetitionStage, StageInput } from "../types/engine-records.types";

export function CompetitionStructurePage({ championshipId }: { championshipId: string }) {
  const stages = useCompetitionStages(championshipId);
  const archive = useArchiveCompetitionStage(championshipId);
  const [editing, setEditing] = useState<CompetitionStage | null | undefined>(undefined);
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold">Fases, grupos e rodadas</h2>
          <p className="text-xs text-muted-foreground">
            Estrutura versionada do motor da competição.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/championships/$id/configuration" params={{ id: championshipId }}>
              <Settings2 className="h-4 w-4" /> Regulamento
            </Link>
          </Button>
          <Button onClick={() => setEditing(null)}>
            <Plus className="h-4 w-4" /> Nova fase
          </Button>
        </div>
      </header>
      {stages.isLoading && <Skeleton className="h-64" />}
      {!stages.isLoading && !stages.data?.length && (
        <div className="card-arena grid place-items-center p-12 text-center">
          <Workflow className="h-9 w-9 text-muted-foreground" />
          <h3 className="mt-2 font-display font-bold">Nenhuma fase configurada</h3>
          <p className="text-xs text-muted-foreground">
            Crie a primeira fase para distribuir equipes e gerar confrontos.
          </p>
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {stages.data?.map((stage) => (
          <article key={stage.id} className="card-arena p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Fase {stage.sequence}
                </span>
                <h3 className="font-display text-base font-bold">{stage.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stage.stage_type} · {stage.status}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px]">
                {stage.status}
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(stage)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={stage.status === "archived"}
                onClick={async () => {
                  const reason = prompt("Motivo do arquivamento:");
                  if (!reason?.trim()) return;
                  try {
                    await archive.mutateAsync({ stageId: stage.id, reason });
                    toast.success("Fase arquivada sem apagar o histórico.");
                  } catch {
                    toast.error("Não foi possível arquivar a fase.");
                  }
                }}
              >
                <Archive className="h-3 w-3" /> Arquivar
              </Button>
              <Button size="sm" asChild>
                <Link
                  to="/championships/$id/structure/stages/$stageId"
                  params={{ id: championshipId, stageId: stage.id }}
                >
                  Abrir <ChevronRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
      <StageDialog
        championshipId={championshipId}
        stage={editing}
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        nextSequence={(stages.data?.filter((stage) => stage.status !== "archived").length ?? 0) + 1}
      />
    </div>
  );
}

function StageDialog({
  championshipId,
  stage,
  open,
  onOpenChange,
  nextSequence,
}: {
  championshipId: string;
  stage: CompetitionStage | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextSequence: number;
}) {
  const save = useSaveCompetitionStage(championshipId);
  const [form, setForm] = useState<StageInput>({
    name: "",
    stage_type: "league",
    sequence: nextSequence,
    status: "draft",
    starts_at: null,
    ends_at: null,
    settings: {},
  });
  useEffect(() => {
    if (!open) return;
    setForm(
      stage
        ? {
            name: stage.name,
            stage_type: stage.stage_type as StageInput["stage_type"],
            sequence: stage.sequence,
            status: stage.status,
            starts_at: stage.starts_at,
            ends_at: stage.ends_at,
            settings: stage.settings,
          }
        : {
            name: "",
            stage_type: "league",
            sequence: nextSequence,
            status: "draft",
            starts_at: null,
            ends_at: null,
            settings: {},
          },
    );
  }, [open, stage, nextSequence]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{stage ? "Editar fase" : "Nova fase"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nome</Label>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={form.stage_type}
              onValueChange={(value) =>
                setForm({ ...form, stage_type: value as StageInput["stage_type"] })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="league">Pontos corridos</SelectItem>
                <SelectItem value="groups">Grupos</SelectItem>
                <SelectItem value="knockout">Eliminatória</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sequência</Label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              value={form.sequence}
              onChange={(event) => setForm({ ...form, sequence: Number(event.target.value) })}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="scheduled">Programada</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="finished">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data inicial</Label>
            <Input
              className="mt-1"
              type="date"
              value={form.starts_at ?? ""}
              onChange={(event) => setForm({ ...form, starts_at: event.target.value || null })}
            />
          </div>
          <div>
            <Label>Data final</Label>
            <Input
              className="mt-1"
              type="date"
              value={form.ends_at ?? ""}
              onChange={(event) => setForm({ ...form, ends_at: event.target.value || null })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={save.isPending || form.name.trim().length < 2}
            onClick={async () => {
              try {
                await save.mutateAsync({ stageId: stage?.id ?? null, payload: form });
                toast.success("Fase salva.");
                onOpenChange(false);
              } catch {
                toast.error("Verifique sequência, datas e travas da fase.");
              }
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
