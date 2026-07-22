import { createFileRoute } from "@tanstack/react-router";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { PublicPageSettings } from "@/features/publishing/components/PublicPageSettings";

export const Route = createFileRoute("/_authenticated/championships_/$id/public-page")({
  head: () => ({ meta: [{ title: "Página pública · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { activeChampionship } = useChampionshipContext();
  return activeChampionship ? <PublicPageSettings championship={activeChampionship} /> : null;
}
