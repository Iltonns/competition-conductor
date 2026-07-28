import { supabase } from "@/integrations/supabase/client";
import type {
  AdminAuditFilters,
  AdminAuditPage,
  PlatformOperationalStatus,
  SystemAdminChampionshipRow,
  SystemAdminDashboardData,
  SystemAdminDirectoryKind,
  SystemAdminDirectoryRow,
  SystemAdminOrganizationRow,
  SystemAdminPage,
  SystemAdminSubscriptionRow,
  SystemAdminUserRow,
  SupportSession,
  SupportSessionContext,
} from "../types/system-admin.types";

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function getSystemAdminDashboard() {
  return rpc<SystemAdminDashboardData>("get_system_admin_dashboard");
}

type DirectoryRowByKind = {
  organizations: SystemAdminOrganizationRow;
  users: SystemAdminUserRow;
  championships: SystemAdminChampionshipRow;
  subscriptions: SystemAdminSubscriptionRow;
};

const directoryRpc: Record<SystemAdminDirectoryKind, string> = {
  organizations: "list_system_admin_organizations",
  users: "list_system_admin_users",
  championships: "list_system_admin_championships",
  subscriptions: "list_system_admin_subscriptions",
};

export function listSystemAdminDirectory<K extends SystemAdminDirectoryKind>(
  kind: K,
  input: { search: string; limit: number; offset: number },
) {
  return rpc<SystemAdminPage<DirectoryRowByKind[K]>>(directoryRpc[kind], {
    p_search: input.search || null,
    p_limit: input.limit,
    p_offset: input.offset,
  });
}

export type AnySystemAdminPage = SystemAdminPage<SystemAdminDirectoryRow>;

export function getMyActiveSupportSession() {
  return rpc<SupportSession | null>("get_my_active_support_session");
}

export function startSupportSession(input: {
  organizationId: string;
  reason: string;
  durationMinutes: number;
}) {
  return rpc<SupportSession>("start_support_session", {
    p_organization_id: input.organizationId,
    p_reason: input.reason,
    p_duration_minutes: input.durationMinutes,
  });
}

export function getSupportSessionContext(sessionId: string) {
  return rpc<SupportSessionContext>("get_support_session_context", {
    p_session_id: sessionId,
  });
}

export function endSupportSession(sessionId: string, reason: string) {
  return rpc<void>("end_support_session", {
    p_session_id: sessionId,
    p_reason: reason,
  });
}

export function getSystemAdminAuditLogs(filters: AdminAuditFilters, limit: number, offset: number) {
  return rpc<AdminAuditPage>("get_system_admin_audit_logs", {
    p_search: filters.search || null,
    p_actor_user_id: filters.actorUserId || null,
    p_action: filters.action || null,
    p_target_type: filters.targetType || null,
    p_alert_category: filters.alertCategory || null,
    p_date_from: filters.dateFrom ? `${filters.dateFrom}T00:00:00` : null,
    p_date_to: filters.dateTo ? `${filters.dateTo}T23:59:59.999` : null,
    p_limit: limit,
    p_offset: offset,
  });
}

export function getPlatformOperationalStatus() {
  return rpc<PlatformOperationalStatus>("get_platform_operational_status");
}
