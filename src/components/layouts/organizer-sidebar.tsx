import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ORGANIZER_NAV } from "@/features/navigation/organizer-nav.config";
import { NavRowContent, navRowClassName } from "@/features/navigation/nav-row";

export function OrganizerSidebar({
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "Organizador";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <IsArenaLogo
          size={32}
          showWordmark={!collapsed}
          className="[&_span]:!text-primary-foreground"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-muted-foreground transition hover:border-primary/25 hover:text-primary",
              collapsed && "absolute left-[62px] bg-primary",
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      <nav
        className="compact-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-3"
        aria-label="Navegação do organizador"
      >
        <div className="space-y-0.5">
          {ORGANIZER_NAV.map((item) => {
            if (!item.available) {
              return (
                <div
                  key={item.label}
                  className={navRowClassName({ collapsed, available: false })}
                  title={collapsed ? `${item.label} — em breve` : undefined}
                  aria-disabled="true"
                >
                  <NavRowContent item={item} collapsed={collapsed} />
                </div>
              );
            }

            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={navRowClassName({ collapsed, available: true, active })}
              >
                <NavRowContent item={item} collapsed={collapsed} />
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/35 px-3 py-2">
            <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.12em]">
              <span className="text-primary-foreground">Plano</span>
              <span className="text-muted-foreground">—</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-0 rounded-full bg-primary-foreground" />
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-center rounded-xl border border-transparent",
            collapsed ? "justify-center py-1" : "gap-2 px-1 py-1",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 border border-white/25">
            <AvatarFallback className="bg-white/15 text-[9px] font-bold text-primary-foreground">
              {initials || "OR"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold">{displayName}</span>
                <span className="block text-[8px] text-muted-foreground">Organizador</span>
              </span>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
