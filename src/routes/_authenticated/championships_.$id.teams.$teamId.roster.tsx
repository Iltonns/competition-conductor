import { createFileRoute } from "@tanstack/react-router";
import { RosterPage } from "@/features/athletes/components/RosterPages";
export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId/roster")({
  component: Page,
});
function Page() {
  const { id, teamId } = Route.useParams();
  return <RosterPage championshipId={id} teamId={teamId} />;
}
