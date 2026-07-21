import { createFileRoute } from "@tanstack/react-router";
import { SanctionsPage } from "@/features/sports-operations/components/SanctionsPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/sanctions")({
  head: () => ({ meta: [{ title: "Sanções · IS Arena" }] }),
  component: SanctionsRoute,
});

function SanctionsRoute() {
  const { id } = Route.useParams();
  return <SanctionsPage championshipId={id} />;
}
