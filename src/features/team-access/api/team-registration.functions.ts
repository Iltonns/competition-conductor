import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { permissionsFromJson, type TeamAccessPermissions } from "../types/team-access.types";
import type {
  RegistrationStepId,
  TeamRegistrationDraft,
  TeamRegistrationPayload,
} from "../types/team-registration.types";
import {
  registrationAthleteSchema,
  registrationDocumentSchema,
  registrationPersonSchema,
  registrationSectionSchema,
  registrationTeamSchema,
  registrationUploadSchema,
} from "../schemas/team-registration.schema";

const SESSION_COOKIE = "is_arena_team_access";
type SessionContext = {
  db: SupabaseClient;
  organizationId: string;
  championshipId: string;
  championshipTeamId: string;
  teamId: string;
  linkId: string;
  permissions: TeamAccessPermissions;
};

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requireRegistrationSession(): Promise<SessionContext> {
  const { getCookie, setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Cache-Control", "no-store, max-age=0");
  const token = getCookie(SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("registration:unauthorized");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as SupabaseClient;
  const { data: session } = await db
    .from("team_edit_link_sessions")
    .select("link_id,expires_at")
    .eq("session_hash", await sha256(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!session) throw new Error("registration:unauthorized");
  const { data: link } = await db
    .from("team_edit_links")
    .select(
      "id,organization_id,championship_id,championship_team_id,team_id,status,expires_at,permissions",
    )
    .eq("id", session.link_id)
    .maybeSingle();
  if (!link || link.status !== "active" || Date.parse(link.expires_at) <= Date.now())
    throw new Error("registration:unauthorized");
  return {
    db,
    linkId: link.id,
    organizationId: link.organization_id,
    championshipId: link.championship_id,
    championshipTeamId: link.championship_team_id,
    teamId: link.team_id,
    permissions: permissionsFromJson(link.permissions),
  };
}

function emptyPayload(team: Record<string, unknown>): TeamRegistrationPayload {
  const value = (key: string) => String(team[key] ?? "");
  return {
    team: {
      name: value("name"),
      shortName: value("short_name"),
      abbreviation: value("abbreviation"),
      city: value("city"),
      state: value("state"),
      neighborhood: value("neighborhood"),
      category: value("category"),
      gender: value("gender"),
      foundationYear: value("foundation_year"),
      phone: value("phone"),
      whatsapp: value("whatsapp"),
      email: value("email"),
      instagram: value("instagram"),
      crestUrl: value("crest_url"),
      coverUrl: value("cover_url"),
    },
    responsibles: [],
    staff: [],
    athletes: [],
    documents: [],
  };
}

async function currentDraft(context: SessionContext): Promise<TeamRegistrationDraft> {
  const { data: stored } = await context.db
    .from("team_registration_drafts")
    .select("payload,completed_steps,status,version,updated_at,submitted_at")
    .eq("championship_team_id", context.championshipTeamId)
    .maybeSingle();
  if (stored)
    return {
      payload: stored.payload as unknown as TeamRegistrationPayload,
      completedSteps: (stored.completed_steps ?? []) as RegistrationStepId[],
      status: stored.status as TeamRegistrationDraft["status"],
      version: stored.version,
      updatedAt: stored.updated_at,
      submittedAt: stored.submitted_at,
    };
  const { data: team } = await context.db
    .from("teams")
    .select("*")
    .eq("id", context.teamId)
    .single();
  const payload = emptyPayload((team ?? {}) as Record<string, unknown>);
  const [{ data: responsibles }, { data: staff }, { data: athletes }] = await Promise.all([
    context.db
      .from("team_responsibles")
      .select("id,full_name,role,phone,email,is_primary")
      .eq("team_id", context.teamId)
      .is("archived_at", null),
    context.db
      .from("team_staff")
      .select("id,full_name,role,phone,email")
      .eq("team_id", context.teamId)
      .is("archived_at", null),
    context.db
      .from("athletes")
      .select(
        "id,full_name,birth_date,document_number,position,shirt_number,is_captain,is_goalkeeper",
      )
      .eq("team_id", context.teamId)
      .is("archived_at", null),
  ]);
  payload.responsibles = (responsibles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    phone: p.phone ?? "",
    email: p.email ?? "",
    isPrimary: p.is_primary,
  }));
  payload.staff = (staff ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    phone: p.phone ?? "",
    email: p.email ?? "",
  }));
  payload.athletes = (athletes ?? []).map((a) => ({
    id: a.id,
    fullName: a.full_name,
    birthDate: a.birth_date ?? "",
    documentNumber: a.document_number ?? "",
    position: a.position ?? "",
    shirtNumber: String(a.shirt_number ?? ""),
    isCaptain: a.is_captain,
    isGoalkeeper: a.is_goalkeeper,
  }));
  return {
    payload,
    completedSteps: [],
    status: "draft",
    version: 1,
    updatedAt: null,
    submittedAt: null,
  };
}

