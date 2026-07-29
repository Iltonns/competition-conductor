export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "suspended";

export type LimitState = "unlimited" | "ok" | "warning" | "blocked";

export interface ResourceUsage {
  used: number;
  limit: number | null;
  percentage: number | null;
  state: LimitState;
}

export interface CommercialPlan {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  monthly_price_cents: number;
  currency: string;
  limits: {
    athletes_per_championship: number | null;
    sponsors_per_championship: number | null;
  };
  modules: string[];
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

export type PlanChangeType = "renewal" | "upgrade" | "downgrade";

export interface PlanChangePreview {
  change_type: PlanChangeType;
  has_restrictions: boolean;
  data_preserved: true;
  enforcement: "new_writes_only";
  current_plan: {
    id: string;
    code: string;
    version: number;
    name: string;
    monthly_price_cents: number;
  };
  target_plan: {
    id: string;
    code: string;
    version: number;
    name: string;
    monthly_price_cents: number;
  };
  lost_modules: string[];
  resource_impacts: Array<{
    resource: "organizations" | "active_championships" | "teams" | "users" | "storage_bytes";
    used: number;
    current_limit: number | null;
    target_limit: number | null;
    limit_reduced: boolean;
    exceeds_target: boolean;
  }>;
  championship_impacts: {
    athletes_per_championship_limit: number | null;
    sponsors_per_championship_limit: number | null;
    championships_over_athlete_limit: number;
    championships_over_sponsor_limit: number;
    max_athletes_in_championship: number;
    max_sponsors_in_championship: number;
  };
}
