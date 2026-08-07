import { useMemo } from "react";
import { useManageableOrganizations } from "@/features/organization-settings/hooks/useOrganizationSettings";
import { useOrganizationSubscription } from "./useSubscription";
import type { OrganizationRole } from "@/features/organization-settings/types/organization-settings.types";

/**
 * Plano e papel da organização para o chrome do app — badge da sidebar,
 * card de plano em "Meus campeonatos" e banners de upsell.
 *
 * Dentro de um campeonato o `organizationId` vem do contexto; no nível
 * organizador não existe campeonato ativo, então caímos na primeira
 * organização que o usuário administra.
 *
 * `get_organization_subscription_context` é owner-only no backend
 * (`assert_organization_owner`), então a query só é disparada quando o papel
 * do usuário naquela organização é `owner`. Para os demais papéis `plan` fica
 * `null` e quem consome deve simplesmente não renderizar o elemento de plano.
 */
export function useCurrentPlan(organizationId?: string | null) {
  const organizations = useManageableOrganizations();

  const resolvedId = useMemo(() => {
    const list = organizations.data ?? [];
    if (organizationId) return organizationId;
    return list.find((organization) => organization.role === "owner")?.id ?? list[0]?.id ?? null;
  }, [organizationId, organizations.data]);

  const role: OrganizationRole | null =
    organizations.data?.find((organization) => organization.id === resolvedId)?.role ?? null;

  const isOwner = role === "owner";
  const subscription = useOrganizationSubscription(isOwner ? resolvedId : null);

  return {
    organizationId: resolvedId,
    role,
    isOwner,
    plan: subscription.data?.plan ?? null,
    subscription: subscription.data?.subscription ?? null,
    usage: subscription.data?.usage ?? null,
    modules: subscription.data?.plan.modules ?? [],
    isLoading: organizations.isLoading || (isOwner && subscription.isLoading),
  };
}

/** Rótulo em pt-BR para o papel do usuário na organização. */
export const ORGANIZATION_ROLE_LABEL: Record<OrganizationRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

/** Papéis que podem criar, editar e remover equipes/atletas. */
export function canManageRoster(role: OrganizationRole | null) {
  return role === "owner" || role === "admin" || role === "editor";
}
