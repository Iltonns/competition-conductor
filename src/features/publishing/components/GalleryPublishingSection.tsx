import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Images, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MediaGallery, MediaItem } from "../api/publishing";
import { useGalleryPublishing } from "../hooks/usePublishing";

type GalleryForm = {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  status: MediaGallery["status"];
  mediaIds: string[];
  captions: Record<string, string>;
};

const emptyGallery: GalleryForm = {
  id: null,
  title: "",
  slug: "",
  description: "",
  status: "draft",
  mediaIds: [],
  captions: {},
};

export function GalleryPublishingSection({
  championshipId,
  media,
}: {
  championshipId: string;
  media: MediaItem[];
}) {
  const galleries = useGalleryPublishing(championshipId);
  const [form, setForm] = useState<GalleryForm>(emptyGallery);
  const images = useMemo(
    () => media.filter((item) => item.mime_type?.startsWith("image/")),
    [media],
  );

  const edit = (gallery: MediaGallery) => {
    const orderedItems = [...gallery.items].sort((a, b) => a.display_order - b.display_order);
    setForm({
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      description: gallery.description ?? "",
      status: gallery.status,
      mediaIds: orderedItems.map((item) => item.media_id),
      captions: Object.fromEntries(orderedItems.map((item) => [item.media_id, item.caption ?? ""])),
    });
  };

  const toggleMedia = (mediaId: string) =>
    setForm((current) => ({
      ...current,
      mediaIds: current.mediaIds.includes(mediaId)
        ? current.mediaIds.filter((id) => id !== mediaId)
        : [...current.mediaIds, mediaId],
    }));

  const move = (index: number, offset: -1 | 1) => {
    const destination = index + offset;
    if (destination < 0 || destination >= form.mediaIds.length) return;
    const next = [...form.mediaIds];
    [next[index], next[destination]] = [next[destination], next[index]];
    setForm({ ...form, mediaIds: next });
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <form
        className="card-arena space-y-3 p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await galleries.save.mutateAsync({
              id: form.id,
              payload: {
                title: form.title,
                slug: form.slug || form.title,
                description: form.description,
                status: form.status,
                items: form.mediaIds.map((mediaId, index) => ({
                  media_id: mediaId,
                  display_order: index,
                  caption: form.captions[mediaId]?.trim() || null,
                })),
              },
            });
            setForm(emptyGallery);
            toast.success("Galeria salva.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">
              Galerias públicas
            </p>
            <h3 className="font-display text-sm font-bold">
              {form.id ? "Editar galeria" : "Nova galeria"}
            </h3>
          </div>
          <Images className="h-4 w-4 text-neon" />
        </div>
        <div>
          <Label>Título</Label>
          <Input
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            value={form.slug}
            placeholder="gerado pelo título"
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
        <div>
          <Label>Status</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as MediaGallery["status"] })
            }
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
            <option value="archived">Arquivada</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={galleries.save.isPending}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
          {form.id && (
            <Button type="button" variant="outline" onClick={() => setForm(emptyGallery)}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <section className="card-arena p-4">
          <h3 className="font-display text-sm font-bold">Imagens da galeria</h3>
          {images.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Envie imagens para a biblioteca antes de montar uma galeria.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {images.map((item) => {
                const selected = form.mediaIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMedia(item.id)}
                    className={`flex items-center gap-3 rounded-lg border p-2 text-left ${
                      selected ? "border-neon/50 bg-neon/5" : "border-white/10"
                    }`}
                  >
                    <span className="h-12 w-16 overflow-hidden rounded-md bg-black/20">
                      {item.signed_url && (
                        <img
                          src={item.signed_url}
                          alt={item.alt_text ?? item.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-xs">{item.title}</strong>
                      <span className="text-[9px] text-muted-foreground">
                        {item.is_public ? "Pública" : "Interna"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {form.mediaIds.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">
                Ordem e legenda
              </p>
              {form.mediaIds.map((mediaId, index) => {
                const item = images.find((candidate) => candidate.id === mediaId);
                return (
                  <div key={mediaId} className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      aria-label={`Legenda de ${item?.title ?? "imagem"}`}
                      placeholder={item?.title ?? "Legenda"}
                      value={form.captions[mediaId] ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          captions: { ...form.captions, [mediaId]: event.target.value },
                        })
                      }
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Mover imagem para cima"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Mover imagem para baixo"
                        disabled={index === form.mediaIds.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          {(galleries.data ?? []).map((gallery) => (
            <button
              key={gallery.id}
              type="button"
              onClick={() => edit(gallery)}
              className="card-arena flex items-center gap-3 p-4 text-left"
            >
              <Images className="h-5 w-5 text-neon" />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs">{gallery.title}</strong>
                <span className="text-[9px] text-muted-foreground">
                  {gallery.items.length} imagem(ns)
                </span>
              </span>
              <Badge variant="outline">{gallery.status}</Badge>
            </button>
          ))}
        </section>
      </div>
    </section>
  );
}
