import { createFileRoute } from "@tanstack/react-router";
import { CompetitionStructurePage } from "@/features/competition-engine/components/CompetitionStructurePage";
export const Route = createFileRoute("/_authenticated/championships_/$id/structure")({
  head: () => ({ meta: [{ title: "Estrutura · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <CompetitionStructurePage championshipId={id} />;
}
