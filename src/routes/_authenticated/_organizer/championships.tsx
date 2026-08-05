import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Globe2,
  Lock,
  Pencil,
  Plus,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/arena/arena-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ChampionshipDialog } from "@/features/championships/components/ChampionshipDialog";
import { useChampionships } from "@/features/championships/hooks/useChampionships";
import { fetchDashboardData } from "@/features/dashboard/dashboard.service";
import {
  CHAMPIONSHIP_STATUS_LABELS,
  getChampionshipErrorMessage,
} from "@/features/championships/utils/championship-display";
import { useAuth } from "@/lib/auth-context";
import type { Championship } from "@/features/championships/types/championship.types";

export const Route = createFileRoute("/_authenticated/_organizer/championships")({
  head: () => ({ meta: [{ title: "Meus campeonatos · IS Arena" }] }),
  component: ChampionshipsPage,
});

function ChampionshipsPage() {
  const championships = useChampionships();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Championship | null>(null);
  const { user } = useAuth();

  const dashboard = useQuery({
    queryKey: ["dashboard", "all"],
    queryFn: () => fetchDashboardData(),
  });

  const firstName =
    (user?.user_metadata?.display_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Organizador";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-foreground">
          Seja bem-vindo(a), {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seus campeonatos e acompanhe as estatísticas da temporada.
        </p>
      </section>

      {/* KPI cards */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        aria-label="Indicadores gerais"
      >
        {dashboard.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : dashboard.data ? (
          <>
            <KpiCard
              icon={Trophy}
              value={dashboard.data.activeChampionships}
              label="Campeonatos ativos"
              tone="violet"
            />
            <KpiCard icon={Shield} value={dashboard.data.teams} label="Equipes" tone="emerald" />
            <KpiCard icon={Users} value={dashboard.data.athletes} label="Atletas" tone="amber" />
            <KpiCard
              icon={CalendarDays}
              value={dashboard.data.finishedMatches}
              label="Partidas"
              tone="blue"
            />
            <article className="overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-[0.03em] text-primary-foreground/80">
                Plano Elite
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold">50% off</p>
              <p className="mt-1 text-[11px] text-primary-foreground/70">1º mês</p>
            </article>
          </>
        ) : null}
      </section>

      {/* Create button */}
      <div className="flex justify-center">
        <Button
          onClick={openCreate}
          className="bg-primary px-6 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Criar novo campeonato
        </Button>
      </div>

      {/* Championships list */}
      {championships.isLoading && <ChampionshipsSkeleton />}

      {championships.error && !championships.isLoading && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os campeonatos."
          description={getChampionshipErrorMessage(championships.error)}
          action={
            <Button variant="outline" onClick={() => championships.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {!championships.isLoading && !championships.error && championships.data?.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato criado"
          description="Crie a primeira competição para começar a configurar categorias e regulamento."
          action={<Button onClick={openCreate}>Criar primeiro campeonato</Button>}
        />
      )}

      {championships.data && championships.data.length > 0 && (
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label="Lista de campeonatos"
        >
          {championships.data.map((championship) => (
            <CompactChampionshipCard
              key={championship.id}
              championship={championship}
              onEdit={() => {
                setEditing(championship);
                setFormOpen(true);
              }}
            />
          ))}
        </section>
      )}

      <ChampionshipDialog open={formOpen} championship={editing} onOpenChange={setFormOpen} />
    </div>
  );
}

function CompactChampionshipCard({
  championship,
  onEdit,
}: {
  championship: Championship;
  onEdit: () => void;
}) {
  const avatarInitials = championship.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <article className="card-arena overflow-hidden">
      <div className="h-1.5 bg-primary" />
      <div className="flex flex-col items-center p-5 text-center">
        {championship.logo_url ? (
          <img
            src={championship.logo_url}
            alt=""
            className="h-14 w-14 rounded-xl border border-border object-contain"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
            {avatarInitials}
          </div>
        )}

        <Link
          to="/championships/$id"
          params={{ id: championship.id }}
          className="mt-3 font-display text-sm font-bold hover:text-primary"
        >
          {championship.name}
        </Link>

        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {championship.season && (
            <Badge variant="secondary" className="text-[9px]">
              {championship.season}
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px]">
            {CHAMPIONSHIP_STATUS_LABELS[championship.status]}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[9px]">
            {championship.is_public ? (
              <Globe2 className="h-2.5 w-2.5" />
            ) : (
              <Lock className="h-2.5 w-2.5" />
            )}
            {championship.is_public ? "Público" : "Privado"}
          </Badge>
        </div>

        <div className="mt-4 flex w-full justify-center gap-1 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 text-[11px]">
            <Pencil className="h-3 w-3" /> Editar
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-7 text-[11px]">
            <Link to="/championships/$id" params={{ id: championship.id }}>
              <Settings className="h-3 w-3" /> Configurar
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function ChampionshipsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Carregando campeonatos"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-arena overflow-hidden">
          <div className="h-1.5 bg-muted" />
          <div className="flex flex-col items-center space-y-3 p-5">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
