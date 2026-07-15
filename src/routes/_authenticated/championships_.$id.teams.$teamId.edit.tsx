import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamForm } from "@/features/teams/components/TeamForm";
import { useTeam, useUpdateTeam } from "@/features/teams/hooks/useTeams";
import type { TeamInput } from "@/features/teams/types/team.types";
import { getTeamErrorMessage } from "@/features/teams/utils/team-utils";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId/edit")({
  head: () => ({ meta: [{ title: "Editar equipe · IS Arena" }] }),
  component: EditTeamPage,
});
function EditTeamPage() {
  const { id, teamId } = Route.useParams();
  const navigate = useNavigate();
  const query = useTeam(id, teamId);
  const mutation = useUpdateTeam(id, teamId);
  const back = () => navigate({ to: "/championships/$id/teams/$teamId", params: { id, teamId } });
  if (query.isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  if (query.error || !query.data)
    return (
      <section className="card-arena p-8 text-center" role="alert">
        <h1 className="font-display text-lg font-bold">Equipe não encontrada</h1>
        <p className="mt-2 text-xs text-muted-foreground">{getTeamErrorMessage(query.error)}</p>
        <Button className="mt-4" variant="outline" onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </section>
    );
  const submit = async (input: TeamInput) => {
    try {
      await mutation.mutateAsync(input);
      toast.success("Equipe atualizada.");
      await back();
    } catch (error) {
      toast.error(getTeamErrorMessage(error));
    }
  };
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={back}>
        <ArrowLeft className="h-4 w-4" /> Equipe
      </Button>
      <header>
        <h1 className="font-display text-xl font-black">Editar equipe</h1>
        <p className="mt-1 text-xs text-muted-foreground">Atualize o cadastro administrativo.</p>
      </header>
      <TeamForm
        team={query.data.team}
        pending={mutation.isPending}
        onSubmit={submit}
        onCancel={back}
      />
    </div>
  );
}
