import { createFileRoute } from "@tanstack/react-router";
import { RefereeDetailPage } from "@/features/sports-operations/components/RefereeDetailPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/referees/$refereeId")({
  head: () => ({ meta: [{ title: "Detalhes do árbitro · IS Arena" }] }),
  component: RefereeDetailRoute,
});

function RefereeDetailRoute() {
  const { id, refereeId } = Route.useParams();
  return <RefereeDetailPage championshipId={id} refereeId={refereeId} />;
}
