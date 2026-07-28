import { supabase } from "@/integrations/supabase/client";
import type {
  SystemAdminChampionshipRow,
  SystemAdminDashboardData,
  SystemAdminDirectoryKind,
  SystemAdminDirectoryRow,
  SystemAdminOrganizationRow,
  SystemAdminPage,
  SystemAdminSubscriptionRow,
  SystemAdminUserRow,
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
