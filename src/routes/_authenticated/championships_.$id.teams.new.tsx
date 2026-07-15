import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TeamForm } from "@/features/teams/components/TeamForm";
import { useCreateTeam } from "@/features/teams/hooks/useTeams";
import type { TeamInput } from "@/features/teams/types/team.types";
import { getTeamErrorMessage } from "@/features/teams/utils/team-utils";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams/new")({
  head: () => ({ meta: [{ title: "Nova equipe · IS Arena" }] }),
  component: NewTeamPage,
});
function NewTeamPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const mutation = useCreateTeam(id);
  const back = () => navigate({ to: "/championships/$id/teams", params: { id } });
  const submit = async (input: TeamInput) => {
    try {
      const team = await mutation.mutateAsync(input);
      toast.success("Equipe cadastrada e vinculada ao campeonato.");
      await navigate({ to: "/championships/$id/teams/$teamId", params: { id, teamId: team.id } });
    } catch (error) {
      toast.error(getTeamErrorMessage(error));
    }
  };
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={back}>
        <ArrowLeft className="h-4 w-4" /> Equipes
      </Button>
      <header>
        <h1 className="font-display text-xl font-black">Nova equipe</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          O vínculo com o campeonato será criado na mesma transação.
        </p>
      </header>
      <TeamForm pending={mutation.isPending} onSubmit={submit} onCancel={back} />
    </div>
  );
}
