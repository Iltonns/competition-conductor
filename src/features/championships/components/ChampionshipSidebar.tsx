import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CHAMPIONSHIP_NAV, CHAMPIONSHIP_QUICK_NAV } from "@/features/navigation/championship-nav.config";
import { NavRowContent, navRowClassName } from "@/features/navigation/nav-row";

/**
 * Menu único do Cockpit do Campeonato (plano seção 3.3).
 *
 * Esta é a ÚNICA navegação exibida quando o usuário está dentro de um
 * campeonato — o Organizer Shell não é renderizado nesse contexto, então
 * não há duplicidade de menus. Os itens vêm de
 * `features/navigation/championship-nav.config.ts`; este componente só
 * resolve `championshipId` nas rotas e cuida do layout (mobile x desktop,
 * colapsado x expandido).
 */

export function ChampionshipSidebar({ championshipId }: { championshipId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
        {CHAMPIONSHIP_QUICK_NAV.map((item) => (
          <Button key={item.label} variant="outline" size="sm" asChild>
            <Link to={item.to} params={{ id: championshipId }}>
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </Link>
          </Button>
        ))}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="h-3.5 w-3.5" /> Mais
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[18rem] bg-sidebar p-3">
            <SheetHeader className="px-2 pb-3">
              <SheetTitle>Navegação do campeonato</SheetTitle>
            </SheetHeader>
            <ChampionshipNavigation
              championshipId={championshipId}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <aside
        className={cn(
          "hidden shrink-0 self-start rounded-xl border border-white/[0.07] bg-card/65 p-2 transition-[width] lg:block",
          collapsed ? "w-14" : "w-52",
        )}
        aria-label="Navegação do campeonato"
      >
        <div className={cn("mb-2 flex", collapsed ? "justify-center" : "justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <ChampionshipNavigation
          championshipId={championshipId}
          pathname={pathname}
          collapsed={collapsed}
        />
      </aside>
    </>
  );
}

function ChampionshipNavigation({
  championshipId,
  pathname,
  collapsed = false,
  onNavigate,
}: {
  championshipId: string;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {CHAMPIONSHIP_NAV.map((item) => {
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
            className={navRowClassName({ collapsed, available: true, active })}
          >
            <NavRowContent item={item} collapsed={collapsed} />
          </Link>
        );
      })}
    </nav>
  );
}
