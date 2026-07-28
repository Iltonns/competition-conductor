import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getSystemAdminDashboard, listSystemAdminDirectory } from "../api/system-admin";
import type { SystemAdminDirectoryKind } from "../types/system-admin.types";

export function useSystemAdminDashboard() {
  return useQuery({
    queryKey: ["system-admin", "dashboard"],
    queryFn: getSystemAdminDashboard,
  });
}

export function useSystemAdminDirectory(
  kind: SystemAdminDirectoryKind,
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
