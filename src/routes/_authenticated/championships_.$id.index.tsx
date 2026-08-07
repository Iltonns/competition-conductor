import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Goal, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { fetchDashboardData } from "@/features/dashboard/dashboard.service";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/features/championships/utils/championship-display";
import { useCurrentPlan } from "@/features/subscription/hooks/useCurrentPlan";

export const Route = createFileRoute("/_authenticated/championships_/$id/")({
  component: ChampionshipOverviewPage,
});

/** Tons de equipe derivados no `dashboard.service` a partir de `primary_color`. */
const TONE_COLORS: Record<string, string> = {
  amber: "oklch(72% 0.18 85)",
  emerald: "oklch(62% 0.17 150)",
  violet: "oklch(55% 0.18 290)",
  red: "oklch(58% 0.19 25)",
  blue: "oklch(47% 0.17 258)",
  lime: "oklch(62% 0.2 130)",
};

const toneColor = (tone: string | undefined) => TONE_COLORS[tone ?? ""] ?? TONE_COLORS.blue;

function ChampionshipOverviewPage() {
  const { activeChampionship } = useChampionshipContext();
  const { id } = Route.useParams();

  const dashboard = useQuery({
    queryKey: ["dashboard", id],
    queryFn: () => fetchDashboardData(id),
    enabled: Boolean(id),
  });

  if (!activeChampionship) return <PageSkeleton />;

  const initials = activeChampionship.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const data = dashboard.data;

  return (
    <div className="space-y-6">
      {/* Championship identity header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {activeChampionship.logo_url ? (
            <img
              src={activeChampionship.logo_url}
              alt=""
              className="h-12 w-12 rounded-xl border border-border object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-[-0.03em]">
              {activeChampionship.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                {CHAMPIONSHIP_STATUS_LABELS[activeChampionship.status]}
              </Badge>
              {activeChampionship.season && (
                <Badge variant="secondary" className="text-[10px]">
                  {activeChampionship.season}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/championships/$id/settings" params={{ id }}>
              Regras
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/championships/$id/structure" params={{ id }}>
              Fases
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/championships/$id/configuration" params={{ id }}>
              + Categoria
            </Link>
          </Button>
        </div>
      </div>

      {/* Banner */}
      <div className="relative min-h-[180px] overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {activeChampionship.cover_url ? (
          <img
            src={activeChampionship.cover_url}
            alt={`Capa de ${activeChampionship.name}`}
            className="h-[180px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[180px] items-center justify-center">
            <span className="text-xs text-muted-foreground">Banner do campeonato</span>
          </div>
        )}
      </div>

      {/* Plan upsell — amber. Só aparece quando o plano atual não inclui publicação. */}
      <PublishingUpsell organizationId={activeChampionship.organization_id} />

      {/* Standings preview */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Classificação</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/championships/$id/standings" params={{ id }}>
              Ver tabela completa <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {dashboard.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : data && data.standings.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <StandingsGroup name="Classificação geral" rows={data.standings.slice(0, 6)} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
            A classificação aparecerá após os primeiros jogos.
          </div>
        )}
      </section>

      {/* Scorers */}
      {data && data.scorers.length > 0 && (
        <section className="card-arena p-5">
          <h2 className="mb-4 font-display text-sm font-bold">Artilharia</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.scorers.slice(0, 4).map((scorer) => (
              <div key={scorer.name} className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white"
                  style={{ background: toneColor(scorer.team.tone) }}
                >
                  {scorer.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">{scorer.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {scorer.team.shortName} · {scorer.goals} gols
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick KPIs */}
      {data && (
        <section
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label="Resumo do campeonato"
        >
          {[
            { label: "Equipes", value: data.teams, icon: Shield },
            { label: "Atletas", value: data.athletes, icon: Users },
            { label: "Partidas", value: data.finishedMatches, icon: CalendarDays },
            { label: "Gols", value: data.totalGoals, icon: Goal },
          ].map((item) => (
            <article key={item.label} className="card-arena flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-lg font-black">{item.value}</p>
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

/**
 * Banner de upsell do mockup. O texto original citava planos fixos; aqui a
 * peça só aparece quando o plano real da organização não tem o módulo
 * `publishing` — e some sozinha depois do upgrade.
 */
function PublishingUpsell({ organizationId }: { organizationId: string }) {
  const { modules, isOwner, isLoading } = useCurrentPlan(organizationId);

  if (isLoading || !isOwner || modules.includes("publishing")) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[oklch(85%_0.09_85)] bg-[oklch(97%_0.03_85)] px-5 py-4">
      <p className="text-sm font-semibold text-[oklch(38%_0.09_70)]">
        Tenha o app e o site do seu campeonato — disponível nos planos com módulo de publicação.
      </p>
      <Button
        size="sm"
        className="shrink-0 bg-[oklch(55%_0.13_75)] text-white hover:bg-[oklch(50%_0.13_75)]"
        asChild
      >
        <Link to="/settings/subscription">Conhecer planos</Link>
      </Button>
    </div>
  );
}

function StandingsGroup({
  name,
  rows,
}: {
  name: string;
  rows: Array<{
    position: number;
    team: { name: string; initials: string; tone: string };
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalDifference: number;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-bold">{name}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.team.name} className="flex items-center gap-2.5 px-4 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-foreground font-display text-[10px] font-black text-background">
              {row.position}
            </span>
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-[8px] font-bold text-white"
              style={{ background: toneColor(row.team.tone) }}
            >
              {row.team.initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
              {row.team.name}
            </span>
            <span className="font-display text-[13px] font-black">{row.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-[180px] rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
