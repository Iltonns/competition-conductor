import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type EditorialStatus = "draft" | "scheduled" | "published" | "archived";

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  author: string | null;
  status: EditorialStatus;
  scheduled_at: string | null;
  published_at: string | null;
  is_featured: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  object_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  is_public: boolean;
  is_featured: boolean;
  signed_url?: string;
}

export interface SponsorItem {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: string | null;
  status: "active" | "inactive" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
}

export interface PublicPageConfig {
  id: string;
  description: string | null;
  theme: Json;
  contact: Json;
  social_links: Json;
  visible_sections: Json;
  hero_media_id: string | null;
}

export interface PublicPortal {
  championship: {
    id: string;
    name: string;
    slug: string;
    season: string | null;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    city: string | null;
    state: string | null;
    logo_url: string | null;
    cover_url: string | null;
  };
  page: {
    theme: Record<string, string>;
    contact: Record<string, string>;
    social_links: Record<string, string>;
    visible_sections: string[];
  };
  teams: Array<{ id: string; name: string; short_name: string | null; crest_url: string | null }>;
  matches: Array<{
    id: string;
    scheduled_at: string | null;
    status: string;
    home_score: number;
    away_score: number;
    venue: string | null;
    broadcast_url: string | null;
    home_team: { id: string | null; name: string | null };
    away_team: { id: string | null; name: string | null };
  }>;
  standings: Array<{
    team_id: string;
    team_name: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goal_difference: number;
    points: number;
  }>;
  news: NewsItem[];
  media: MediaItem[];
  sponsors: SponsorItem[];
}

type RpcResult = { data: unknown; error: { message: string } | null };
const rpc = supabase.rpc as unknown as (
  name: string,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult>;
type DynamicQuery = PromiseLike<{ data: unknown; error: { message: string } | null }>;
const fromUntyped = supabase.from as unknown as (name: string) => {
  select: (columns?: string) => {
    eq: (column: string, value: unknown) => { maybeSingle: () => DynamicQuery };
  };
};

async function callRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(name, args);
  if (error) throw error;
  return data as T;
}

export async function listNews(championshipId: string): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("championship_id", championshipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NewsItem[];
}

export function saveNews(championshipId: string, id: string | null, payload: object) {
  return callRpc<NewsItem>("save_championship_news", {
    p_championship_id: championshipId,
    p_news_id: id,
    p_payload: payload,
  });
}

export async function listMedia(championshipId: string): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("championship_id", championshipId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const items = (data ?? []) as unknown as MediaItem[];
  return Promise.all(
    items.map(async (item) => {
      if (!item.object_path) return item;
      const { data: signed } = await supabase.storage
        .from("championship-media")
        .createSignedUrl(item.object_path, 3600);
      return { ...item, signed_url: signed?.signedUrl };
    }),
  );
}

export async function uploadMedia(
  organizationId: string,
  championshipId: string,
  input: { file: File; title: string; altText: string; isPublic: boolean },
) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (
    !allowed.includes(input.file.type) ||
    input.file.size <= 0 ||
    input.file.size > 10 * 1024 * 1024
  )
    throw new Error("Use PDF, JPG, PNG ou WebP com até 10 MB.");
  if (!input.title.trim()) throw new Error("Informe o título da mídia.");
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = `${organizationId}/${championshipId}/${crypto.randomUUID()}-${safeName}`;
  const bucket = supabase.storage.from("championship-media");
  const { error } = await bucket.upload(objectPath, input.file, {
    contentType: input.file.type,
    upsert: false,
  });
  if (error) throw error;
  try {
    return await callRpc<MediaItem>("register_championship_media", {
      p_championship_id: championshipId,
      p_payload: {
        title: input.title,
        alt_text: input.altText,
        is_public: input.isPublic,
        object_path: objectPath,
        file_name: input.file.name,
        mime_type: input.file.type,
        size_bytes: input.file.size,
      },
    });
  } catch (registrationError) {
    await bucket.remove([objectPath]);
    throw registrationError;
  }
}

export function archiveMedia(championshipId: string, mediaId: string) {
  return callRpc<MediaItem>("archive_championship_media", {
    p_championship_id: championshipId,
    p_media_id: mediaId,
  });
}

export async function listSponsors(championshipId: string): Promise<SponsorItem[]> {
  const { data, error } = await supabase
    .from("sponsors")
    .select("*")
    .eq("championship_id", championshipId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as unknown as SponsorItem[];
}

export function saveSponsor(championshipId: string, id: string | null, payload: object) {
  return callRpc<SponsorItem>("save_championship_sponsor", {
    p_championship_id: championshipId,
    p_sponsor_id: id,
    p_payload: payload,
  });
}

export async function getPublicPageConfig(
  championshipId: string,
): Promise<PublicPageConfig | null> {
  const { data, error } = await fromUntyped("championship_public_pages")
    .select("*")
    .eq("championship_id", championshipId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PublicPageConfig | null;
}

export function savePublicPage(championshipId: string, payload: object) {
  return callRpc<PublicPageConfig>("save_championship_public_page", {
    p_championship_id: championshipId,
    p_payload: payload,
  });
}

export function setPublication(championshipId: string, publish: boolean) {
  return callRpc("set_championship_publication", {
    p_championship_id: championshipId,
    p_publish: publish,
  });
}

export async function getPublicPortal(slug: string): Promise<PublicPortal | null> {
  const portal = await callRpc<PublicPortal | null>("get_public_championship_portal", {
    p_slug: slug,
  });
  if (!portal) return null;
  portal.media = await Promise.all(
    portal.media.map(async (item) => {
      if (!item.object_path) return item;
      const { data } = await supabase.storage
        .from("championship-media")
        .createSignedUrl(item.object_path, 3600);
      return { ...item, signed_url: data?.signedUrl };
    }),
  );
  return portal;
}
