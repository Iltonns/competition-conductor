import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/system-admin/")({
  head: () => ({ meta: [{ title: "Administração do sistema · IS Arena" }] }),
  component: SystemAdminDashboard,
});

/**
 * Placeholder do dashboard global (plano seção 3.6, "Dashboard global").
 * Os cartões reais (organizações, usuários, campeonatos, MRR, storage,
 * alertas) dependem das views/RPCs administrativas listadas na seção
 * "Requisitos de backend do painel administrativo" — ainda não existem.
 */
function SystemAdminDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-black">Dashboard global</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Visão consolidada de organizações, usuários, campeonatos e assinaturas da plataforma.
        </p>
      </div>

      <div className="card-arena flex items-start gap-3 border-amber-400/20 bg-amber-400/[0.05] p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="text-xs text-amber-100/90">
          <p className="font-semibold">Aguardando gate de backend</p>
          <p className="mt-1 text-amber-100/70">
            Este painel está isolado e protegido pelo guard de{" "}
            <code className="rounded bg-black/30 px-1">is_system_admin</code>, mas as métricas reais
            só devem ser conectadas depois que as views/RPCs administrativas e o
            <code className="rounded bg-black/30 px-1">admin_audit_logs</code> existirem no backend,
            conforme o gate de prontidão do plano de reformulação.
          </p>
        </div>
      </div>
    </div>
  );
}
