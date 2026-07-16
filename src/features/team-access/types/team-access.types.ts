import type { Database, Json } from "@/integrations/supabase/types";

export const TEAM_ACCESS_PERMISSION_KEYS = [
  "edit_team_details",
  "change_crest",
  "change_cover",
  "edit_contacts",
  "edit_responsibles",
  "edit_staff",
  "add_athletes",
  "edit_athletes",
  "remove_athletes",
  "change_shirt_number",
  "add_documents",
  "submit_for_review",
] as const;

export type TeamAccessPermissionKey = (typeof TEAM_ACCESS_PERMISSION_KEYS)[number];
export type TeamAccessPermissions = Record<TeamAccessPermissionKey, boolean>;

export const DEFAULT_TEAM_ACCESS_PERMISSIONS: TeamAccessPermissions = {
  edit_team_details: true,
  change_crest: true,
  change_cover: true,
  edit_contacts: true,
  edit_responsibles: true,
  edit_staff: true,
  add_athletes: true,
  edit_athletes: true,
  remove_athletes: false,
  change_shirt_number: true,
  add_documents: true,
  submit_for_review: false,
};

export const TEAM_ACCESS_PERMISSION_LABELS: Record<TeamAccessPermissionKey, string> = {
  edit_team_details: "Editar dados gerais da equipe",
  change_crest: "Alterar escudo",
  change_cover: "Alterar imagem de capa",
  edit_contacts: "Editar contatos",
  edit_responsibles: "Editar dirigentes",
  edit_staff: "Editar comissão técnica",
  add_athletes: "Adicionar atletas",
  edit_athletes: "Editar atletas",
  remove_athletes: "Retirar atletas",
  change_shirt_number: "Alterar número da camisa",
  add_documents: "Adicionar documentos",
  submit_for_review: "Enviar cadastro para análise",
};

export type TeamAccessStoredStatus = "active" | "blocked" | "revoked" | "replaced";
export type TeamAccessState =
  | TeamAccessStoredStatus
  | "valid"
  | "expired"
  | "invalid"
  | "unavailable"
  | "access_limit"
  | "rate_limited"
  | "not_generated";

export type TeamEditLinkRow = Database["public"]["Tables"]["team_edit_links"]["Row"];
export type TeamEditLinkEventRow = Database["public"]["Tables"]["team_edit_link_events"]["Row"];

export interface TeamAccessStatus extends Omit<
  TeamEditLinkRow,
  "token_hash" | "metadata" | "permissions"
> {
  permissions: TeamAccessPermissions;
  effectiveStatus: TeamAccessState;
}

export interface GeneratedTeamAccess {
  linkId: string;
  url: string;
  expiresAt: string;
}

export interface PublicTeamAccess {
  state: TeamAccessState;
  sessionExpiresAt: string | null;
  championshipName: string | null;
  championshipLogoUrl: string | null;
  teamName: string | null;
  teamCrestUrl: string | null;
  expiresAt: string | null;
  permissions: TeamAccessPermissions;
}

export function permissionsFromJson(value: Json | null): TeamAccessPermissions {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(
    TEAM_ACCESS_PERMISSION_KEYS.map((key) => [key, source[key] === true]),
  ) as TeamAccessPermissions;
}
