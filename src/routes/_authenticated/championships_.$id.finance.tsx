import { createFileRoute } from "@tanstack/react-router";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { ChampionshipFinancePage } from "@/features/finance/components/ChampionshipFinancePage";

export const Route = createFileRoute("/_authenticated/championships_/$id/finance")({
  head: () => ({ meta: [{ title: "Financeiro · IS Arena" }] }),
  component: Page,
});

function Page() {
  const { activeChampionship } = useChampionshipContext();
  return activeChampionship ? <ChampionshipFinancePage championship={activeChampionship} /> : null;
}
