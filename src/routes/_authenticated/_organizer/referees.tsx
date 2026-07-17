import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_organizer/referees")({
  component: () => (
    <ComingSoon
      title="Arbitragem"
      description="Organize a equipe de arbitragem, disponibilidade e escalas de cada rodada."
    />
  ),
});
