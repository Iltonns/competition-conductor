import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChampionshipProvider } from "@/features/championships/context/championship-context";

/**
 * Guard de autenticação compartilhado por todas as áreas do cliente
 * (Organizer Shell e Championship Shell).
 *
 * IMPORTANTE: esta rota NÃO renderiza mais um shell visual (o antigo
 * `AppShell`). Isso é intencional — era a causa raiz da navegação
 * duplicada descrita no plano de reformulação (seção 2): o menu global
 * aparecia por cima de qualquer página, inclusive dentro de um
 * campeonato, que já tinha o próprio menu.
 *
 * Agora cada grupo de rotas filho decide seu próprio shell:
 * - `_organizer/route.tsx`      -> OrganizerShell (fora de um campeonato)
 * - `championships_.$id.tsx`    -> ChampionshipShell (dentro de um campeonato)
 * Os dois nunca renderizam ao mesmo tempo.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => (
    <ChampionshipProvider>
      <Outlet />
    </ChampionshipProvider>
  ),
});
