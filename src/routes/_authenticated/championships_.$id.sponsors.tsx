import { createFileRoute } from "@tanstack/react-router";
import { SponsorsPublishingPage } from "@/features/publishing/components/SponsorsPublishingPage";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";

export const Route = createFileRoute("/_authenticated/championships_/$id/sponsors")({
  head: () => ({ meta: [{ title: "Patrocinadores · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { activeChampionship } = useChampionshipContext();
  return activeChampionship ? <SponsorsPublishingPage championship={activeChampionship} /> : null;
}
