import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, CalendarDays, Menu, MoreHorizontal, Plus, Shield, Trophy } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OrganizerSidebar } from "@/components/layouts/organizer-sidebar";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";
import { cn } from "@/lib/utils";

const ROUTE_COPY: Record<string, { title: string; subtitle: string }> = {
  championships: {
    title: "Meus campeonatos",
    subtitle: "Temporadas, formatos e publicação",
  },
  teams: { title: "Equipes", subtitle: "Cadastro base de equipes da organização" },
  athletes: { title: "Atletas", subtitle: "Cadastro base de atletas da organização" },
  settings: { title: "Organização e configurações", subtitle: "Usuários, plano e preferências" },
};

/**
 * Organizer Shell (plano seção 3.2 e 7).
 *
 * Este shell só deve envolver rotas que existem FORA de um campeonato
 * específico (Meus campeonatos, Equipes, Atletas, Organização, Assinatura,
 * Perfil). Rotas de dentro de um campeonato (`/championships/$id/**`) usam o
 * `ChampionshipShell`, nunca este componente — os dois nunca devem renderizar
 * ao mesmo tempo, para eliminar a navegação duplicada descrita no plano.
 */
export function OrganizerShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
          <OrganizerSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </aside>

        <div className="min-w-0 flex-1">
          <OrganizerHeader pathname={pathname} />
          <main
            id="main-content"
            className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--content-padding-x)] pb-28 pt-[var(--content-padding-y)] lg:pb-8"
          >
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav
        items={[
          { to: "/championships", label: "Campeonatos", icon: Trophy },
          { to: "/teams", label: "Equipes", icon: Shield },
          { to: "/athletes", label: "Atletas", icon: CalendarDays },
          { to: "/settings", label: "Mais", icon: MoreHorizontal },
        ]}
      />
    </div>
  );
}

function OrganizerHeader({ pathname }: { pathname: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const segment = pathname.split("/").filter(Boolean).at(0) ?? "championships";
  const copy = ROUTE_COPY[segment] ?? {
    title: "IS Arena",
    subtitle: "Portal do organizador",
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
              <OrganizerSidebar onNavigate={() => setMenuOpen(false)} />
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
              <Plus className="h-3.5 w-3.5" /> Novo campeonato
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
