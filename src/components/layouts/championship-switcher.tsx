import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Trophy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChampionships } from "@/features/championships/hooks/useChampionships";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/features/championships/utils/championship-display";
import { cn } from "@/lib/utils";

/**
 * O seletor NUNCA guarda "campeonato ativo" em estado global — ele apenas
 * navega para `/championships/$id`. A URL continua sendo a única fonte de
 * verdade do campeonato em uso (evita mutations no campeonato errado).
 */
export function ChampionshipSwitcher({ currentId }: { currentId: string }) {
  const [open, setOpen] = useState(false);
  const championships = useChampionships();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 text-[10px] font-semibold text-muted-foreground transition hover:border-neon/25 hover:text-foreground"
          aria-label="Trocar de campeonato"
        >
          <Trophy className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Trocar</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Meus campeonatos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {championships.isLoading && (
          <div className="px-2 py-3 text-center text-[10px] text-muted-foreground">
            Carregando...
          </div>
        )}
        {championships.data?.length === 0 && (
          <div className="px-2 py-3 text-center text-[10px] text-muted-foreground">
            Nenhum campeonato encontrado.
          </div>
        )}
        {championships.data?.map((item) => (
          <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
            <Link
              to="/championships/$id"
              params={{ id: item.id }}
              className="flex items-center justify-between gap-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {item.season || CHAMPIONSHIP_STATUS_LABELS[item.status]}
                </span>
              </span>
              {item.id === currentId && <Check className="h-3.5 w-3.5 shrink-0 text-neon" />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={cn("cursor-pointer text-xs")}>
          <Link to="/championships">Ver todos os campeonatos</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
