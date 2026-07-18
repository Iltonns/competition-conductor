import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { ChampionshipCard } from "@/features/championships/components/ChampionshipCard";
import { ChampionshipDialog } from "@/features/championships/components/ChampionshipDialog";
import { useChampionships } from "@/features/championships/hooks/useChampionships";
import { useDeleteChampionship } from "@/features/championships/hooks/useDeleteChampionship";
import type { Championship } from "@/features/championships/types/championship.types";
import { getChampionshipErrorMessage } from "@/features/championships/utils/championship-display";

export const Route = createFileRoute("/_authenticated/_organizer/championships")({
  head: () => ({ meta: [{ title: "Campeonatos · IS Arena" }] }),
  component: ChampionshipsPage,
});

function ChampionshipsPage() {
  const championships = useChampionships();
  const deleteMutation = useDeleteChampionship();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Championship | null>(null);
  const [deleting, setDeleting] = useState<Championship | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync({
        organizationId: deleting.organization_id,
        championshipId: deleting.id,
      });
      toast.success("Campeonato excluído.");
      setDeleting(null);
    } catch (error) {
      toast.error(getChampionshipErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">
            Seus campeonatos
          </h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Gerencie temporadas, período e visibilidade das competições.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-neon text-neon-foreground hover:bg-neon/90">
          <Plus className="h-4 w-4" /> Novo campeonato
        </Button>
      </div>

      {championships.isLoading && <ChampionshipsSkeleton />}

      {championships.error && !championships.isLoading && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os campeonatos."
          description={getChampionshipErrorMessage(championships.error)}
          action={
            <Button variant="outline" onClick={() => championships.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {!championships.isLoading && !championships.error && championships.data?.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato criado"
          description="Crie a primeira competição para começar a configurar categorias e regulamento."
          action={<Button onClick={openCreate}>Criar primeiro campeonato</Button>}
        />
      )}

      {championships.data && championships.data.length > 0 && (
        <section
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Lista de campeonatos"
        >
          {championships.data.map((championship) => (
            <ChampionshipCard
              key={championship.id}
              championship={championship}
              onEdit={() => {
                setEditing(championship);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(championship)}
            />
          ))}
        </section>
      )}

      <ChampionshipDialog open={formOpen} championship={editing} onOpenChange={setFormOpen} />

      <ConfirmActionDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir campeonato?"
        description={
          <>
            {deleting?.name} será excluído permanentemente. A exclusão será bloqueada se houver
            partidas, inscrições ou equipes vinculadas.
          </>
        }
        confirmLabel="Excluir"
        pendingLabel="Verificando..."
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ChampionshipsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando campeonatos">
      {[0, 1, 2].map((item) => (
        <div key={item} className="card-arena overflow-hidden">
          <Skeleton className="h-28 rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
