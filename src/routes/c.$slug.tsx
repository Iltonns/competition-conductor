import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ExternalLink, MapPin, Newspaper, Radio, Shield, Trophy } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { getPublicPortal } from "@/features/publishing/api/publishing";

export const Route = createFileRoute("/c/$slug")({
  loader: ({ params }) => getPublicPortal(params.slug),
  head: ({ loaderData, params }) => {
    const name =
      loaderData?.championship.name ?? decodeURIComponent(params.slug).replaceAll("-", " ");
    const description =
      loaderData?.championship.description ?? "Portal oficial do campeonato no IS Arena.";
    return {
      meta: [
        { title: `${name} · IS Arena` },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: `${name} · IS Arena` },
        { property: "og:description", content: description },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicChampionship,
});

function PublicChampionship() {
  const portal = Route.useLoaderData();
  if (!portal)
    return (
      <div className="grid min-h-screen place-items-center bg-[#050706] px-4 text-center">
        <div>
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Campeonato indisponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este portal não existe ou ainda não foi publicado.
          </p>
          <Button className="mt-5" variant="outline" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  const { championship, page } = portal;
  const visible = new Set(page.visible_sections);
  const accent = page.theme.accent || "#bef52d";
  return (
    <div
      className="min-h-screen bg-[#050706] text-white"
      style={{ "--portal-accent": accent } as React.CSSProperties}
    >
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050706]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {championship.logo_url ? (
              <img
                src={championship.logo_url}
                alt=""
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <IsArenaLogo size={30} showWordmark={false} />
            )}
            <strong className="font-display text-sm">{championship.name}</strong>
          </div>
          <nav className="hidden gap-5 text-xs text-white/60 md:flex">
            {["Jogos", "Classificação", "Equipes", "Notícias", "Galeria"].map((item) => (
              <a
                key={item}
                href={`#${item
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()}`}
              >
                {item}
              </a>
            ))}
          </nav>
          <Button size="sm" variant="outline" asChild>
            <Link to="/auth">Organizador</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{
              backgroundImage: championship.cover_url
                ? `url(${championship.cover_url})`
                : "linear-gradient(135deg,#172019,#050706)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050706] via-[#050706]/80 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-5 py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--portal-accent)]/30 px-3 py-1 text-[10px] uppercase tracking-[.18em] text-[var(--portal-accent)]">
              <Trophy className="h-3 w-3" /> Portal oficial {championship.season}
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-extrabold uppercase leading-none sm:text-7xl">
              {championship.name}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/65">
              {championship.description}
            </p>
            <p className="mt-5 flex items-center gap-2 text-xs text-white/50">
              <MapPin className="h-4 w-4" />{" "}
              {[championship.city, championship.state].filter(Boolean).join(" · ") ||
                "Local a definir"}
            </p>
          </div>
        </section>
        {visible.has("matches") && (
          <Section
            id="jogos"
            title="Jogos e resultados"
            icon={<CalendarDays className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {portal.matches.map((match) => (
                <article
                  key={match.id}
                  className="rounded-xl border border-white/10 bg-white/[.025] p-4"
                >
                  <div className="flex justify-between text-[10px] text-white/45">
                    <span>
                      {match.scheduled_at
                        ? new Date(match.scheduled_at).toLocaleString("pt-BR")
                        : "A definir"}
                    </span>
                    <span>{match.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                    <strong>{match.home_team.name ?? "A definir"}</strong>
                    <span className="font-display text-2xl font-extrabold">
                      {match.home_score} × {match.away_score}
                    </span>
                    <strong>{match.away_team.name ?? "A definir"}</strong>
                  </div>
                  {match.broadcast_url && (
                    <a
                      className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--portal-accent)]"
                      href={match.broadcast_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Radio className="h-4 w-4" /> Transmissão oficial{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </article>
              ))}
            </div>
            {portal.matches.length === 0 && <Empty />}
          </Section>
        )}
        {visible.has("standings") && (
          <Section id="classificacao" title="Classificação" icon={<Trophy className="h-5 w-5" />}>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/5 text-white/45">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Equipe</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>SG</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {portal.standings.map((row) => (
                    <tr key={row.team_id} className="border-t border-white/10 text-center">
                      <td className="p-3 text-left">{row.position}</td>
                      <td className="p-3 text-left font-semibold">{row.team_name}</td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goal_difference}</td>
                      <td className="font-bold text-[var(--portal-accent)]">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {portal.standings.length === 0 && <Empty />}
          </Section>
        )}
        {visible.has("teams") && (
          <Section id="equipes" title="Equipes" icon={<Shield className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {portal.teams.map((team) => (
                <article
                  key={team.id}
                  className="rounded-xl border border-white/10 p-4 text-center"
                >
                  {team.crest_url ? (
                    <img src={team.crest_url} alt="" className="mx-auto h-14 w-14 object-contain" />
                  ) : (
                    <Shield className="mx-auto h-10 w-10 text-white/20" />
                  )}
                  <strong className="mt-3 block text-xs">{team.name}</strong>
                </article>
              ))}
            </div>
          </Section>
        )}
        {visible.has("news") && (
          <Section id="noticias" title="Notícias" icon={<Newspaper className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-3">
              {portal.news.map((news) => (
                <article
                  key={news.id}
                  className="rounded-xl border border-white/10 bg-white/[.025] p-4"
                >
                  <span className="text-[9px] uppercase text-[var(--portal-accent)]">
                    {news.published_at
                      ? new Date(news.published_at).toLocaleDateString("pt-BR")
                      : "Notícia"}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold">{news.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">{news.summary}</p>
                </article>
              ))}
            </div>
            {portal.news.length === 0 && <Empty />}
          </Section>
        )}
        {visible.has("media") && (
          <Section id="galeria" title="Galeria" icon={<Newspaper className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {portal.media
                .filter((item) => item.mime_type?.startsWith("image/") && item.signed_url)
                .map((item) => (
                  <a
                    key={item.id}
                    href={item.signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-video overflow-hidden rounded-xl border border-white/10"
                  >
                    <img
                      src={item.signed_url}
                      alt={item.alt_text ?? item.title}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
            </div>
          </Section>
        )}
        {visible.has("sponsors") && (
          <Section id="patrocinadores" title="Patrocinadores" icon={<Trophy className="h-5 w-5" />}>
            <div className="flex flex-wrap justify-center gap-3">
              {portal.sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website ?? undefined}
                  target={sponsor.website ? "_blank" : undefined}
                  rel="noreferrer"
                  className="grid h-20 min-w-36 place-items-center rounded-xl border border-white/10 bg-white p-3 text-center text-sm font-bold text-black"
                >
                  {sponsor.logo_url ? (
                    <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-12 max-w-28" />
                  ) : (
                    sponsor.name
                  )}
                </a>
              ))}
            </div>
          </Section>
        )}
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        {championship.name} · publicado com IS Arena
      </footer>
    </div>
  );
}
function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-5 flex items-center gap-2 text-[var(--portal-accent)]">
        {icon}
        <h2 className="font-display text-xl font-extrabold uppercase text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function Empty() {
  return <p className="py-6 text-center text-xs text-white/40">Nenhum conteúdo publicado.</p>;
}
