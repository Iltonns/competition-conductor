import { createFileRoute, Outlet } from "@tanstack/react-router";
import { OrganizerShell } from "@/components/layouts/organizer-shell";

/**
 * Layout pathless do Organizer Shell (plano seções 3.2 e 8, Etapa 1).
 *
 * Todo arquivo dentro de `_organizer/` (campeonatos, equipes, atletas,
 * organização/configurações) recebe o menu global do organizador. Rotas
 * de dentro de um campeonato (`championships_.$id.*`) ficam FORA desta
 * pasta de propósito — elas usam o `ChampionshipShell`, não este layout.
 */
export const Route = createFileRoute("/_authenticated/_organizer")({
  component: () => (
    <OrganizerShell>
      <Outlet />
    </OrganizerShell>
  ),
});
