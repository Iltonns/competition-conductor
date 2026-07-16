import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId")({
  component: TeamLayout,
});
function TeamLayout() {
  const { id, teamId } = Route.useParams();
  return (
    <div className="space-y-4">
      <nav
        className="flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card/60 p-1"
        aria-label="Áreas da equipe"
      >
        <Tab to="/championships/$id/teams/$teamId" label="Visão geral" params={{ id, teamId }} />
        <Tab to="/championships/$id/teams/$teamId/roster" label="Elenco" params={{ id, teamId }} />
        <Tab to="/championships/$id/teams/$teamId/staff" label="Comissão" params={{ id, teamId }} />
        <Tab
          to="/championships/$id/teams/$teamId/responsibles"
          label="Responsáveis"
          params={{ id, teamId }}
        />
      </nav>
      <Outlet />
    </div>
  );
}
function Tab({
  to,
  label,
  params,
}: {
  to: string;
  label: string;
  params: { id: string; teamId: string };
}) {
  return (
    <Link
      to={to}
      params={params}
      activeOptions={{ exact: true }}
      className="whitespace-nowrap rounded-lg px-3 py-2 text-xs text-muted-foreground [&.active]:bg-neon [&.active]:font-bold [&.active]:text-black"
    >
      {label}
    </Link>
  );
}
