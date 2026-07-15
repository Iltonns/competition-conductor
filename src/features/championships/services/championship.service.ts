import { supabase } from "@/integrations/supabase/client";
import {
  deleteChampionship as deleteRecord,
  fetchChampionship,
  fetchChampionshipDependencies,
  fetchChampionshipOverview,
  fetchChampionships,
  findOrganizationIdForUser,
  insertChampionship,
  insertChampionshipSettings,
  insertDefaultChampionshipCategory,
  updateChampionship as updateRecord,
} from "../api/championships";
import type {
  Championship,
  ChampionshipDependencies,
  ChampionshipOverview,
  CreateChampionshipDTO,
  UpdateChampionshipDTO,
} from "../types/championship.types";

export const championshipKeys = {
  all: ["championships"] as const,
  organization: (organizationId: string) => [...championshipKeys.all, organizationId] as const,
  list: (organizationId: string) =>
    [...championshipKeys.organization(organizationId), "list"] as const,
  detail: (organizationId: string, championshipId: string) =>
    [...championshipKeys.organization(organizationId), "detail", championshipId] as const,
  overview: (organizationId: string, championshipId: string) =>
    [...championshipKeys.detail(organizationId, championshipId), "overview"] as const,
};

export class ChampionshipHasDependenciesError extends Error {
  constructor(public readonly dependencies: ChampionshipDependencies) {
    const labels = [
      dependencies.matches && `${dependencies.matches} partida(s)`,
      dependencies.registrations && `${dependencies.registrations} inscrição(ões)`,
      dependencies.teams && `${dependencies.teams} equipe(s)`,
    ].filter(Boolean);
    super(`Este campeonato não pode ser excluído porque possui ${labels.join(", ")} vinculada(s).`);
    this.name = "ChampionshipHasDependenciesError";
  }
}

export function slugifyChampionshipName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireContext(): Promise<{ userId: string; organizationId: string }> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
  return {
    userId: data.user.id,
    organizationId: await findOrganizationIdForUser(data.user.id),
  };
}

export async function getCurrentOrganizationId(): Promise<string> {
  return (await requireContext()).organizationId;
}

export async function listChampionships(organizationId: string): Promise<Championship[]> {
  if (!organizationId) throw new Error("Organização não informada.");
  return fetchChampionships(organizationId);
}

export async function getChampionship(
  organizationId: string,
  championshipId: string,
): Promise<Championship> {
  if (!organizationId) throw new Error("Organização não informada.");
  if (!championshipId) throw new Error("Campeonato não informado.");
  return fetchChampionship(organizationId, championshipId);
}

export async function getChampionshipOverview(
  organizationId: string,
  championshipId: string,
): Promise<ChampionshipOverview> {
  if (!organizationId) throw new Error("Organização não informada.");
  if (!championshipId) throw new Error("Campeonato não informado.");
  return fetchChampionshipOverview(organizationId, championshipId);
}

export async function createChampionship(input: CreateChampionshipDTO): Promise<Championship> {
  const { userId, organizationId } = await requireContext();
  const baseSlug = slugifyChampionshipName(input.name);
  if (!baseSlug) throw new Error("Não foi possível gerar um endereço para o campeonato.");

  let championship: Championship | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
    try {
      championship = await insertChampionship({
        organization_id: organizationId,
        created_by: userId,
        name: input.name,
        slug,
        season: input.season,
        description: input.description,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        is_public: input.is_public,
      });
      break;
    } catch (error) {
      if (
        attempt === 0 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      )
        continue;
      throw error;
    }
  }

  if (!championship) throw new Error("Não foi possível criar o campeonato.");
  try {
    await insertChampionshipSettings(organizationId, championship.id);
    await insertDefaultChampionshipCategory(organizationId, championship.id);
    return championship;
  } catch (error) {
    try {
      await deleteRecord(organizationId, championship.id);
    } catch {
      throw new Error(
        "O campeonato foi criado parcialmente e a reversão automática falhou. Contate o suporte antes de tentar novamente.",
        { cause: error },
      );
    }
    throw new Error("Não foi possível configurar o campeonato. Nenhuma alteração foi mantida.", {
      cause: error,
    });
  }
}

export async function updateChampionship(
  organizationId: string,
  championshipId: string,
  changes: UpdateChampionshipDTO,
): Promise<Championship> {
  if (!organizationId) throw new Error("Organização não informada.");
  return updateRecord(organizationId, championshipId, changes);
}

export async function deleteChampionship(
  organizationId: string,
  championshipId: string,
): Promise<void> {
  if (!organizationId) throw new Error("Organização não informada.");
  const dependencies = await fetchChampionshipDependencies(organizationId, championshipId);
  if (dependencies.matches || dependencies.registrations || dependencies.teams) {
    throw new ChampionshipHasDependenciesError(dependencies);
  }
  await deleteRecord(organizationId, championshipId);
}
