import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flag, LogOut } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_ADMIN_NAV } from "@/features/navigation/system-admin-nav.config";
import { NavRowContent } from "@/features/navigation/nav-row";
import { cn } from "@/lib/utils";

/**
 * Menu do painel do administrador do sistema (plano seção 3.6 e 4).
 * Nunca compartilha rota, layout ou papel com `organization_members` —
 * ver `src/lib/system-admin.ts` para a checagem de autorização.
 *
 * Os itens vêm de `features/navigation/system-admin-nav.config.ts`. Só
 * "Dashboard global" está `available: true` hoje — os demais aparecem
 * com o badge "Em breve" até as telas de organizações/usuários/planos
 * serem implementadas (dependem do gate de backend da seção 3.6).
 */
export function SystemAdminSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        <IsArenaLogo size={30} showWordmark />
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-300">
          Admin
        </span>
      </div>

      <nav className="compact-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-3" aria-label="Navegação administrativa">
        <div className="space-y-0.5">
          {SYSTEM_ADMIN_NAV.map((item) => {
            if (!item.available) {
              return (
                <div
                  key={item.label}
                  className="flex h-9 items-center gap-3 rounded-lg px-3 text-[11px] font-semibold text-muted-foreground/40"
                  title={`${item.label} — em breve`}
                  aria-disabled="true"
                >
                  <NavRowContent item={item} collapsed={false} />
                </div>
              );
            }

            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-9 items-center gap-3 rounded-lg px-3 text-[11px] font-semibold transition",
                  active
                    ? "bg-amber-400/15 text-amber-200"
                    : "text-sidebar-foreground/78 hover:bg-white/[0.045] hover:text-foreground",
                )}
              >
                <NavRowContent item={item} collapsed={false} />
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-2 text-[9px] font-semibold text-amber-200">
          <Flag className="h-3.5 w-3.5 shrink-0" />
          Papel de plataforma — separado das organizações
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-[10px] font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>
    </div>
  );
}
