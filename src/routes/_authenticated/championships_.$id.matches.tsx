import { createFileRoute } from "@tanstack/react-router";
import { MatchesPage } from "@/features/matches/components/MatchesPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/matches")({
  head: () => ({ meta: [{ title: "Partidas · IS Arena" }] }),
  component: MatchesRoute,
});

function MatchesRoute() {
  const { id } = Route.useParams();
  return <MatchesPage championshipId={id} />;
}
