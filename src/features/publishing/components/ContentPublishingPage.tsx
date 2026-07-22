import { useState } from "react";
import { Archive, Image, Newspaper, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Championship } from "@/features/championships/types/championship.types";
import type { EditorialStatus, NewsItem } from "../api/publishing";
import { useContentPublishing } from "../hooks/usePublishing";

const emptyNews = {
  id: null as string | null,
  title: "",
  slug: "",
  summary: "",
  body: "",
  author: "",
  status: "draft" as EditorialStatus,
  scheduledAt: "",
};

export function ContentPublishingPage({ championship }: { championship: Championship }) {
  const content = useContentPublishing(championship.organization_id, championship.id);
  const [news, setNews] = useState(emptyNews);
  const [mediaTitle, setMediaTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [mediaPublic, setMediaPublic] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  if (content.news.isLoading || content.media.isLoading) return <Skeleton className="h-96" />;

  const edit = (item: NewsItem) =>
    setNews({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary ?? "",
      body: item.body ?? "",
      author: item.author ?? "",
      status: item.status,
      scheduledAt: item.scheduled_at?.slice(0, 16) ?? "",
    });

  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">Publicação</p>
        <h2 className="font-display text-xl font-extrabold">Notícias e mídia</h2>
      </header>

      <section className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <form
          className="card-arena space-y-3 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await content.saveNews.mutateAsync({
                id: news.id,
                payload: {
                  title: news.title,
                  slug: news.slug || news.title,
                  summary: news.summary,
                  body: news.body,
                  author: news.author,
                  status: news.status,
                  scheduled_at: news.status === "scheduled" ? news.scheduledAt : null,
                },
              });
              setNews(emptyNews);
              toast.success("Notícia salva.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
            }
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">
              {news.id ? "Editar notícia" : "Nova notícia"}
            </h3>
            <Newspaper className="h-4 w-4 text-neon" />
          </div>
          <div>
            <Label>Título</Label>
            <Input
              required
              value={news.title}
              onChange={(e) => setNews({ ...news, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={news.slug}
              placeholder="gerado pelo título"
              onChange={(e) => setNews({ ...news, slug: e.target.value })}
            />
          </div>
          <div>
            <Label>Resumo</Label>
            <Textarea
              value={news.summary}
              onChange={(e) => setNews({ ...news, summary: e.target.value })}
            />
          </div>
          <div>
            <Label>Corpo em texto seguro</Label>
            <Textarea
              className="min-h-32"
              value={news.body}
              onChange={(e) => setNews({ ...news, body: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Autor</Label>
              <Input
                value={news.author}
                onChange={(e) => setNews({ ...news, author: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                value={news.status}
                onChange={(e) => setNews({ ...news, status: e.target.value as EditorialStatus })}
              >
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendada</option>
                <option value="published">Publicada</option>
                <option value="archived">Arquivada</option>
              </select>
            </div>
          </div>
          {news.status === "scheduled" && (
            <div>
              <Label>Publicar em</Label>
              <Input
                required
                type="datetime-local"
                value={news.scheduledAt}
                onChange={(e) => setNews({ ...news, scheduledAt: e.target.value })}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={content.saveNews.isPending}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
            {news.id && (
              <Button type="button" variant="outline" onClick={() => setNews(emptyNews)}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <section className="card-arena p-4">
          <h3 className="font-display text-sm font-bold">Conteúdo editorial</h3>
          <div className="mt-3 space-y-2">
            {(content.news.data ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => edit(item)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 p-3 text-left hover:bg-white/[.03]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-neon/10 text-neon">
                  <Newspaper className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{item.title}</strong>
                  <span className="text-[9px] text-muted-foreground">/{item.slug}</span>
                </span>
                <Badge variant="outline">{item.status}</Badge>
              </button>
            ))}
            {(content.news.data?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma notícia cadastrada.</p>
            )}
          </div>
        </section>
      </section>

      <section className="card-arena p-4">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-neon" />
          <h3 className="font-display text-sm font-bold">Biblioteca de mídia</h3>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
          <Input
            placeholder="Título do arquivo"
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
          />
          <Input
            placeholder="Texto alternativo"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
          <label className="flex items-center gap-2 rounded-md border border-input px-3 text-xs">
            <input
              type="checkbox"
              checked={mediaPublic}
              onChange={(e) => setMediaPublic(e.target.checked)}
            />{" "}
            Pública
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">
            <Upload className="h-4 w-4" /> Selecionar
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {file && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-white/10 p-2 text-xs">
            <span>{file.name}</span>
            <Button
              size="sm"
              disabled={content.uploadMedia.isPending}
              onClick={async () => {
                try {
                  await content.uploadMedia.mutateAsync({
                    file,
                    title: mediaTitle,
                    altText,
                    isPublic: mediaPublic,
                  });
                  setFile(null);
                  setMediaTitle("");
                  setAltText("");
                  toast.success("Mídia enviada.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Falha no envio.");
                }
              }}
            >
              <Upload className="h-4 w-4" /> Enviar
            </Button>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(content.media.data ?? []).map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-white/10">
              <div className="grid aspect-video place-items-center bg-black/20">
                {item.mime_type?.startsWith("image/") && item.signed_url ? (
                  <img
                    src={item.signed_url}
                    alt={item.alt_text ?? item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 p-3">
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">{item.title}</strong>
                  <span className="text-[9px] text-muted-foreground">
                    {item.is_public ? "Pública" : "Interna"}
                  </span>
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Arquivar ${item.title}`}
                  onClick={() => content.archiveMedia.mutate(item.id)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
