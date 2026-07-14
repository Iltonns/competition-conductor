import { type ReactNode, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { IsArenaLogo } from "@/components/is-arena-logo";
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  Calendar,
  ListOrdered,
  BarChart3,
  Wallet,
  Image as ImageIcon,
  Flag,
  Handshake,
  Settings,
  Bell,
  Plus,
  LogOut,
  Menu,
  ChevronDown,
  Home,
  Table,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/championships", label: "Campeonatos", icon: Trophy },
  { to: "/teams", label: "Equipes", icon: Shield },
  { to: "/athletes", label: "Atletas", icon: Users },
  { to: "/matches", label: "Partidas", icon: Calendar },
  { to: "/standings", label: "Classificação", icon: ListOrdered },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/finance", label: "Financeiro", icon: Wallet },
  { to: "/media", label: "Mídia", icon: ImageIcon },
  { to: "/referees", label: "Arbitragem", icon: Flag },
  { to: "/sponsors", label: "Patrocinadores", icon: Handshake },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/matches", label: "Jogos", icon: Calendar },
  { to: "/standings", label: "Tabela", icon: Table },
  { to: "/teams", label: "Equipes", icon: Shield },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="bg-arena min-h-screen text-foreground">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <TopBar pathname={pathname} />
          <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
            {children}
          </main>
        </div>
      </div>
      <MobileNav pathname={pathname} />
    </div>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-4">
        <IsArenaLogo />
      </div>
      <div className="border-b border-sidebar-border px-4 py-3">
        <button className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2 text-left transition hover:bg-secondary">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Campeonato
            </div>
            <div className="truncate text-sm font-semibold">Copa da Baixada 2026</div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-neon text-neon-foreground shadow-[0_0_20px_-6px_var(--color-neon)]"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-neon">Plano Pro</span>
            <span className="text-muted-foreground">312/500</span>
          </div>
          <Progress value={62} className="mt-2 h-1.5 bg-secondary" />
          <div className="mt-2 text-[10px] text-muted-foreground">Renova em 22/08/2026</div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-secondary text-xs">
              {(user?.email ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {user?.user_metadata?.display_name ?? user?.email ?? "Organizador"}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">Organizador</div>
          </div>
          <button
            aria-label="Sair"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const title = NAV.find((n) => pathname.startsWith(n.to))?.label ?? "IS Arena";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-r border-sidebar-border bg-sidebar p-0">
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>
        <div className="min-w-0 lg:hidden">
          <IsArenaLogo size={26} showWordmark={false} />
        </div>
        <h1 className="truncate font-display text-lg font-bold md:text-xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-neon" />
        </button>
        <Button size="sm" className="hidden bg-neon text-neon-foreground hover:bg-neon/90 sm:inline-flex">
          <Plus className="mr-1 h-4 w-4" /> Novo Campeonato
        </Button>
      </div>
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 py-2">
        {MOBILE_NAV.slice(0, 2).map((n) => (
          <NavBtn key={n.to} to={n.to} label={n.label} icon={n.icon} active={pathname === n.to} />
        ))}
        <Link
          to="/matches"
          aria-label="Ação rápida"
          className="mx-auto -mt-6 grid h-14 w-14 place-items-center rounded-full bg-neon text-neon-foreground shadow-[0_10px_30px_-6px_var(--color-neon)]"
        >
          <Plus className="h-6 w-6" />
        </Link>
        {MOBILE_NAV.slice(2).map((n) => (
          <NavBtn key={n.to} to={n.to} label={n.label} icon={n.icon} active={pathname === n.to} />
        ))}
      </div>
    </nav>
  );
}

function NavBtn({
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
      className={cn(
        "flex flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium",
        active ? "text-neon" : "text-muted-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
