import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AuditActor {
  id: string | null;
  name: string;
}

export interface AuditLogItem {
  id: string;
  championship_id: string;
  actor_id: string | null;
  actor_name: string;
  module: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_data: Json | null;
  new_data: Json | null;
  context: Json;
  created_at: string;
}

export interface AuditFilters {
  actorId: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  dateFrom: string;
  dateTo: string;
}

export interface AuditLogData {
  items: AuditLogItem[];
  total: number;
  page: number;
  page_size: number;
  retention_months: number;
  filters: {
    actions: string[];
    entity_types: string[];
    actors: AuditActor[];
  };
}

export interface AuditExportItem {
  id: string;
  actor_id: string | null;
  actor_name: string;
  module: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  context: Json;
  created_at: string;
}

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

function rpcFilters(filters: AuditFilters) {
  return {
    p_actor_id: filters.actorId || null,
    p_action: filters.action || null,
    p_module: filters.module || null,
    p_entity_type: filters.entityType || null,
    p_entity_id: filters.entityId || null,
    p_date_from: filters.dateFrom ? `${filters.dateFrom}T00:00:00` : null,
    p_date_to: filters.dateTo ? `${filters.dateTo}T23:59:59.999` : null,
  };
}

export function getChampionshipAuditLogs(
  championshipId: string,
  page: number,
  pageSize: number,
  filters: AuditFilters,
) {
  return callRpc<AuditLogData>("get_championship_audit_logs", {
    p_championship_id: championshipId,
    p_page: page,
    p_page_size: pageSize,
    ...rpcFilters(filters),
  });
}

export function exportChampionshipAuditLogs(championshipId: string, filters: AuditFilters) {
  return callRpc<AuditExportItem[]>("export_championship_audit_logs", {
    p_championship_id: championshipId,
    ...rpcFilters(filters),
  });
}
