import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LogOut, Menu, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  CHAMPIONSHIP_NAV,
  CHAMPIONSHIP_QUICK_NAV,
} from "@/features/navigation/championship-nav.config";
import { navRowClassName } from "@/features/navigation/nav-row";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import type { Championship } from "@/features/championships/types/championship.types";

/** Mobile horizontal quick-nav — rendered inside <main> by ChampionshipShell. */
export function ChampionshipMobileNav({ championshipId }: { championshipId: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
      {CHAMPIONSHIP_QUICK_NAV.map((item) => {
        const href = item.to.replace("$id", championshipId);
        const active =
          item.to === "/championships/$id" ? pathname === href : pathname.startsWith(href);
        return (
          <Button
            key={item.label}
            variant={active ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link to={item.to} params={{ id: championshipId }}>
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </Link>
          </Button>
        );
      })}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="h-3.5 w-3.5" /> Mais
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="brand-chrome w-[18rem] border-r border-white/15 p-3">
          <SheetHeader className="px-2 pb-3">
            <SheetTitle className="text-primary-foreground">Navegação do campeonato</SheetTitle>
          </SheetHeader>
          <ChampionshipNavigation
            championshipId={championshipId}
            pathname={pathname}
            variant="dark"
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function ChampionshipSidebar({ championshipId }: { championshipId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { activeChampionship } = useChampionshipContext();

  return (
    <>
      {/* Desktop: white sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 self-stretch rounded-xl border border-border bg-card shadow-sm transition-[width] lg:flex lg:flex-col",
          collapsed ? "w-14" : "w-56",
        )}
        aria-label="Navegação do campeonato"
      >
        {/* Championship identity */}
        {!collapsed && activeChampionship && (
          <ChampionshipIdentity championship={activeChampionship} />
        )}
        {collapsed && (
          <div className="flex justify-center py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={cn("flex px-2", collapsed ? "justify-center py-1" : "justify-end pb-1")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Nav items */}
        <nav className="compact-scrollbar flex-1 overflow-y-auto px-2 pb-2">
          <ChampionshipNavigation
            championshipId={championshipId}
            pathname={pathname}
            variant="light"
            collapsed={collapsed}
          />
        </nav>

        {/* User at bottom */}
        <SidebarUserFooter collapsed={collapsed} />
      </aside>
    </>
  );
}

function ChampionshipIdentity({ championship }: { championship: Championship }) {
  const initials = championship.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="border-b border-border px-4 py-4 text-center">
      <Link to="/championships/$id" params={{ id: championship.id }}>
        {championship.logo_url ? (
          <img
            src={championship.logo_url}
            alt=""
            className="mx-auto h-12 w-12 rounded-xl border border-border object-contain"
          />
        ) : (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
            {initials}
          </div>
        )}
      </Link>
      <p className="mt-2 truncate font-display text-sm font-bold">{championship.name}</p>
      <Badge variant="outline" className="mt-1.5 text-[9px]">
        Gratuito
      </Badge>
    </div>
  );
}

function SidebarUserFooter({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? "Organizador";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "border-t border-border",
        collapsed ? "px-2 py-3" : "px-4 py-3",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-2.5")}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary text-[9px] font-bold text-primary">
            {initials || "OR"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">Organizadora</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ChampionshipNavigation({
  championshipId,
  pathname,
  collapsed = false,
  variant = "dark",
  onNavigate,
}: {
  championshipId: string;
  pathname: string;
  collapsed?: boolean;
  variant?: "dark" | "light";
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-0.5">
      {CHAMPIONSHIP_NAV.map((item) => {
        if (!item.available) {
          return (
            <div
              key={item.label}
              className={navRowClassName({ collapsed, available: false, variant })}
              title={collapsed ? `${item.label} — em breve` : undefined}
              aria-disabled="true"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
          );
        }

        const href = item.to.replace("$id", championshipId);
        const active =
          item.to === "/championships/$id" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={item.label}
            to={item.to}
            params={{ id: championshipId }}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={navRowClassName({ collapsed, available: true, active, variant })}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
