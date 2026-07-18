import { createFileRoute } from "@tanstack/react-router";
import { StandingsPage } from "@/features/matches/components/StandingsPage";
export const Route = createFileRoute("/_authenticated/championships_/$id/standings")({
  head: () => ({ meta: [{ title: "Classificação · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <StandingsPage championshipId={id} />;
}
