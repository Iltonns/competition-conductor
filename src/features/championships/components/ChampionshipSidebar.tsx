import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Flag,
  Globe2,
  Handshake,
  ListOrdered,
  Menu,
  Newspaper,
  Settings,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const AVAILABLE_ITEMS = [
  { label: "Visão geral", icon: Trophy, to: "/championships/$id", available: true },
  { label: "Equipes", icon: Shield, to: "/championships/$id/teams", available: true },
  { label: "Atletas", icon: Users, to: "/championships/$id/athletes", available: true },
] as const;

const ITEMS = [
  ...AVAILABLE_ITEMS,
  { label: "Partidas", icon: CalendarDays, available: false },
  { label: "Classificação", icon: ListOrdered, available: false },
  { label: "Estatísticas", icon: BarChart3, available: false },
  { label: "Súmula", icon: ClipboardList, available: false },
  { label: "Arbitragem", icon: Flag, available: false },
  { label: "Financeiro", icon: CircleDollarSign, available: false },
  { label: "Notícias e mídia", icon: Newspaper, available: false },
  { label: "Patrocinadores", icon: Handshake, available: false },
  { label: "Página pública", icon: Globe2, available: false },
  { label: "Configurações", icon: Settings, available: false },
] as const;

export function ChampionshipSidebar({ championshipId }: { championshipId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden">
        {AVAILABLE_ITEMS.map((item) => (
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
      {ITEMS.map((item) => {
        const Icon = item.icon;
        if (!item.available) {
          return (
            <div
              key={item.label}
              className={cn(
                "flex min-h-9 items-center rounded-lg px-2 text-[10px] text-muted-foreground/55",
                collapsed ? "justify-center" : "gap-2",
              )}
              title={collapsed ? `${item.label} — em breve` : undefined}
              aria-disabled="true"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <Badge variant="outline" className="px-1 text-[7px]">
                    Em breve
                  </Badge>
                </>
              )}
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
            className={cn(
              "flex min-h-9 items-center rounded-lg px-2 text-[10px] font-semibold transition",
              collapsed ? "justify-center" : "gap-2",
              active
                ? "bg-neon text-neon-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
