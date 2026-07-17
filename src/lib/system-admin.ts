import { supabase } from "@/integrations/supabase/client";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC ainda não existe
    // nos tipos gerados do Supabase; ver requisito de backend no comentário acima.
    const { data, error } = await (supabase.rpc as any)("is_system_admin");
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
