import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/_organizer/settings")({
  component: () => (
    <ComingSoon
      title="Configurações"
      description="Personalize a organização, permissões, notificações e preferências da plataforma."
    />
  ),
});
