import { createFileRoute } from "@tanstack/react-router";
import { TeamPeoplePage } from "@/features/team-staff/components/TeamPeoplePage";
export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId/staff")({
  component: Page,
});
function Page() {
  const { id, teamId } = Route.useParams();
  return <TeamPeoplePage championshipId={id} teamId={teamId} kind="staff" />;
}
