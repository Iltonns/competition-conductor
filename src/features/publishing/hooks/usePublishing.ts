import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveMedia,
  getPublicPageConfig,
  listMedia,
  listNews,
  listSponsors,
  saveNews,
  savePublicPage,
  saveSponsor,
  setPublication,
  uploadMedia,
} from "../api/publishing";

const keys = {
  news: (id: string) => ["publishing", "news", id] as const,
  media: (id: string) => ["publishing", "media", id] as const,
  sponsors: (id: string) => ["publishing", "sponsors", id] as const,
  page: (id: string) => ["publishing", "page", id] as const,
};

export function useContentPublishing(organizationId: string, championshipId: string) {
  const client = useQueryClient();
  const refreshNews = () => client.invalidateQueries({ queryKey: keys.news(championshipId) });
  const refreshMedia = () => client.invalidateQueries({ queryKey: keys.media(championshipId) });
  return {
    news: useQuery({
      queryKey: keys.news(championshipId),
      queryFn: () => listNews(championshipId),
    }),
    media: useQuery({
      queryKey: keys.media(championshipId),
      queryFn: () => listMedia(championshipId),
    }),
    saveNews: useMutation({
      mutationFn: ({ id, payload }: { id: string | null; payload: object }) =>
        saveNews(championshipId, id, payload),
      onSuccess: refreshNews,
    }),
    uploadMedia: useMutation({
      mutationFn: (input: { file: File; title: string; altText: string; isPublic: boolean }) =>
        uploadMedia(organizationId, championshipId, input),
      onSuccess: refreshMedia,
    }),
    archiveMedia: useMutation({
      mutationFn: (id: string) => archiveMedia(championshipId, id),
      onSuccess: refreshMedia,
    }),
  };
}

export function useSponsorPublishing(championshipId: string) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: keys.sponsors(championshipId),
    queryFn: () => listSponsors(championshipId),
  });
  return {
    ...query,
    save: useMutation({
      mutationFn: ({ id, payload }: { id: string | null; payload: object }) =>
        saveSponsor(championshipId, id, payload),
      onSuccess: () => client.invalidateQueries({ queryKey: keys.sponsors(championshipId) }),
    }),
  };
}

export function usePublicPagePublishing(championshipId: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: keys.page(championshipId) });
  const query = useQuery({
    queryKey: keys.page(championshipId),
    queryFn: () => getPublicPageConfig(championshipId),
  });
  return {
    ...query,
    save: useMutation({
      mutationFn: (payload: object) => savePublicPage(championshipId, payload),
      onSuccess: refresh,
    }),
    publish: useMutation({
      mutationFn: (value: boolean) => setPublication(championshipId, value),
      onSuccess: refresh,
    }),
  };
}
