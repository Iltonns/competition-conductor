import { createFileRoute } from "@tanstack/react-router";
import { NewAthletePage } from "@/features/athletes/components/RosterPages";
export const Route = createFileRoute(
  "/_authenticated/championships_/$id/teams/$teamId/athletes/new",
)({ component: Page });
function Page() {
  const { id, teamId } = Route.useParams();
  return <NewAthletePage championshipId={id} teamId={teamId} />;
}
