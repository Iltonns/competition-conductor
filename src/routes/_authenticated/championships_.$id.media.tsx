import { createFileRoute } from "@tanstack/react-router";
import { ContentPublishingPage } from "@/features/publishing/components/ContentPublishingPage";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";

export const Route = createFileRoute("/_authenticated/championships_/$id/media")({
  head: () => ({ meta: [{ title: "Notícias e mídia · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { activeChampionship } = useChampionshipContext();
  return activeChampionship ? <ContentPublishingPage championship={activeChampionship} /> : null;
}
