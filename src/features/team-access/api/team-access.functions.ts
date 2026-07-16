import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import {
  exchangeTeamAccessSchema,
  extendTeamAccessSchema,
  generateTeamAccessSchema,
  teamAccessLinkActionSchema,
  teamAccessReasonSchema,
  teamAccessTargetSchema,
  updateTeamAccessPermissionsSchema,
} from "../schemas/team-access.schema";
import {
  DEFAULT_TEAM_ACCESS_PERMISSIONS,
  permissionsFromJson,
  type GeneratedTeamAccess,
  type PublicTeamAccess,
  type TeamAccessState,
  type TeamAccessStatus,
} from "../types/team-access.types";

const SESSION_COOKIE = "is_arena_team_access";
const LINK_SELECT =
  "id,organization_id,championship_id,championship_team_id,team_id,token_prefix,status,expires_at,last_accessed_at,access_count,max_access_count,created_at,created_by,updated_at,updated_by,revoked_at,revoked_by,revocation_reason,blocked_at,blocked_by,block_reason,replaced_at,replaced_by,replaced_by_link_id,permissions" as const;

function safeDomainError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("forbidden") || message.includes("Acesso negado")) {
    return new Error("team_access:forbidden");
  }
  if (message.includes("invalid_expiration")) return new Error("team_access:invalid_expiration");
  if (message.includes("invalid_permissions")) return new Error("team_access:invalid_permissions");
  if (message.includes("reason_required")) return new Error("team_access:reason_required");
  if (message.includes("not_found")) return new Error("team_access:not_found");
  if (message.includes("not_active") || message.includes("not_blocked")) {
    return new Error("team_access:invalid_state");
  }
  return new Error("team_access:operation_failed");
}

function effectiveState(status: string, expiresAt: string): TeamAccessState {
  if ((status === "active" || status === "blocked") && Date.parse(expiresAt) <= Date.now()) {
    return "expired";
  }
  return status as TeamAccessState;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const bytes = new Uint8Array(digest);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function mapPublicAccess(
  row: {
    access_state: string;
    session_expires_at: string | null;
    championship_name: string | null;
    championship_logo_url: string | null;
    team_name: string | null;
    team_crest_url: string | null;
    link_expires_at: string | null;
    effective_permissions: Json | null;
  } | null,
): PublicTeamAccess {
  if (!row) {
    return {
      state: "invalid",
      sessionExpiresAt: null,
      championshipName: null,
      championshipLogoUrl: null,
      teamName: null,
      teamCrestUrl: null,
      expiresAt: null,
      permissions: DEFAULT_TEAM_ACCESS_PERMISSIONS,
    };
  }
  return {
    state: row.access_state as TeamAccessState,
    sessionExpiresAt: row.session_expires_at,
    championshipName: row.championship_name,
    championshipLogoUrl: row.championship_logo_url,
    teamName: row.team_name,
    teamCrestUrl: row.team_crest_url,
    expiresAt: row.link_expires_at,
    permissions: permissionsFromJson(row.effective_permissions),
  };
}

export const getTeamEditLinkStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(teamAccessTargetSchema)
  .handler(async ({ data, context }): Promise<TeamAccessStatus | null> => {
    const { data: row, error } = await context.supabase
      .from("team_edit_links")
      .select(LINK_SELECT)
      .eq("championship_id", data.championshipId)
      .eq("team_id", data.teamId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw safeDomainError(error);
    if (!row) return null;
    return {
      ...row,
      permissions: permissionsFromJson(row.permissions),
      effectiveStatus: effectiveState(row.status, row.expires_at),
    };
  });

export const getTeamEditLinkHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(teamAccessTargetSchema)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("team_edit_link_events")
      .select("id,link_id,event_type,actor_id,reason,old_data,new_data,context,created_at")
      .eq("championship_id", data.championshipId)
      .eq("team_id", data.teamId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw safeDomainError(error);
    return rows;
  });

export const generateTeamEditLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(generateTeamAccessSchema)
  .handler(async ({ data, context }): Promise<GeneratedTeamAccess> => {
    try {
      const configuredBaseUrl = process.env.APP_BASE_URL;
      if (!configuredBaseUrl) throw new Error("missing_app_base_url");
      const baseUrl = new URL(configuredBaseUrl);
      if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
        throw new Error("invalid_app_base_url");
      }
      const { data: generated, error } = await context.supabase
        .rpc("generate_team_edit_link", {
          p_championship_id: data.championshipId,
          p_team_id: data.teamId,
          p_expires_at: data.expiresAt,
          p_permissions: data.permissions,
          p_admin_note: data.adminNote ?? undefined,
        })
        .single();
      if (error || !generated) throw error ?? new Error("generation_failed");
      const url = new URL(`/team-access/${generated.plaintext_token}`, baseUrl);
      return { linkId: generated.link_id, url: url.toString(), expiresAt: data.expiresAt };
    } catch (error) {
      throw safeDomainError(error);
    }
  });

