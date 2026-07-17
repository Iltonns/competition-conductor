import type { ReactNode } from "react";
import { SystemAdminSidebar } from "@/components/layouts/system-admin/system-admin-sidebar";

/**
 * System Admin Shell (plano seção 3.6).
 *
 * Não reutiliza OrganizerShell nem ChampionshipShell — layout, rotas e
 * autorização próprios. Faixa âmbar no topo reforça visualmente que esta
 * é uma área de plataforma, não de um cliente.
 */
export function SystemAdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-arena text-foreground">
      <div className="pointer-events-none fixed inset-0 arena-grid opacity-20" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400/0 via-amber-400/70 to-amber-400/0" />
      <div className="relative flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[var(--sidebar-desktop-width-wide)] shrink-0 border-r border-amber-400/[0.12] bg-sidebar/94 backdrop-blur-xl lg:flex">
          <SystemAdminSidebar />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-amber-400/[0.12] bg-background/85 px-[var(--content-padding-x)] backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
              Administração do sistema
            </p>
          </header>
          <main
            id="main-content"
            className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--content-padding-x)] py-[var(--content-padding-y)]"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
