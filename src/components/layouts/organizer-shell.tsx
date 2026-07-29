import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Menu, MoreHorizontal, Plus, Shield, Trophy } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OrganizerSidebar } from "@/components/layouts/organizer-sidebar";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";

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
            "brand-chrome sticky top-0 hidden h-screen shrink-0 border-r border-white/20 shadow-sm transition-[width] duration-200 lg:flex",
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
    <header className="brand-chrome sticky top-0 z-30 border-b border-primary">
      <div className="mx-auto flex h-16 w-full max-w-[var(--layout-max-width)] items-center justify-between gap-4 px-[var(--content-padding-x)]">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="brand-chrome w-[17rem] border-r border-white/20 p-0"
            >
              <OrganizerSidebar onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <IsArenaLogo size={27} showWordmark={false} className="lg:hidden" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-extrabold tracking-[-0.025em] sm:text-lg">
              {copy.title}
            </h1>
            <p className="hidden truncate text-[10px] text-primary-foreground/75 sm:block">
              {copy.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationCenter />
          <Button
            className="hidden h-8 bg-[#f0f2f5] px-3 text-[10px] text-[#1c2733] hover:bg-white sm:inline-flex"
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
