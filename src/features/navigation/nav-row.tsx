import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/features/navigation/types";

/**
 * Conteúdo visual de um item de menu (ícone + label + badge "Em breve").
 *
 * Este componente NÃO decide a navegação — cada sidebar continua
 * responsável por envolver isto com o `<Link>` do TanStack Router (ou um
 * `<div>` desabilitado), porque só a sidebar conhece a rota tipada
 * (literal) e os parâmetros dela (ex.: `championshipId`). Isso mantém a
 * checagem de tipo de rota do router intacta enquanto ainda centraliza o
 * visual repetido nas três sidebars (organizador, campeonato, admin).
 */
export function NavRowContent({
  item,
  collapsed,
  activeClassName = "bg-neon text-neon-foreground",
}: {
  item: Pick<NavItem, "label" | "icon" | "available">;
  collapsed: boolean;
  activeClassName?: string;
}) {
  const Icon = item.icon;

  if (!item.available) {
    return (
      <>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <Badge variant="outline" className="px-1 text-[7px]">
              Em breve
            </Badge>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  );
}

export function navRowClassName({
  collapsed,
  available,
  active,
  activeClassName = "bg-neon text-neon-foreground shadow-[0_9px_24px_-14px_var(--color-neon)]",
}: {
  collapsed: boolean;
  available: boolean;
  active?: boolean;
  activeClassName?: string;
}) {
  if (!available) {
    return cn(
      "flex min-h-9 items-center rounded-lg text-[10px] font-semibold text-muted-foreground/55",
      collapsed ? "justify-center px-2" : "gap-2 px-3",
    );
  }
  return cn(
    "group flex min-h-9 items-center rounded-lg text-[10px] font-semibold transition focus-visible:ring-2 focus-visible:ring-ring",
    collapsed ? "justify-center px-2" : "gap-2 px-3",
    active
      ? activeClassName
      : "text-sidebar-foreground/78 hover:bg-white/[0.045] hover:text-foreground",
  );
}

/** Wrapper para itens indisponíveis — mesmo bloco `disabled` nas 3 sidebars. */
export function NavRowDisabled({
  item,
  collapsed,
}: {
  item: Pick<NavItem, "label" | "icon" | "available">;
  collapsed: boolean;
}) {
  return (
    <div
      className={navRowClassName({ collapsed, available: false })}
      title={collapsed ? `${item.label} — em breve` : undefined}
      aria-disabled="true"
    >
      <NavRowContent item={item} collapsed={collapsed} />
    </div>
  );
}

export function NavSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 px-2 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
      {children}
    </p>
  );
}
