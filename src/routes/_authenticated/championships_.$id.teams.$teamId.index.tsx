import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowLeft, Edit3, MapPin, RotateCcw, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchiveTeam, useRemoveTeamLink, useTeam } from "@/features/teams/hooks/useTeams";
import { getTeamErrorMessage } from "@/features/teams/utils/team-utils";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId/")({
  head: () => ({ meta: [{ title: "Equipe · IS Arena" }] }),
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { id, teamId } = Route.useParams();
  const navigate = useNavigate();
  const query = useTeam(id, teamId);
  const archive = useArchiveTeam(id, teamId);
  const remove = useRemoveTeamLink(id, teamId);
  const [confirmRemove, setConfirmRemove] = useState(false);
  if (query.isLoading)
    return (
      <div className="space-y-3" aria-label="Carregando equipe">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  if (query.error || !query.data)
    return (
      <section className="card-arena p-8 text-center" role="alert">
        <h1 className="font-display text-lg font-bold">Equipe não encontrada</h1>
        <p className="mt-2 text-xs text-muted-foreground">{getTeamErrorMessage(query.error)}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
          <Button variant="outline" asChild>
            <Link to="/championships/$id/teams" params={{ id }}>
              Voltar
            </Link>
          </Button>
        </div>
      </section>
    );
  const { team, registration } = query.data;
  const archived = registration.status === "archived";
  const pending = archive.isPending || remove.isPending;
  const toggleArchive = async () => {
    try {
      await archive.mutateAsync(!archived);
      toast.success(
        archived ? "Equipe restaurada no campeonato." : "Equipe arquivada no campeonato.",
      );
    } catch (error) {
      toast.error(getTeamErrorMessage(error));
    }
  };
  const removeLink = async () => {
    try {
      await remove.mutateAsync();
      toast.success("Vínculo removido.");
      await navigate({ to: "/championships/$id/teams", params: { id } });
    } catch (error) {
      toast.error(getTeamErrorMessage(error));
      setConfirmRemove(false);
    }
  };
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/championships/$id/teams" params={{ id }}>
          <ArrowLeft className="h-4 w-4" /> Equipes
        </Link>
      </Button>
      <section className="card-arena overflow-hidden">
        <div className="relative min-h-44 bg-gradient-to-br from-neon/15 via-sky-400/5 to-transparent">
          {team.cover_url && (
            <img
              src={team.cover_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className="relative flex min-h-44 items-end gap-4 p-5">
            {team.crest_url ? (
              <img
                src={team.crest_url}
                alt={`Escudo de ${team.name}`}
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-black/25 text-neon">
                <Shield className="h-7 w-7" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <Badge variant={archived ? "outline" : "secondary"}>
                {archived ? "Arquivada" : "Ativa"}
              </Badge>
              <h1 className="mt-2 truncate font-display text-xl font-black sm:text-2xl">
                {team.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {[team.city, team.state].filter(Boolean).join(" · ") || "Local não informado"}
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/championships/$id/teams/$teamId/edit" params={{ id, teamId }}>
            <Edit3 className="h-4 w-4" /> Editar
          </Link>
        </Button>
        <Button variant="outline" onClick={toggleArchive} disabled={pending}>
          {archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          {archived ? "Restaurar" : "Arquivar"}
        </Button>
        <Button variant="destructive" onClick={() => setConfirmRemove(true)} disabled={pending}>
          <Trash2 className="h-4 w-4" /> Remover vínculo
        </Button>
      </div>
      <section className="card-arena grid gap-5 p-5 sm:grid-cols-2">
        <Info label="Nome curto" value={team.short_name} />
        <Info label="Sigla" value={team.abbreviation} />
        <Info label="Categoria" value={team.category} />
        <Info label="Gênero" value={team.gender} />
        <Info label="Fundação" value={team.foundation_year?.toString()} />
        <Info label="Inscrição" value={registration.registration_number} />
        <Info label="E-mail" value={team.email} />
        <Info label="WhatsApp" value={team.whatsapp} />
        {team.description && (
          <div className="sm:col-span-2">
            <Info label="Descrição" value={team.description} />
          </div>
        )}
      </section>
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo com o campeonato?</AlertDialogTitle>
            <AlertDialogDescription>
              A operação só será permitida se não houver partidas ou histórico esportivo. O cadastro
              da equipe será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void removeLink();
              }}
              disabled={pending}
            >
              {pending ? "Removendo..." : "Remover vínculo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "Não informado"}</dd>
    </div>
  );
}
