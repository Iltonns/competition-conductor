import { supabase } from "@/integrations/supabase/client";

export const INTEGRATION_KEYS = [
  "registration_finance",
  "sponsorship_finance",
  "refereeing_finance",
] as const;

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export interface ChampionshipSettingsIdentity {
  id: string;
  organization_id: string;
  name: string;
  season: string | null;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  logo_url: string | null;
  status: string;
  is_public: boolean;
}

export interface NotificationPreferences {
  registration_updates: boolean;
  match_changes: boolean;
  referee_updates: boolean;
  publication_updates: boolean;
}

export interface ChampionshipOperationalPreferences {
  timezone: string;
  locale: "pt-BR" | "en-US" | "es-ES";
  notification_preferences: NotificationPreferences;
  enabled_integrations: IntegrationKey[];
}

export interface ChampionshipDependencySummary {
  matches: number;
  teams: number;
  registrations: number;
  stages: number;
  financial_transactions: number;
  content: number;
  sports_operations: number;
  audit_logs: number;
}

export interface ChampionshipSettingsData {
  identity: ChampionshipSettingsIdentity;
  preferences: ChampionshipOperationalPreferences;
  governance: {
    dependencies: ChampionshipDependencySummary;
    dependency_total: number;
    can_permanently_delete: boolean;
  };
}

export interface ChampionshipIdentityInput {
  name: string;
  season: string;
  description: string;
  starts_at: string;
  ends_at: string;
  city: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  instagram_url: string;
}

export interface SaveChampionshipSettingsInput {
  identity: ChampionshipIdentityInput;
  timezone: string;
  locale: ChampionshipOperationalPreferences["locale"];
  notificationPreferences: NotificationPreferences;
  enabledIntegrations: IntegrationKey[];
}

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function getChampionshipOperationalSettings(championshipId: string) {
  return callRpc<ChampionshipSettingsData>("get_championship_operational_settings", {
    p_championship_id: championshipId,
  });
}

export function saveChampionshipOperationalSettings(
  championshipId: string,
  input: SaveChampionshipSettingsInput,
) {
  return callRpc<ChampionshipSettingsData>("save_championship_operational_settings", {
    p_championship_id: championshipId,
    p_identity: input.identity,
    p_timezone: input.timezone,
    p_locale: input.locale,
    p_notification_preferences: input.notificationPreferences,
    p_enabled_integrations: input.enabledIntegrations,
  });
}

export function archiveChampionship(championshipId: string, confirmation: string, reason: string) {
  return callRpc<ChampionshipSettingsIdentity>("archive_championship", {
    p_championship_id: championshipId,
    p_confirmation: confirmation,
    p_reason: reason,
  });
}

export function deleteChampionshipPermanently(
  championshipId: string,
  confirmation: string,
  reason: string,
) {
  return callRpc<void>("delete_championship_permanently", {
    p_championship_id: championshipId,
    p_confirmation: confirmation,
    p_reason: reason,
  });
}
