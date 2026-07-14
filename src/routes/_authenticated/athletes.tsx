import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/athletes")({
  component: () => (
    <ComingSoon
      title="Atletas"
      description="Consulte documentos, vínculos, inscrições e o histórico competitivo de cada atleta."
    />
  ),
});
