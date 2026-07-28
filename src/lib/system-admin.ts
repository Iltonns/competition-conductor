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
 * A RPC `is_system_admin` consulta o vínculo de plataforma no backend,
 * separado de `organization_members`. Erros de rede, ausência da migration ou
 * falta do papel sempre negam acesso.
 *
 * Nunca substitua esta checagem por um papel guardado no frontend
 * (ex.: metadata do usuário) — autorização de plataforma tem que ser
 * validada no backend a cada chamada, conforme a seção 5.4 do plano.
 */
export async function checkIsSystemAdmin(): Promise<boolean> {
  try {
    // Adapter restrito até os tipos oficiais serem regenerados após a migration.
    const systemAdminClient = supabase as unknown as SystemAdminRpcClient;
    const { data, error } = await systemAdminClient.rpc("is_system_admin");
    if (error) {
      console.warn("Falha na RPC is_system_admin:", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.warn("Falha ao verificar is_system_admin:", error);
    return false;
  }
}
