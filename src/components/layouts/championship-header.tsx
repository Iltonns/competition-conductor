import { Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Globe2, Lock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionshipSwitcher } from "@/components/layouts/championship-switcher";
import type { Championship } from "@/features/championships/types/championship.types";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/features/championships/utils/championship-display";

/**
 * Cabeçalho persistente do cockpit (plano seção 3.3):
 * voltar aos campeonatos, logo/nome, temporada/status, seletor,
 * indicador de publicação e ação "ver página pública".
 */
export function ChampionshipHeader({ championship }: { championship: Championship }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.065] bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[var(--layout-max-width)] items-center justify-between gap-3 px-[var(--content-padding-x)]">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link to="/championships" aria-label="Voltar aos campeonatos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-neon">
            <Trophy className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-extrabold tracking-[-0.02em] sm:text-base">
              {championship.name}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="truncate">{championship.season || "Sem temporada"}</span>
              <span aria-hidden>·</span>
              <Badge variant="secondary" className="h-4 px-1.5 py-0 text-[8px]">
                {CHAMPIONSHIP_STATUS_LABELS[championship.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 text-[9px] font-semibold text-muted-foreground sm:flex"
            title={championship.is_public ? "Publicado" : "Não publicado"}
          >
            {championship.is_public ? (
              <>
                <Globe2 className="h-3 w-3 text-neon" /> Publicado
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> Privado
              </>
            )}
          </span>

          <ChampionshipSwitcher currentId={championship.id} />

          {championship.is_public && (
            <Button variant="outline" size="sm" className="hidden h-8 sm:inline-flex" asChild>
              <a href={`/c/${championship.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Página pública
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
