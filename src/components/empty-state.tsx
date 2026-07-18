import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estado de "lista vazia" ou "erro ao carregar", reutilizável em qualquer
 * página conectada ao Supabase (plano seção 5.5, "Estados obrigatórios").
 *
 * Antes desta extração, o mesmo bloco (ícone + título + descrição + ação,
 * dentro de um `card-arena` com `min-h`) estava duplicado em pelo menos 4
 * lugares com pequenas variações de tamanho de fonte e ícone:
 * - `_organizer/championships.tsx` (empty + error, inline)
 * - `championships_.$id.teams.index.tsx` (componente local `State`)
 * - `features/athletes/components/RosterPages.tsx` (componente local `State`)
 *
 * Use `variant="error"` para falhas de carregamento (role="alert", tom
 * vermelho) e `variant="empty"` (padrão) para listas vazias (role="status",
 * tom verde-neon).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "empty",
  size = "md",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "empty" | "error";
  size?: "sm" | "md";
  className?: string;
}) {
  const isError = variant === "error";
  const ResolvedIcon = Icon ?? (isError ? AlertTriangle : Inbox);

  return (
    <section
      role={isError ? "alert" : "status"}
      className={cn(
        "card-arena flex flex-col items-center justify-center p-6 text-center",
        size === "sm" ? "min-h-52" : "min-h-64",
        className,
      )}
    >
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl",
          isError ? "bg-destructive/10 text-destructive" : "bg-neon/10 text-neon",
        )}
      >
        <ResolvedIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-sm font-bold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[10px] leading-4 text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>
      )}
    </section>
  );
}
