import { supabase } from "@/integrations/supabase/client";

const TEAM_MEDIA_BUCKET = "team-media";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function uploadTeamImage(file: File, kind: "crest" | "cover"): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG, WebP ou HEIC.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${data.user.id}/${kind}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(TEAM_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("Não foi possível enviar a imagem. Tente novamente.");

  return supabase.storage.from(TEAM_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
