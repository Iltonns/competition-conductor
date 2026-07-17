import type { ReactNode } from "react";
import { Home, Shield, Users } from "lucide-react";
import { ChampionshipHeader } from "@/components/layouts/championship-header";
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav";
import { ChampionshipSidebar } from "@/features/championships/components/ChampionshipSidebar";
import type { Championship } from "@/features/championships/types/championship.types";

/**
 * Championship Shell — "Cockpit do Campeonato" (plano seção 3.3).
 *
 * Renderizado no lugar do Organizer Shell (nunca junto) enquanto o usuário
 * navega em `/championships/$id/**`. Fornece o cabeçalho persistente, o
 * menu único do campeonato e a navegação inferior contextual do mobile.
 */
export function ChampionshipShell({
  championship,
  children,
}: {
  championship: Championship;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-arena text-foreground">
      <div className="pointer-events-none fixed inset-0 arena-grid opacity-35" />
      <div className="relative flex min-h-screen flex-col">
        <ChampionshipHeader championship={championship} />

        <div className="mx-auto flex w-full max-w-[var(--layout-max-width)] flex-1 items-start gap-4 px-[var(--content-padding-x)] pb-28 pt-[var(--content-padding-y)] lg:pb-8">
          <ChampionshipSidebar championshipId={championship.id} />
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>

      {/*
        Alvo final do plano (seção 6): Início / Jogos / Tabela / Equipes / Mais.
        "Partidas", "Classificação" e o item "Mais" (para os demais módulos)
        dependem de rotas ainda não conectadas ao `championshipId` (Etapa 4).
        Até lá, o acesso aos módulos "Em breve" no mobile é feito pelo botão
        "Mais" já embutido no `ChampionshipSidebar` (chips + sheet no topo do
        conteúdo), evitando linkar a navegação inferior para rotas 404.
      */}
      <MobileBottomNav
        items={[
          { to: `/championships/${championship.id}`, label: "Início", icon: Home },
          { to: `/championships/${championship.id}/teams`, label: "Equipes", icon: Shield },
          { to: `/championships/${championship.id}/athletes`, label: "Atletas", icon: Users },
        ]}
      />
    </div>
  );
}
