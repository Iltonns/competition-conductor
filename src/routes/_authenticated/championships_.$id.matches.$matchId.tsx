import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchPanel } from "@/features/matches/components/MatchesPage";
import { useMatch } from "@/features/matches/hooks/useMatches";

export const Route = createFileRoute("/_authenticated/championships_/$id/matches/$matchId")({
  component: MatchDetailRoute,
});

function MatchDetailRoute() {
  const { id, matchId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const match = useMatch(id, matchId);
  if (pathname.endsWith("/report")) return <Outlet />;
  if (match.isLoading) return <Skeleton className="h-96" />;
  if (!match.data) return <div className="card-arena p-8 text-center">Partida não encontrada.</div>;
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/championships/$id/matches" params={{ id }}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <section className="card-arena p-4">
        <MatchPanel championshipId={id} match={match.data} />
      </section>
    </div>
  );
}
