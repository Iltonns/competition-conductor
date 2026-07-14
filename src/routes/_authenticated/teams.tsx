import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/teams")({
  component: () => (
    <ComingSoon
      title="Equipes"
      description="Centralize inscrições, escudos, comissões técnicas e elencos das equipes participantes."
    />
  ),
});
