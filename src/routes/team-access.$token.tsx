import { createFileRoute, redirect } from "@tanstack/react-router";
import { exchangeTeamEditToken } from "@/features/team-access/api/team-access.functions";

export const Route = createFileRoute("/team-access/$token")({
  head: () => ({
    meta: [
      { title: "Acesso seguro · IS Arena" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  beforeLoad: async ({ params }) => {
    let state = "invalid";
    if (/^[A-Za-z0-9_-]{43}$/.test(params.token)) {
      try {
        const result = await exchangeTeamEditToken({ data: { token: params.token } });
        state = result.state;
      } catch {
        state = "invalid";
      }
    }
    throw redirect({ to: "/team-access/session", search: { state } });
  },
  component: () => (
    <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
      Validando acesso seguro...
    </main>
  ),
});
