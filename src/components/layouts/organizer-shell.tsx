import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Plus } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OrganizerSidebar } from "@/components/layouts/organizer-sidebar";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/features/notifications/components/NotificationCenter";
import { ORGANIZER_NAV } from "@/features/navigation/organizer-nav.config";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const PRIMARY_NAV = ORGANIZER_NAV.slice(0, 3);
const SECONDARY_NAV = ORGANIZER_NAV.slice(3);

/**
 * Organizer Shell — Fase 2.
 *
 * Nível organizador sem sidebar. A navegação fica no header:
 * - Desktop: links diretos (Campeonatos / Equipes / Atletas) + dropdown de conta
 * - Mobile: hamburger abre Sheet com o OrganizerSidebar completo
 */
export function OrganizerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <OrganizerHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--content-padding-x)] pb-8 pt-[var(--content-padding-y)]"
      >
        {children}
      </main>
    </div>
  );
}

function OrganizerHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-[var(--layout-max-width)] items-center gap-3 px-[var(--content-padding-x)]">
        {/* Mobile hamburger */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="brand-chrome w-72 border-r border-white/15 p-0">
            <OrganizerSidebar onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/championships" className="shrink-0">
          <IsArenaLogo size={28} showWordmark className="hidden lg:flex" />
          <IsArenaLogo size={28} showWordmark={false} className="lg:hidden" />
        </Link>

        {/* Separador visual desktop */}
        <div className="mx-1 hidden h-5 w-px bg-border lg:block" aria-hidden />

        {/* Navegação principal desktop */}
        <nav
          className="hidden flex-1 items-center gap-0.5 lg:flex"
          aria-label="Navegação do organizador"
        >
          {PRIMARY_NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.label}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Ações e conta */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            className="hidden h-8 bg-primary px-3 text-[11px] text-primary-foreground hover:bg-primary/90 sm:inline-flex"
            asChild
          >
            <Link to="/championships">
              <Plus className="h-3.5 w-3.5" /> Novo campeonato
            </Link>
          </Button>

          <NotificationCenter />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Menu da conta"
              >
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-secondary text-[10px] font-bold text-primary">
                    {initials || "OR"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">Organizador</p>
              </div>
              <DropdownMenuSeparator />
              {SECONDARY_NAV.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link to={item.to} className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
