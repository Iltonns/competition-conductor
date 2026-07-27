import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeOrganizationMemberRole,
  getManageableOrganizations,
  getOrganizationAdminContext,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  saveOrganizationProfile,
} from "../api/organization-settings";
import {
  inviteOrganizationUser,
  resendOrganizationInvitation,
} from "../api/organization-invitations.functions";
import type {
  OrganizationProfileInput,
  OrganizationRole,
} from "../types/organization-settings.types";

const organizationsKey = ["manageable-organizations"] as const;
const contextKey = (organizationId: string | null) =>
  ["organization-admin-context", organizationId] as const;

export function useManageableOrganizations() {
  return useQuery({ queryKey: organizationsKey, queryFn: getManageableOrganizations });
}

export function useOrganizationSettings(organizationId: string | null) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: contextKey(organizationId) }),
      queryClient.invalidateQueries({ queryKey: organizationsKey }),
    ]);
  };

  const query = useQuery({
    queryKey: contextKey(organizationId),
    queryFn: () => getOrganizationAdminContext(organizationId!),
    enabled: Boolean(organizationId),
  });

  return {
    ...query,
    saveProfile: useMutation({
      mutationFn: (profile: OrganizationProfileInput) =>
        saveOrganizationProfile(organizationId!, profile),
      onSuccess: refresh,
    }),
    invite: useMutation({
      mutationFn: (input: { email: string; role: "admin" | "editor" | "viewer" }) =>
        inviteOrganizationUser({ data: { organizationId: organizationId!, ...input } }),
      onSuccess: refresh,
    }),
    resendInvitation: useMutation({
      mutationFn: (invitationId: string) =>
        resendOrganizationInvitation({ data: { invitationId } }),
      onSuccess: refresh,
    }),
    revokeInvitation: useMutation({
      mutationFn: ({ invitationId, reason }: { invitationId: string; reason: string }) =>
        revokeOrganizationInvitation(invitationId, reason),
      onSuccess: refresh,
    }),
    changeRole: useMutation({
      mutationFn: ({
        userId,
        role,
        reason,
      }: {
        userId: string;
        role: OrganizationRole;
        reason: string;
      }) => changeOrganizationMemberRole(organizationId!, userId, role, reason),
      onSuccess: refresh,
    }),
    removeMember: useMutation({
      mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
        removeOrganizationMember(organizationId!, userId, reason),
      onSuccess: refresh,
    }),
  };
}
