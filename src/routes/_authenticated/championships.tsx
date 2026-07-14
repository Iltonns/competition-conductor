import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/championships")({
  component: () => (
    <ComingSoon
      title="Campeonatos"
      description="Crie temporadas, defina o regulamento e acompanhe todas as competições em um só lugar."
    />
  ),
});
