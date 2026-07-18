import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchPanel } from "@/features/matches/components/MatchesPage";
import { useMatch } from "@/features/matches/hooks/useMatches";

export const Route = createFileRoute("/_authenticated/championships_/$id/matches/$matchId/report")({
  head: () => ({ meta: [{ title: "Súmula · IS Arena" }] }),
  component: MatchReportRoute,
});

function MatchReportRoute() {
  const { id, matchId } = Route.useParams();
  const match = useMatch(id, matchId);
  if (match.isLoading) return <Skeleton className="h-96" />;
  if (!match.data) return <div className="card-arena p-8 text-center">Partida não encontrada.</div>;
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-neon" />
          <h2 className="font-display text-lg font-extrabold">Súmula</h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/championships/$id/matches/$matchId" params={{ id, matchId }}>
            <ArrowLeft className="h-4 w-4" /> Partida
          </Link>
        </Button>
      </header>
      <section className="card-arena p-4">
        <MatchPanel championshipId={id} match={match.data} />
      </section>
    </div>
  );
}
