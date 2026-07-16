import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  blockTeamEditLink,
  extendTeamEditLinkExpiration,
  generateTeamEditLink,
  getTeamEditLinkHistory,
  getTeamEditLinkStatus,
  revokeTeamEditLink,
  unblockTeamEditLink,
  updateTeamEditLinkPermissions,
} from "../api/team-access.functions";
import type { TeamAccessPermissions } from "../types/team-access.types";

export const teamAccessKeys = {
  status: (championshipId: string, teamId: string) =>
    ["team-access", "status", championshipId, teamId] as const,
  history: (championshipId: string, teamId: string) =>
    ["team-access", "history", championshipId, teamId] as const,
};

export function useTeamAccessStatus(championshipId: string, teamId: string) {
  return useQuery({
    queryKey: teamAccessKeys.status(championshipId, teamId),
    queryFn: () => getTeamEditLinkStatus({ data: { championshipId, teamId } }),
    enabled: Boolean(championshipId && teamId),
    staleTime: 15_000,
  });
}

export function useTeamAccessHistory(championshipId: string, teamId: string, enabled = true) {
  return useQuery({
    queryKey: teamAccessKeys.history(championshipId, teamId),
    queryFn: () => getTeamEditLinkHistory({ data: { championshipId, teamId } }),
    enabled: enabled && Boolean(championshipId && teamId),
    staleTime: 15_000,
  });
}

function useRefreshTeamAccess(championshipId: string, teamId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: teamAccessKeys.status(championshipId, teamId) }),
      queryClient.invalidateQueries({ queryKey: teamAccessKeys.history(championshipId, teamId) }),
    ]);
}

export function useGenerateTeamAccess(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: (input: {
      expiresAt: string;
      permissions: TeamAccessPermissions;
      adminNote?: string | null;
    }) =>
      generateTeamEditLink({
        data: { championshipId, teamId, ...input },
      }),
    onSuccess: refresh,
  });
}

export function useBlockTeamAccess(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: ({ linkId, reason }: { linkId: string; reason: string }) =>
      blockTeamEditLink({ data: { linkId, reason } }),
    onSuccess: refresh,
  });
}

export function useUnblockTeamAccess(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: (linkId: string) => unblockTeamEditLink({ data: { linkId } }),
    onSuccess: refresh,
  });
}

export function useRevokeTeamAccess(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: ({ linkId, reason }: { linkId: string; reason: string }) =>
      revokeTeamEditLink({ data: { linkId, reason } }),
    onSuccess: refresh,
  });
}

export function useExtendTeamAccess(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: ({ linkId, expiresAt }: { linkId: string; expiresAt: string }) =>
      extendTeamEditLinkExpiration({ data: { linkId, expiresAt } }),
    onSuccess: refresh,
  });
}

export function useUpdateTeamAccessPermissions(championshipId: string, teamId: string) {
  const refresh = useRefreshTeamAccess(championshipId, teamId);
  return useMutation({
    mutationFn: ({ linkId, permissions }: { linkId: string; permissions: TeamAccessPermissions }) =>
      updateTeamEditLinkPermissions({ data: { linkId, permissions } }),
    onSuccess: refresh,
  });
}
