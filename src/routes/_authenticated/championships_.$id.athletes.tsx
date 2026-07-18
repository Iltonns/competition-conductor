import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/championships_/$id/athletes")({
  head: () => ({ meta: [{ title: "Atletas do campeonato - IS Arena" }] }),
  component: ChampionshipAthletesPage,
});

function ChampionshipAthletesPage() {
  return (
    <EmptyState
      icon={Users}
      title="Atletas do campeonato"
      description="A rota contextual está pronta. Inscrições, documentos e CRUD de atletas permanecem fora desta etapa."
    />
  );
}
