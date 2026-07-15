import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Flag,
  Handshake,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
  TableProperties,
  Trophy,
  Users,
} from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useChampionshipContext } from "@/features/championships/context/use-championship-context";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/championships", label: "Campeonatos", icon: Trophy },
  { to: "/teams", label: "Equipes", icon: Shield },
  { to: "/athletes", label: "Atletas", icon: Users },
  { to: "/matches", label: "Partidas", icon: CalendarDays },
  { to: "/standings", label: "Classificação", icon: ListOrdered },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/finance", label: "Financeiro", icon: CircleDollarSign },
  { to: "/media", label: "Mídia", icon: ImageIcon },
  { to: "/referees", label: "Arbitragem", icon: Flag },
  { to: "/sponsors", label: "Patrocinadores", icon: Handshake },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const ROUTE_COPY: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Bem-vindo de volta, Lucas!" },
  championships: {
    title: "Campeonatos",
    subtitle: "Temporadas, formatos e publicação",
  },
  teams: { title: "Equipes", subtitle: "Clubes participantes e seus elencos" },
  athletes: {
    title: "Atletas",
    subtitle: "Inscrições, documentos e desempenho",
  },
  matches: { title: "Partidas", subtitle: "Agenda, resultados e súmulas" },
  standings: {
    title: "Classificação",
    subtitle: "Grupos e desempenho da competição",
  },
  stats: { title: "Estatísticas", subtitle: "Artilharia, cartões e destaques" },
  finance: { title: "Financeiro", subtitle: "Receitas, despesas e pagamentos" },
  media: {
    title: "Notícias e mídia",
    subtitle: "Conteúdo oficial da competição",
  },
  referees: { title: "Arbitragem", subtitle: "Oficiais, escalas e pagamentos" },
  sponsors: {
    title: "Patrocinadores",
    subtitle: "Cotas e exposição de marcas",
  },
  settings: { title: "Configurações", subtitle: "Preferências da organização" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-arena text-foreground">
      <div className="pointer-events-none fixed inset-0 arena-grid opacity-35" />
      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 border-r border-white/[0.07] bg-sidebar/94 shadow-[18px_0_50px_-38px_rgba(0,0,0,.9)] backdrop-blur-xl transition-[width] duration-200 lg:flex",
            collapsed ? "w-[76px]" : "w-[var(--sidebar-desktop-width)]",
          )}
        >
          <SidebarContent
            pathname={pathname}
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <AppHeader pathname={pathname} />
          <main
            id="main-content"
            className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--content-padding-x)] pb-28 pt-[var(--content-padding-y)] lg:pb-8"
          >
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNavigation pathname={pathname} />
    </div>
  );
}

function SidebarContent({
  pathname,
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const { activeChampionship } = useChampionshipContext();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name ?? "Lucas Oliveira";
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
          "flex h-16 items-center border-b border-white/[0.06]",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <IsArenaLogo size={32} showWordmark={!collapsed} />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-muted-foreground transition hover:border-neon/25 hover:text-neon",
              collapsed && "absolute left-[62px] bg-sidebar",
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

      {!collapsed && (
        <div className="border-b border-white/[0.06] px-3 py-3">
          <Link
            to="/championships"
            onClick={onNavigate}
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-left transition hover:border-neon/20 hover:bg-white/[0.04]"
          >
            <span className="min-w-0">
              <span className="block text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Campeonato ativo
              </span>
              <span className="mt-0.5 block truncate text-[11px] font-semibold">
                {activeChampionship?.name ?? "Nenhum selecionado"}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      )}

      <nav
        className="compact-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-3"
        aria-label="Navegação principal"
      >
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-9 items-center rounded-lg text-[11px] font-semibold transition focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active
                    ? "bg-neon text-neon-foreground shadow-[0_9px_24px_-14px_var(--color-neon)]"
                    : "text-sidebar-foreground/78 hover:bg-white/[0.045] hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={cn("border-t border-white/[0.06]", collapsed ? "p-2" : "p-3")}>
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-white/[0.055] bg-white/[0.02] px-3 py-2">
            <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.12em]">
              <span className="text-neon">Plano Pro</span>
              <span className="text-muted-foreground">62%</span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[62%] rounded-full bg-neon" />
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-center rounded-xl border border-transparent",
            collapsed ? "justify-center py-1" : "gap-2 px-1 py-1",
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 border border-neon/20">
            <AvatarFallback className="bg-neon/10 text-[9px] font-bold text-neon">
              {initials || "LO"}
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
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
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

function AppHeader({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeChampionship } = useChampionshipContext();
  const segment = pathname.split("/").filter(Boolean).at(0) ?? "dashboard";
  const copy = ROUTE_COPY[segment] ?? {
    title: "IS Arena",
    subtitle: "Gestão completa para grandes competições",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.065] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[var(--layout-max-width)] items-center justify-between gap-4 px-[var(--content-padding-x)]">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[17rem] border-r border-white/[0.07] bg-sidebar p-0"
            >
              <SidebarContent pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <IsArenaLogo size={27} showWordmark={false} className="lg:hidden" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-extrabold tracking-[-0.025em] sm:text-lg">
              {copy.title}
            </h1>
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden h-8 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[9px] font-semibold text-muted-foreground transition hover:border-neon/20 hover:text-foreground md:flex">
            {activeChampionship?.season ?? "Sem campeonato ativo"}
          </span>
          <button
            type="button"
            className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-muted-foreground transition hover:border-neon/20 hover:text-foreground"
            aria-label="Notificações"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_8px_var(--color-neon)]" />
          </button>
          <Button
            className="hidden h-8 bg-neon px-3 text-[10px] text-neon-foreground hover:bg-neon/90 sm:inline-flex"
            asChild
          >
            <Link to="/championships">
              <Plus className="h-3.5 w-3.5" /> Campeonatos
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNavigation({ pathname }: { pathname: string }) {
  const items = [
    { to: "/dashboard", label: "Início", icon: Home },
    { to: "/matches", label: "Jogos", icon: CalendarDays },
    { to: "/standings", label: "Tabela", icon: TableProperties },
    { to: "/settings", label: "Mais", icon: MoreHorizontal },
  ] as const;

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.075] bg-background/94 px-2 pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="Navegação inferior"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        {items.slice(0, 2).map((item) => (
          <MobileNavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />
        ))}
        <Link
          to="/matches"
          className="mx-auto -mt-5 grid h-12 w-12 place-items-center rounded-2xl border border-neon/40 bg-neon text-neon-foreground shadow-[0_10px_28px_-10px_var(--color-neon)] transition active:scale-95"
          aria-label="Criar nova partida"
        >
          <Plus className="h-5 w-5" />
        </Link>
        {items.slice(2).map((item) => (
          <MobileNavItem key={item.to} {...item} active={pathname.startsWith(item.to)} />
        ))}
      </div>
    </nav>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[8px] font-semibold transition",
        active ? "text-neon" : "text-muted-foreground active:text-foreground",
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </Link>
  );
}
