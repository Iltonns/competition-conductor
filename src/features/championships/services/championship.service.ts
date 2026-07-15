import { supabase } from "@/integrations/supabase/client";
import {
  createChampionshipAtomic,
  deleteChampionship as deleteRecord,
  fetchChampionship,
  fetchChampionshipOverview,
  fetchChampionships,
  fetchMemberOrganizationIds,
  fetchWritableOrganizationIds,
  updateChampionship as updateRecord,
} from "../api/championships";
import {
  ChampionshipDomainError,
  withChampionshipErrorTranslation,
} from "../errors/championship-errors";
import type {
  Championship,
  ChampionshipOverview,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "../types/championship.types";

export const championshipKeys = {
  all: ["championships"] as const,
  list: () => [...championshipKeys.all, "list"] as const,
  detail: (championshipId: string) => [...championshipKeys.all, "detail", championshipId] as const,
  overview: (championshipId: string) =>
    [...championshipKeys.detail(championshipId), "overview"] as const,
};

export function slugifyChampionshipName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ChampionshipDomainError("AUTHENTICATION_REQUIRED");
  return data.user.id;
}

async function resolveSingleWritableOrganization(): Promise<string> {
  const organizationIds = await fetchWritableOrganizationIds(await requireUserId());
  if (organizationIds.length === 0) throw new ChampionshipDomainError("FORBIDDEN");
  if (organizationIds.length > 1)
    throw new ChampionshipDomainError("ORGANIZATION_SELECTION_REQUIRED");
  return organizationIds[0];
}

export async function listChampionships(): Promise<Championship[]> {
  return withChampionshipErrorTranslation(async () =>
    fetchChampionships(await fetchMemberOrganizationIds(await requireUserId())),
  );
}

export async function getChampionship(championshipId: string): Promise<Championship> {
  if (!championshipId) throw new ChampionshipDomainError("NOT_FOUND");
  return withChampionshipErrorTranslation(() => fetchChampionship(championshipId));
}

export async function getChampionshipOverview(
  organizationId: string,
  championshipId: string,
): Promise<ChampionshipOverview> {
  if (!organizationId) throw new ChampionshipDomainError("INVALID_ORGANIZATION");
  if (!championshipId) throw new ChampionshipDomainError("NOT_FOUND");
  return withChampionshipErrorTranslation(() =>
    fetchChampionshipOverview(organizationId, championshipId),
  );
}

export async function createChampionship(input: CreateChampionshipDTO): Promise<Championship> {
  try {
    return await withChampionshipErrorTranslation(async () => {
      const organizationId = await resolveSingleWritableOrganization();
      const slug = slugifyChampionshipName(input.name);
      if (!slug) throw new ChampionshipDomainError("INVALID_PAYLOAD");
      return createChampionshipAtomic(organizationId, slug, input);
    });
  } catch (error) {
    if (error instanceof ChampionshipDomainError && error.code === "UNKNOWN") {
      throw new ChampionshipDomainError("TRANSACTION_FAILED", { cause: error });
    }
    throw error;
  }
}

export async function updateChampionship(
  organizationId: string,
  championshipId: string,
  changes: UpdateChampionshipDTO,
): Promise<Championship> {
  if (!organizationId) throw new ChampionshipDomainError("INVALID_ORGANIZATION");
  return withChampionshipErrorTranslation(() =>
    updateRecord(organizationId, championshipId, changes),
  );
}

export async function deleteChampionship(championshipId: string): Promise<void> {
  return withChampionshipErrorTranslation(() => deleteRecord(championshipId));
}