export const blockTeamEditLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(teamAccessReasonSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("block_team_edit_link", {
      p_link_id: data.linkId,
      p_reason: data.reason,
    });
    if (result.error) throw safeDomainError(result.error);
    return { linkId: result.data };
  });

export const unblockTeamEditLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(teamAccessLinkActionSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("unblock_team_edit_link", {
      p_link_id: data.linkId,
    });
    if (result.error) throw safeDomainError(result.error);
    return { linkId: result.data };
  });

export const revokeTeamEditLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(teamAccessReasonSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("revoke_team_edit_link", {
      p_link_id: data.linkId,
      p_reason: data.reason,
    });
    if (result.error) throw safeDomainError(result.error);
    return { linkId: result.data };
  });

export const extendTeamEditLinkExpiration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(extendTeamAccessSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("extend_team_edit_link_expiration", {
      p_link_id: data.linkId,
      p_expires_at: data.expiresAt,
    });
    if (result.error) throw safeDomainError(result.error);
    return { linkId: result.data };
  });

export const updateTeamEditLinkPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(updateTeamAccessPermissionsSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("update_team_edit_link_permissions", {
      p_link_id: data.linkId,
      p_permissions: data.permissions,
    });
    if (result.error) throw safeDomainError(result.error);
    return { linkId: result.data };
  });

export const exchangeTeamEditToken = createServerFn({ method: "POST" })
  .validator(exchangeTeamAccessSchema)
  .handler(async ({ data }): Promise<{ state: TeamAccessState }> => {
    const { getRequestHeader, setCookie, setResponseHeader } =
      await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store, max-age=0");
    setResponseHeader("Referrer-Policy", "no-referrer");
    setResponseHeader("X-Robots-Tag", "noindex, nofollow");

    const sessionToken = await sha256Base64Url(`is-arena-team-access-session-v1:${data.token}`);
    const tokenHash = await sha256(data.token);
    const sessionHash = await sha256(sessionToken);
    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const userAgent = getRequestHeader("user-agent") ?? "unknown";
    const fingerprintHash = await sha256(`${ip}|${userAgent}|team-access`);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("consume_team_edit_token", {
      p_token_hash: tokenHash,
      p_session_hash: sessionHash,
      p_fingerprint_hash: fingerprintHash,
    });
    if (error) return { state: "invalid" };
    const access = mapPublicAccess(rows?.[0] ?? null);
    if (access.state === "valid") {
      setCookie(SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/team-access",
        maxAge: 15 * 60,
      });
    }
    return { state: access.state };
  });

export const getPublicTeamAccessSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicTeamAccess> => {
    const { deleteCookie, getCookie, setResponseHeader } =
      await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store, max-age=0");
    setResponseHeader("Referrer-Policy", "no-referrer");
    setResponseHeader("X-Robots-Tag", "noindex, nofollow");
    const sessionToken = getCookie(SESSION_COOKIE);
    if (!sessionToken || !/^[A-Za-z0-9_-]{43}$/.test(sessionToken)) return mapPublicAccess(null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_team_edit_session", {
      p_session_hash: await sha256(sessionToken),
    });
    if (error) return mapPublicAccess(null);
    const access = mapPublicAccess(data?.[0] ?? null);
    if (access.state !== "valid") {
      deleteCookie(SESSION_COOKIE, { path: "/team-access" });
    }
    return access;
  },
);
