import { useEffect } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionshipShell } from "@/components/layouts/championship-shell";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { ChampionshipDomainError } from "@/features/championships/errors/championship-errors";
import { useChampionship } from "@/features/championships/hooks/useChampionship";
import { getChampionshipErrorMessage } from "@/features/championships/utils/championship-display";

export const Route = createFileRoute("/_authenticated/championships_/$id")({
  head: () => ({ meta: [{ title: "Campeonato - IS Arena" }] }),
  component: ChampionshipLayout,
});

/**
 * Cockpit do Campeonato (plano secao 3.3, Etapa 1 e 3).
 *
 * Esta rota e o unico lugar que decide o championshipId - o
 * ChampionshipShell recebe os dados ja carregados e monta o cabecalho
 * persistente e o menu unico da competicao. Nenhuma tela abaixo dela
 * (Outlet) deve manter um segundo estado de "campeonato ativo": a URL
 * ($id) e a fonte de verdade (secao 4, "Regra de contexto").
 */
function ChampionshipLayout() {
  const { id } = Route.useParams();
  const championship = useChampionship(id);
  const { setActiveChampionship } = useChampionshipContext();

  useEffect(() => {
    setActiveChampionship(championship.data ?? null);
    return () => setActiveChampionship(null);
  }, [championship.data, setActiveChampionship]);

  if (championship.isLoading) return <ChampionshipLayoutSkeleton />;

  if (championship.error || !championship.data) {
    const forbidden =
      championship.error instanceof ChampionshipDomainError &&
      championship.error.code === "FORBIDDEN";
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena px-4">
        <div className="card-arena max-w-md p-8 text-center" role="alert">
          <h2 className="font-display text-lg font-bold">
            {forbidden ? "Acesso negado" : "Campeonato não encontrado"}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {getChampionshipErrorMessage(championship.error)}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => championship.refetch()}>
              Tentar novamente
            </Button>
            <Button variant="outline" asChild>
              <Link to="/championships">Voltar</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChampionshipShell championship={championship.data}>
      <Outlet />
    </ChampionshipShell>
  );
}

function ChampionshipLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-arena" aria-label="Carregando campeonato">
      <Skeleton className="hidden h-screen w-[var(--sidebar-desktop-width)] shrink-0 lg:block" />
      <div className="min-w-0 flex-1 space-y-4 p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
