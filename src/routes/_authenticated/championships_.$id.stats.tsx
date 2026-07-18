import { createFileRoute } from "@tanstack/react-router";
import { StatsPage } from "@/features/matches/components/StatsPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/stats")({
  head: () => ({ meta: [{ title: "Estatísticas · IS Arena" }] }),
  component: StatsRoute,
});

function StatsRoute() {
  const { id } = Route.useParams();
  return <StatsPage championshipId={id} />;
}
