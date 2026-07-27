import { supabase } from "@/integrations/supabase/client";
import type {
  ManageableOrganization,
  OrganizationAdminContext,
  OrganizationProfileInput,
  OrganizationRole,
} from "../types/organization-settings.types";

async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function getManageableOrganizations() {
  return rpc<ManageableOrganization[]>("get_manageable_organizations");
}

export function getOrganizationAdminContext(organizationId: string) {
  return rpc<OrganizationAdminContext>("get_organization_admin_context", {
    p_organization_id: organizationId,
  });
}

export function saveOrganizationProfile(organizationId: string, profile: OrganizationProfileInput) {
  return rpc<OrganizationAdminContext>("save_organization_profile", {
    p_organization_id: organizationId,
    p_profile: profile,
  });
}

export function changeOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationRole,
  reason: string,
) {
  return rpc<void>("change_organization_member_role", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_new_role: role,
    p_reason: reason,
  });
}

export function removeOrganizationMember(organizationId: string, userId: string, reason: string) {
  return rpc<void>("remove_organization_member", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_reason: reason,
  });
}

export function revokeOrganizationInvitation(invitationId: string, reason: string) {
  return rpc<void>("revoke_organization_invitation", {
    p_invitation_id: invitationId,
    p_reason: reason,
  });
}
