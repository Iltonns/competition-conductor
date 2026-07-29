import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { createUuid } from "@/lib/uuid";

const db = supabase as unknown as SupabaseClient;
const CHAMPIONSHIP_LOGO_BUCKET = "championship-branding";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CurrentLogo = {
  organization_id: string;
  logo_object_path: string | null;
};

function extensionFor(file: File) {
  const mimeExtension: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return mimeExtension[file.type];
}

async function currentLogo(championshipId: string): Promise<CurrentLogo> {
  const { data, error } = await db
    .from("championships")
    .select("organization_id,logo_object_path")
    .eq("id", championshipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Campeonato não encontrado.");
  return data as CurrentLogo;
}

async function persistLogo(
  championshipId: string,
  logoUrl: string | null,
  objectPath: string | null,
) {
  const { error } = await db.rpc("set_championship_logo", {
    p_championship_id: championshipId,
    p_logo_url: logoUrl,
    p_object_path: objectPath,
  });
  if (error) throw error;
}

export async function uploadChampionshipLogo(championshipId: string, file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const previous = await currentLogo(championshipId);
  const objectPath = `${previous.organization_id}/${championshipId}/logo-${createUuid()}.${extensionFor(file)}`;
  const bucket = supabase.storage.from(CHAMPIONSHIP_LOGO_BUCKET);
  const { error: uploadError } = await bucket.upload(objectPath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error("Não foi possível enviar a logo do campeonato.");

  const logoUrl = bucket.getPublicUrl(objectPath).data.publicUrl;
  try {
    await persistLogo(championshipId, logoUrl, objectPath);
  } catch (error) {
    await bucket.remove([objectPath]);
    throw error;
  }

  if (previous.logo_object_path && previous.logo_object_path !== objectPath) {
    await bucket.remove([previous.logo_object_path]);
  }
  return logoUrl;
}

export async function removeChampionshipLogo(championshipId: string) {
  const previous = await currentLogo(championshipId);
  await persistLogo(championshipId, null, null);
  if (previous.logo_object_path) {
    await supabase.storage.from(CHAMPIONSHIP_LOGO_BUCKET).remove([previous.logo_object_path]);
  }
}
