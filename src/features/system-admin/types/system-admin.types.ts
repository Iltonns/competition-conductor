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

export interface SupportSession {
  id: string;
  organization_id: string;
  organization_name: string;
  reason: string;
  started_at: string;
  expires_at: string;
}

export interface SupportSessionContext {
  session: {
    id: string;
    organization_id: string;
    reason: string;
    started_at: string;
    expires_at: string;
    read_only: true;
  };
  organization: {
    id: string;
    name: string;
    slug: string | null;
    city: string | null;
    state: string | null;
    created_at: string;
  };
  metrics: {
    members: number;
    championships: number;
    active_championships: number;
    teams: number;
  };
  subscription: {
    status: string;
    plan_code: string;
    plan_name: string;
    plan_version: number;
    current_period_ends_at: string | null;
  } | null;
  recent_championships: Array<{
    id: string;
    name: string;
    status: string;
    is_public: boolean;
    created_at: string;
  }>;
}

export type AdminAuditAlertCategory = "plan" | "suspension" | "support" | "privileged" | "general";

export type AdminAuditSeverity = "critical" | "warning" | "info";

export interface AdminAuditFilters {
  search: string;
  actorUserId: string;
  action: string;
  targetType: string;
  alertCategory: AdminAuditAlertCategory | "";
  dateFrom: string;
  dateTo: string;
}

export interface AdminAuditLogItem {
  id: string;
  actor_user_id: string | null;
  actor_name: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  old_data: unknown;
  new_data: unknown;
  context: unknown;
  occurred_at: string;
  alert_category: AdminAuditAlertCategory;
  severity: AdminAuditSeverity;
}

export interface AdminAuditPage {
  items: AdminAuditLogItem[];
  total: number;
  limit: number;
  offset: number;
  alert_counts: Record<Exclude<AdminAuditAlertCategory, "general">, number>;
  filter_options: {
    actions: string[];
    target_types: string[];
    actors: Array<{
      id: string;
      name: string;
      email: string | null;
    }>;
  };
  retention: {
    mode: "indefinite";
    automatic_deletion: false;
  };
}
