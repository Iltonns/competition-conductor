import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  exportChampionshipAuditLogs,
  getChampionshipAuditLogs,
  type AuditFilters,
} from "../api/audit";

export function useAuditLogs(
  championshipId: string,
  page: number,
  pageSize: number,
  filters: AuditFilters,
) {
  const query = useQuery({
    queryKey: ["audit", championshipId, page, pageSize, filters],
    queryFn: () => getChampionshipAuditLogs(championshipId, page, pageSize, filters),
    placeholderData: keepPreviousData,
  });

  return {
    ...query,
    exportLogs: useMutation({
      mutationFn: () => exportChampionshipAuditLogs(championshipId, filters),
    }),
  };
}
