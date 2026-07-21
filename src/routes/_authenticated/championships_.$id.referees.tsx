import { createFileRoute } from "@tanstack/react-router";
import { RefereesPage } from "@/features/sports-operations/components/RefereesPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/referees")({
  head: () => ({ meta: [{ title: "Arbitragem · IS Arena" }] }),
  component: RefereesRoute,
});

function RefereesRoute() {
  const { id } = Route.useParams();
  return <RefereesPage championshipId={id} />;
}
