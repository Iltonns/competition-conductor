import { createFileRoute } from "@tanstack/react-router";
import { TeamResponsiblesPage } from "@/features/team-responsibles/components/TeamResponsiblesPage";
export const Route = createFileRoute(
  "/_authenticated/championships_/$id/teams/$teamId/responsibles",
)({ component: Page });
function Page() {
  const { id, teamId } = Route.useParams();
  return <TeamResponsiblesPage championshipId={id} teamId={teamId} />;
}
