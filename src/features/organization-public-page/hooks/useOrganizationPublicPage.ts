import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationPublicPageSettings,
  saveOrganizationPublicPage,
  setOrganizationPublicPageStatus,
} from "../api/organization-public-page";
import type { OrganizationPublicPageInput } from "../types/organization-public-page.types";

const pageKey = (organizationId: string | null) =>
  ["organization-public-page", organizationId] as const;

export function useOrganizationPublicPage(organizationId: string | null) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: pageKey(organizationId) });

  const query = useQuery({
    queryKey: pageKey(organizationId),
    queryFn: () => getOrganizationPublicPageSettings(organizationId!),
    enabled: Boolean(organizationId),
  });

  return {
    ...query,
    save: useMutation({
      mutationFn: (input: OrganizationPublicPageInput) =>
        saveOrganizationPublicPage(organizationId!, input),
      onSuccess: refresh,
    }),
    setPublished: useMutation({
      mutationFn: (publish: boolean) => setOrganizationPublicPageStatus(organizationId!, publish),
      onSuccess: refresh,
    }),
  };
}
