export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";

export type LimitState = "unlimited" | "ok" | "warning" | "blocked";

export interface ResourceUsage {
  used: number;
  limit: number | null;
  percentage: number | null;
  state: LimitState;
}

export interface OrganizationSubscriptionContext {
  organization: {
    id: string;
    name: string;
  };
  subscription: {
    id: string;
    status: SubscriptionStatus;
    trial_ends_at: string | null;
    current_period_starts_at: string;
    current_period_ends_at: string | null;
    provider_connected: boolean;
  };
  plan: {
    id: string;
    code: string;
    version: number;
    name: string;
    description: string | null;
    modules: string[];
  };
  usage: {
    organizations: ResourceUsage;
    active_championships: ResourceUsage;
    teams: ResourceUsage;
    users: ResourceUsage;
    storage_bytes: ResourceUsage;
  };
}
