import { createFileRoute } from "@tanstack/react-router";
import { ChampionshipAuditPage } from "@/features/audit/components/ChampionshipAuditPage";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";

export const Route = createFileRoute("/_authenticated/championships_/$id/audit")({
  head: () => ({ meta: [{ title: "Auditoria · IS Arena" }] }),
  component: Page,
});

function Page() {
  const { activeChampionship } = useChampionshipContext();
  return activeChampionship ? <ChampionshipAuditPage championship={activeChampionship} /> : null;
}
