import { createFileRoute } from "@tanstack/react-router";
import { AthleteDetailPage } from "@/features/athletes/components/RosterPages";
export const Route = createFileRoute(
  "/_authenticated/championships_/$id/teams/$teamId/athletes/$athleteId",
)({ component: Page });
function Page() {
  const { id, teamId, athleteId } = Route.useParams();
  return <AthleteDetailPage championshipId={id} teamId={teamId} athleteId={athleteId} />;
}
