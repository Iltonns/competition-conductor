import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams")({
  head: () => ({ meta: [{ title: "Equipes do campeonato · IS Arena" }] }),
  component: ChampionshipTeamsPage,
});

function ChampionshipTeamsPage() {
  return (
    <section className="card-arena flex min-h-64 flex-col items-center justify-center p-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon">
        <Shield className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-sm font-bold">Equipes do campeonato</h3>
      <p className="mt-1 max-w-sm text-[10px] leading-4 text-muted-foreground">
        A navegação e o contexto seguro estão prontos. O cadastro e a gestão de equipes serão
        implementados na Etapa 2B.
      </p>
    </section>
  );
}
