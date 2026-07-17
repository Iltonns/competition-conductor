import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_organizer/sponsors")({
  component: () => (
    <ComingSoon
      title="Patrocinadores"
      description="Gerencie marcas parceiras e os espaços de exposição em portais e campeonatos."
    />
  ),
});
