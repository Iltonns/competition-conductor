import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkIsSystemAdmin } from "@/lib/system-admin";
import { SystemAdminShell } from "@/components/layouts/system-admin/system-admin-shell";

/**
 * Guard da área de plataforma (plano seções 3.6 e 5.4):
 * - autenticação exigida, igual às demais áreas;
 * - papel de administrador da plataforma checado no backend a cada carga
 *   de rota, nunca inferido de um valor guardado no frontend;
 * - qualquer falha (RPC ausente, erro de rede, usuário sem o papel) nega
 *   acesso e volta para o Portal do Organizador — nunca abre o painel
 *   "no escuro" assumindo que está tudo certo.
 */
export const Route = createFileRoute("/system-admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const isSystemAdmin = await checkIsSystemAdmin();
    if (!isSystemAdmin) throw redirect({ to: "/championships" });

    return { user: data.user };
  },
  component: () => (
    <SystemAdminShell>
      <Outlet />
    </SystemAdminShell>
  ),
});
