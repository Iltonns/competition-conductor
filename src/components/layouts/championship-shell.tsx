import type { ReactNode } from "react";
import { ChampionshipHeader } from "@/components/layouts/championship-header";
import {
  ChampionshipSidebar,
  ChampionshipMobileNav,
} from "@/features/championships/components/ChampionshipSidebar";
import type { Championship } from "@/features/championships/types/championship.types";

/**
 * Championship Shell — Fase 2.
 *
 * Sidebar lateral fixa no desktop. No mobile, a navegação é feita pelos
 * chips rápidos + Sheet "Mais" já embutidos no ChampionshipSidebar — sem
 * bottom-nav separado.
 */
export function ChampionshipShell({
  championship,
  children,
}: {
  championship: Championship;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen flex-col">
        <ChampionshipHeader championship={championship} />

        <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 items-stretch gap-4 px-[var(--content-padding-x)] pb-8 pt-[var(--content-padding-y)]">
          <ChampionshipSidebar championshipId={championship.id} />
          <main id="main-content" className="min-w-0 flex-1">
            <ChampionshipMobileNav championshipId={championship.id} />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