export const getTeamRegistrationDraft = createServerFn({ method: "GET" }).handler(async () =>
  currentDraft(await requireRegistrationSession()),
);

const permissionBySection = {
  team: "edit_team_details",
  responsibles: "edit_responsibles",
  staff: "edit_staff",
  athletes: "edit_athletes",
  documents: "add_documents",
} as const;

export const saveTeamRegistrationSection = createServerFn({ method: "POST" })
  .validator(registrationSectionSchema)
  .handler(async ({ data }) => {
    const context = await requireRegistrationSession();
    const sectionAllowed =
      data.section === "athletes"
        ? context.permissions.add_athletes ||
          context.permissions.edit_athletes ||
          context.permissions.remove_athletes
        : context.permissions[permissionBySection[data.section]];
    if (!sectionAllowed) throw new Error("registration:forbidden");
    const draft = await currentDraft(context);
    if (draft.status === "submitted" || draft.status === "approved")
      throw new Error("registration:locked");
    const schemas = {
      team: registrationTeamSchema,
      responsibles: z.array(registrationPersonSchema).max(50),
      staff: z.array(registrationPersonSchema).max(50),
      athletes: z.array(registrationAthleteSchema).max(200),
      documents: z.array(registrationDocumentSchema).max(50),
    };
    const value = schemas[data.section].parse(data.value);
    const payload = { ...draft.payload, [data.section]: value };
    const completed = new Set(draft.completedSteps);
    if (data.markComplete) completed.add(data.section);
    else completed.delete(data.section);
    const { data: saved, error } = await context.db
      .from("team_registration_drafts")
      .upsert(
        {
          organization_id: context.organizationId,
          championship_id: context.championshipId,
          championship_team_id: context.championshipTeamId,
          team_id: context.teamId,
          payload,
          completed_steps: [...completed],
          status: "draft",
          version: draft.version + 1,
        },
        { onConflict: "championship_team_id" },
      )
      .select("version,updated_at")
      .single();
    if (error) throw new Error("registration:save_failed");
    return { version: saved.version, updatedAt: saved.updated_at, completedSteps: [...completed] };
  });

export const uploadTeamRegistrationFile = createServerFn({ method: "POST" })
  .validator(registrationUploadSchema)
  .handler(async ({ data }) => {
    const context = await requireRegistrationSession();
    if (!context.permissions.add_documents) throw new Error("registration:forbidden");
    const bytes = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
    if (bytes.byteLength > 10_485_760) throw new Error("registration:file_too_large");
    const extension =
      data.name
        .split(".")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "")
        .toLowerCase() || "bin";
    const path = `${context.organizationId}/${context.championshipTeamId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await context.db.storage
      .from("team-registration")
      .upload(path, bytes, { contentType: data.mimeType, upsert: false });
    if (error) throw new Error("registration:upload_failed");
    return { path, size: bytes.byteLength, uploadedAt: new Date().toISOString() };
  });

export const submitTeamRegistration = createServerFn({ method: "POST" }).handler(async () => {
  const context = await requireRegistrationSession();
  if (!context.permissions.submit_for_review) throw new Error("registration:forbidden");
  const draft = await currentDraft(context);
  const required: RegistrationStepId[] = ["team", "responsibles", "staff", "athletes", "documents"];
  if (required.some((step) => !draft.completedSteps.includes(step)))
    throw new Error("registration:incomplete");
  const now = new Date().toISOString();
  const { error } = await context.db.from("team_registration_drafts").upsert(
    {
      organization_id: context.organizationId,
      championship_id: context.championshipId,
      championship_team_id: context.championshipTeamId,
      team_id: context.teamId,
      payload: draft.payload,
      completed_steps: draft.completedSteps,
      status: "submitted",
      submitted_at: now,
      version: draft.version + 1,
    },
    { onConflict: "championship_team_id" },
  );
  if (error) throw new Error("registration:submit_failed");
  await context.db
    .from("championship_teams")
    .update({ status: "submitted", submitted_at: now })
    .eq("id", context.championshipTeamId);
  return { submittedAt: now };
});

export const endTeamRegistrationSession = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await import("@tanstack/react-start/server");
  deleteCookie(SESSION_COOKIE, { path: "/team-access" });
  return { ended: true };
});
