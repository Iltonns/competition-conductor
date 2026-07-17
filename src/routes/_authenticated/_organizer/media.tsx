import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Image,
  MoreHorizontal,
  Newspaper,
  Play,
  Plus,
  Radio,
  Search,
  Upload,
} from "lucide-react";
import { SectionHeader } from "@/components/arena/arena-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NEWS } from "@/data/arena-demo";

export const Route = createFileRoute("/_authenticated/_organizer/media")({
  head: () => ({ meta: [{ title: "Notícias e mídia · IS Arena" }] }),
  component: MediaPage,
});

function MediaPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 border-white/[0.07] bg-white/[0.025] pl-9 text-[10px]"
            placeholder="Buscar conteúdo..."
            aria-label="Buscar conteúdo"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-9 flex-1 border-white/[0.07] bg-white/[0.025] px-3 text-[9px] sm:flex-none"
          >
            <Upload className="h-3.5 w-3.5" /> Enviar mídia
          </Button>
          <Button className="h-9 flex-1 bg-neon px-3 text-[9px] text-neon-foreground hover:bg-neon/90 sm:flex-none">
            <Plus className="h-3.5 w-3.5" /> Nova notícia
          </Button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="group relative min-h-[360px] overflow-hidden rounded-2xl border border-white/[0.075] shadow-[0_28px_70px_-45px_rgba(0,0,0,1)]">
          <img
            src="/assets/news-victory.webp"
            alt="Quatro atletas fictícios comemorando a vitória"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neon px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-neon-foreground">
              <Newspaper className="h-3 w-3" /> Destaque
            </span>
            <h2 className="text-balance mt-3 max-w-2xl font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-3xl">
              {NEWS[0].title}
            </h2>
            <p className="mt-3 max-w-xl text-[10px] leading-relaxed text-white/62">
              {NEWS[0].excerpt}
            </p>
            <p className="mt-3 flex items-center gap-2 text-[8px] text-white/45">
              <CalendarDays className="h-3 w-3" /> {NEWS[0].date} · Por IS Arena
            </p>
          </div>
          <button
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/30 text-white/70 backdrop-blur hover:text-white"
            aria-label="Mais ações"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </article>

        <div className="card-arena p-4">
          <SectionHeader title="Fila de publicação" action="Ver calendário" />
          <div className="mt-3 space-y-2">
            {[
              {
                day: "05",
                month: "JUL",
                title: "Guia da grande final",
                type: "Notícia",
                status: "Agendada",
              },
              {
                day: "06",
                month: "JUL",
                title: "Melhores momentos",
                type: "Vídeo",
                status: "Rascunho",
              },
              {
                day: "07",
                month: "JUL",
                title: "Álbum dos finalistas",
                type: "Galeria",
                status: "Revisão",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-center">
                  <strong className="block font-display text-sm font-extrabold leading-none">
                    {item.day}
                  </strong>
                  <span className="block text-[7px] text-muted-foreground">{item.month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[10px] font-semibold">{item.title}</strong>
                  <span className="mt-0.5 block text-[8px] text-muted-foreground">{item.type}</span>
                </span>
                <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[7px] font-semibold text-muted-foreground">
                  {item.status}
                </span>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-neon/15 bg-neon/[0.035] p-4">
            <Radio className="h-4 w-4 text-neon" />
            <h3 className="mt-3 font-display text-sm font-extrabold">Transmissão ao vivo</h3>
            <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
              Configure o link oficial para a final e destaque na página pública.
            </p>
            <Button
              variant="outline"
              className="mt-3 h-8 border-neon/20 bg-neon/5 px-3 text-[8px] text-neon"
            >
              <Play className="h-3 w-3" /> Configurar transmissão
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Notícias recentes" action="Gerenciar notícias" />
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {NEWS.map((article, index) => (
            <article key={article.id} className="card-arena card-interactive overflow-hidden">
              <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(190,245,45,.14),transparent_50%),linear-gradient(135deg,#172019,#090d0f)]">
                {index === 0 ? (
                  <img
                    src="/assets/news-victory.webp"
                    alt="Atletas celebrando"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-neon">
                      {index === 1 ? <Play className="h-6 w-6" /> : <Image className="h-6 w-6" />}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-neon">
                  {index === 1 ? "Resultados" : index === 2 ? "Tabela" : "Destaque"}
                </span>
                <h3 className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2 text-[8px] text-muted-foreground">{article.date} · IS Arena</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card-arena p-4">
        <SectionHeader title="Biblioteca de mídia" action="Abrir biblioteca" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.06] bg-[linear-gradient(135deg,#162219,#080b0d)]"
            >
              {index < 2 && (
                <img
                  src="/assets/news-victory.webp"
                  alt=""
                  className="h-full w-full object-cover opacity-70 transition group-hover:scale-105 group-hover:opacity-90"
                />
              )}
              {index >= 2 && (
                <div className="grid h-full place-items-center text-white/18">
                  <Image className="h-6 w-6" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[7px] text-white/65 backdrop-blur">
                {index < 3 ? "Foto" : "Arte"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
