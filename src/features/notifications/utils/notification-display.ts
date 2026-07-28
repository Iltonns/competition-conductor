import type { NotificationType } from "../types/notification.types";

export const NOTIFICATION_LABELS: Record<NotificationType, { title: string; description: string }> =
  {
    organization_invitation: {
      title: "Convites e acesso",
      description: "Entrada em uma organização e provisionamento de acesso.",
    },
    registration_submitted: {
      title: "Inscrições enviadas",
      description: "Novas inscrições aguardando análise.",
    },
    registration_review_requested: {
      title: "Revisões de inscrição",
      description: "Solicitações de ajuste em inscrições enviadas.",
    },
    match_changed: {
      title: "Alterações de partida",
      description: "Mudanças de data, local, participantes ou status.",
    },
    referee_assigned: {
      title: "Escalas de arbitragem",
      description: "Criação e alteração de escalas.",
    },
    publication_published: {
      title: "Publicações relevantes",
      description: "Novos conteúdos publicados no campeonato.",
    },
  };

export function safeNotificationPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}
