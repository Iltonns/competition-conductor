import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endSupportSession,
  getMyActiveSupportSession,
  getPlatformOperationalStatus,
  getSupportSessionContext,
  getSystemAdminAuditLogs,
  getSystemAdminDashboard,
  listSystemAdminDirectory,
  startSupportSession,
} from "../api/system-admin";
import type { AdminAuditFilters, SystemAdminDirectoryKind } from "../types/system-admin.types";

export function useSystemAdminDashboard() {
  return useQuery({
    queryKey: ["system-admin", "dashboard"],
    queryFn: getSystemAdminDashboard,
  });
}

export function useSystemAdminDirectory<K extends SystemAdminDirectoryKind>(
  kind: K,
  search: string,
  page: number,
  limit = 25,
) {
  return useQuery({
    queryKey: ["system-admin", kind, search, page, limit],
    queryFn: () =>
      listSystemAdminDirectory(kind, {
        search,
        limit,
        offset: page * limit,
      }),
    placeholderData: keepPreviousData,
  });
}

const activeSupportKey = ["system-admin", "support", "active"] as const;

export function useActiveSupportSession() {
  return useQuery({
    queryKey: activeSupportKey,
    queryFn: getMyActiveSupportSession,
    refetchInterval: 30_000,
  });
}

export function useSupportSessionContext(sessionId: string | null) {
  return useQuery({
    queryKey: ["system-admin", "support", "context", sessionId],
    queryFn: () => getSupportSessionContext(sessionId!),
    enabled: Boolean(sessionId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useSupportSessionActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: activeSupportKey });

  return {
    start: useMutation({
      mutationFn: startSupportSession,
      onSuccess: refresh,
    }),
    end: useMutation({
      mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
        endSupportSession(sessionId, reason),
      onSuccess: async () => {
        await refresh();
        queryClient.removeQueries({ queryKey: ["system-admin", "support", "context"] });
      },
    }),
  };
}

export function useSystemAdminAudit(filters: AdminAuditFilters, page: number, limit = 25) {
  return useQuery({
    queryKey: ["system-admin", "audit", filters, page, limit],
    queryFn: () => getSystemAdminAuditLogs(filters, limit, page * limit),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformOperationalStatus() {
  return useQuery({
    queryKey: ["system-admin", "operational-status"],
    queryFn: getPlatformOperationalStatus,
    refetchInterval: 60_000,
  });
}
