import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipSettingsPage } from "@/features/championship-settings/components/ChampionshipSettingsPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/settings")({
  head: () => ({ meta: [{ title: "Configurações · IS Arena" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <ChampionshipSettingsPage championshipId={id} />;
}
