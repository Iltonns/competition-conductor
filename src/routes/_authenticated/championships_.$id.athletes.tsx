import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/championships_/$id/athletes")({
  head: () => ({ meta: [{ title: "Atletas do campeonato · IS Arena" }] }),
  component: ChampionshipAthletesPage,
});

function ChampionshipAthletesPage() {
  return (
    <section className="card-arena flex min-h-64 flex-col items-center justify-center p-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon">
        <Users className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-sm font-bold">Atletas do campeonato</h3>
      <p className="mt-1 max-w-sm text-[10px] leading-4 text-muted-foreground">
        A rota contextual está pronta. Inscrições, documentos e CRUD de atletas permanecem fora
        desta etapa.
      </p>
    </section>
  );
}
