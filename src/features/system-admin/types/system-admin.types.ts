export type SystemAdminDirectoryKind =
  "organizations" | "users" | "championships" | "subscriptions";

export interface SystemAdminDashboardData {
  metrics: {
    organizations: number;
    users: number;
    championships: number;
    active_subscriptions: number;
    storage_bytes: number;
  };
  subscription_statuses: Record<string, number>;
  alerts: {
    past_due_subscriptions: number;
    suspended_subscriptions: number;
    organizations_without_subscription: number;
  };
  generated_at: string;
}

export interface SystemAdminOrganizationRow {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  members_count: number;
  championships_count: number;
  subscription_status: string | null;
  plan_code: string | null;
  plan_name: string | null;
}

export interface SystemAdminUserRow {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  organizations_count: number;
  is_system_admin: boolean;
}

export interface SystemAdminChampionshipRow {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
  organization_name: string;
  status: string;
  is_public: boolean;
  created_at: string;
}

export interface SystemAdminSubscriptionRow {
  id: string;
  organization_id: string;
  organization_name: string;
  status: string;
  plan_code: string;
  plan_name: string;
  plan_version: number;
  provider_connected: boolean;
  current_period_ends_at: string | null;
  updated_at: string;
}

export type SystemAdminDirectoryRow =
  | SystemAdminOrganizationRow
  | SystemAdminUserRow
  | SystemAdminChampionshipRow
  | SystemAdminSubscriptionRow;

export interface SystemAdminPage<T extends SystemAdminDirectoryRow> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
