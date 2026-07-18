import { supabase } from "@/integrations/supabase/client";

type SystemAdminRpcClient = {
  rpc: (name: "is_system_admin") => PromiseLike<{
    data: boolean | null;
    error: { message: string } | null;
  }>;
};

/**
 * Verifica se o usuário autenticado é administrador da plataforma.
 *
 * REQUISITO DE BACKEND (plano seção 3.6, "Requisitos de backend do painel
 * administrativo"): isto depende de uma função/claim `is_system_admin`
 * verificável no servidor, separada de `organization_members`. Enquanto essa
 * função não existir no Supabase, este helper falha fechado (nega acesso)
 * em vez de assumir que o usuário é administrador.
 *
 * Nunca substitua esta checagem por um papel guardado no frontend
 * (ex.: metadata do usuário) — autorização de plataforma tem que ser
 * validada no backend a cada chamada, conforme a seção 5.4 do plano.
 */
export async function checkIsSystemAdmin(): Promise<boolean> {
  try {
    // Contrato local e restrito enquanto a RPC fail-closed ainda não faz parte dos
    // tipos oficiais. Remover este adapter quando a Fase 6 entregar a função real.
    const systemAdminClient = supabase as unknown as SystemAdminRpcClient;
    const { data, error } = await systemAdminClient.rpc("is_system_admin");
    if (error) {
      console.warn("is_system_admin RPC indisponível ainda:", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.warn("Falha ao verificar is_system_admin:", error);
    return false;
  }
}
