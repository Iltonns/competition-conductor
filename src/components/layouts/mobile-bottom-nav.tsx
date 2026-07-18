import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface MobileNavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Torna este item o botão de destaque central (ação principal). */
  primary?: boolean;
  onClick?: () => void;
}

/**
 * Navegação inferior mobile, reutilizada pelo OrganizerShell e pelo ChampionshipShell.
 * Cada shell decide os itens (contexto), este componente só cuida do layout/estado ativo.
 *
 * Regra do plano (seção 6): no organizador, os itens são
 * Campeonatos / Equipes / Atletas / Mais; dentro do campeonato,
 * Início / Jogos / Tabela / Equipes / Mais.
 */
export function MobileBottomNav({ items }: { items: MobileNavEntry[] }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.075] bg-background/94 px-2 pt-1.5 backdrop-blur-xl lg:hidden"
      aria-label="Navegação inferior"
    >
      <div
        className="mx-auto grid items-end"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          maxWidth: `${items.length * 6}rem`,
        }}
      >
        {items.map((item) =>
          item.primary ? (
            <Link
              key={item.to}
              to={item.to}
              onClick={item.onClick}
              className="mx-auto -mt-5 grid h-12 w-12 place-items-center rounded-2xl border border-neon/40 bg-neon text-neon-foreground shadow-[0_10px_28px_-10px_var(--color-neon)] transition active:scale-95"
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          ) : (
            <MobileNavItem
              key={item.to}
              {...item}
              active={pathname === item.to || pathname.startsWith(`${item.to}/`)}
            />
          ),
        )}
      </div>
    </nav>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: MobileNavEntry & { active: boolean }) {
  return (
    <Link
      to={to}
      onClick={onClick}
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
