import { supabase } from "@/integrations/supabase/client";
import type {
  OrganizationPublicPageInput,
  OrganizationPublicPageSettings,
  PublicOrganizationPortal,
} from "../types/organization-public-page.types";

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function getOrganizationPublicPageSettings(organizationId: string) {
  return rpc<OrganizationPublicPageSettings>("get_organization_public_page_settings", {
    p_organization_id: organizationId,
  });
}

export function saveOrganizationPublicPage(
  organizationId: string,
  payload: OrganizationPublicPageInput,
) {
  return rpc<OrganizationPublicPageSettings>("save_organization_public_page", {
    p_organization_id: organizationId,
    p_payload: payload,
  });
}

export function setOrganizationPublicPageStatus(organizationId: string, publish: boolean) {
  return rpc<OrganizationPublicPageSettings>("set_organization_public_page_status", {
    p_organization_id: organizationId,
    p_publish: publish,
  });
}

export function getPublicOrganizationPortal(slug: string) {
  return rpc<PublicOrganizationPortal | null>("get_public_organization_portal", {
    p_slug: slug,
  });
}
