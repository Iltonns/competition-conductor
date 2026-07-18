import { createFileRoute } from "@tanstack/react-router";
import { CompetitionStagePage } from "@/features/competition-engine/components/CompetitionStagePage";
export const Route = createFileRoute(
  "/_authenticated/championships_/$id/structure/stages/$stageId",
)({ head: () => ({ meta: [{ title: "Fase · IS Arena" }] }), component: Page });
function Page() {
  const { id, stageId } = Route.useParams();
  return <CompetitionStagePage championshipId={id} stageId={stageId} />;
}
