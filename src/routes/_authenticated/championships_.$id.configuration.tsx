import { createFileRoute } from "@tanstack/react-router";
import { CompetitionConfigurationPage } from "@/features/competition-engine/components/CompetitionConfigurationPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/configuration")({
  head: () => ({ meta: [{ title: "Configuração · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <CompetitionConfigurationPage championshipId={id} />;
}
