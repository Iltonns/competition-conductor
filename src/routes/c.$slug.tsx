import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Instagram, Menu, Play, Radio, Trophy } from "lucide-react";
import {
  MatchRow,
  PlayerAvatar,
  SectionHeader,
  StandingsTable,
  TeamCrest,
} from "@/components/arena/arena-ui";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { NEWS, SCORERS, STANDINGS, TEAMS, UPCOMING_MATCHES } from "@/data/arena-demo";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${decodeURIComponent(params.slug).replace(/-/g, " ")} · IS Arena`,
      },
      {
        name: "description",
        content: "Página oficial da Copa da Baixada 2026 no IS Arena.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Copa da Baixada 2026 · IS Arena" },
      {
        property: "og:description",
        content: "Jogos, classificação, artilharia e notícias da competição.",
      },
      { property: "og:image", content: "/assets/arena-hero.webp" },
    ],
  }),
  component: PublicChampionship,
});

const PUBLIC_NAV = [
  "Início",
  "Jogos",
  "Classificação",
  "Equipes",
  "Notícias",
  "Galeria",
  "Artilharia",
];

function PublicChampionship() {
  return (
    <div className="min-h-screen bg-[#050706] px-0 py-0 text-foreground md:px-4 md:py-4">
      <div className="mx-auto max-w-[1440px] overflow-hidden border-white/[0.09] bg-[#090d0f] shadow-[0_40px_100px_-56px_rgba(0,0,0,1)] md:rounded-2xl md:border">
        <section className="hero-media relative min-h-[470px] bg-[url('/assets/arena-hero.webp')] md:min-h-[430px]">
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d0f] via-transparent to-black/25" />

          <header className="relative z-10 border-b border-white/[0.06] bg-black/10 backdrop-blur-sm">
            <div className="flex h-16 items-center justify-between gap-5 px-4 sm:px-6 md:px-8">
              <IsArenaLogo size={30} />
              <nav
                className="hidden items-center gap-6 lg:flex"
                aria-label="Navegação do campeonato"
              >
                {PUBLIC_NAV.map((item, index) => (
                  <a
                    key={item}
                    href={`#${normalizeAnchor(item)}`}
                    className={`relative py-5 text-[9px] font-semibold transition hover:text-neon ${index === 0 ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-neon" : "text-foreground/62"}`}
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="hidden text-[9px] font-semibold text-foreground/65 transition hover:text-neon sm:block"
                >
                  Área do organizador
                </Link>
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/20 lg:hidden"
                  aria-label="Abrir navegação"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="relative z-[1] flex min-h-[404px] items-center px-5 pb-10 pt-8 sm:px-8 md:px-12">
            <div className="max-w-md">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-neon">
                Portal oficial
              </p>
              <h1 className="mt-4 font-display text-[2.65rem] font-extrabold uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
                Copa da
                <br />
                <span className="text-neon">Baixada</span>
              </h1>
              <p className="mt-2 font-display text-xl font-extrabold">2026</p>
              <p className="mt-4 max-w-sm text-[9px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-white/66 sm:text-[10px]">
                A maior competição amadora da região
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button className="h-9 bg-neon px-4 text-[10px] text-neon-foreground hover:bg-neon/90">
                  Acompanhar agora
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 border-white/15 bg-black/25 px-4 text-[10px] backdrop-blur"
                >
                  <Play className="h-3.5 w-3.5" />
                  Últimos gols
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-5 text-[8px] uppercase tracking-[0.12em] text-white/50">
                <span>
                  <strong className="mr-1 text-sm text-white">8</strong> equipes
                </span>
                <span>
                  <strong className="mr-1 text-sm text-white">32</strong> jogos
                </span>
                <span>
                  <strong className="mr-1 text-sm text-white">1</strong> campeão
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 p-3 sm:p-5 md:p-6">
          <section className="card-arena p-4" aria-labelledby="sponsors-title">
            <p id="sponsors-title" className="mb-4 text-[9px] font-semibold text-muted-foreground">
              Patrocinadores
            </p>
            <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-5">
              {["Montanha", "Aurora", "Vertex", "Umbra", "Credisul"].map((sponsor) => (
                <div
                  key={sponsor}
                  className="grid h-10 place-items-center rounded-lg border border-white/[0.04] bg-white/[0.018] font-display text-[10px] font-extrabold uppercase tracking-[-0.02em] text-white/58"
                >
                  {sponsor}
                </div>
              ))}
            </div>
          </section>

          <section id="jogos" className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="card-arena p-4">
              <SectionHeader title="Próximos jogos" action="Ver todos" />
              <div className="mt-3 space-y-2">
                {UPCOMING_MATCHES.map((match) => (
                  <MatchRow key={match.id} {...match} compact />
                ))}
              </div>
            </div>

            <div id="classificacao" className="card-arena min-w-0 p-4">
              <SectionHeader title="Classificação" action="Ver tabela completa" />
              <div className="mt-3">
                <StandingsTable rows={STANDINGS} compact />
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <div id="noticias" className="card-arena overflow-hidden p-3">
              <SectionHeader title="Últimas notícias" action="Todas as notícias" />
              <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_.6fr]">
                <article className="group relative min-h-[260px] overflow-hidden rounded-xl border border-white/[0.06]">
                  <img
                    src="/assets/news-victory.webp"
                    alt="Jogadores fictícios comemorando uma vitória"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-neon">
                      Destaque
                    </p>
                    <h2 className="mt-2 max-w-lg font-display text-xl font-extrabold leading-tight tracking-[-0.035em] sm:text-2xl">
                      {NEWS[0].title}
                    </h2>
                    <p className="mt-2 text-[9px] text-white/58">{NEWS[0].date} · Por IS Arena</p>
                  </div>
                </article>

                <div className="space-y-2">
                  {NEWS.slice(1).map((article) => (
                    <article
                      key={article.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-neon/15 hover:bg-white/[0.035]"
                    >
                      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-neon">
                        Notícias
                      </p>
                      <h3 className="mt-2 text-[11px] font-bold leading-snug">{article.title}</h3>
                      <p className="mt-2 text-[8px] text-muted-foreground">
                        {article.date} · IS Arena
                      </p>
                    </article>
                  ))}
                  <a
                    href="#transmissao"
                    className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-neon/5 p-3 text-[9px] font-semibold text-neon transition hover:bg-neon/10"
                  >
                    <Radio className="h-3.5 w-3.5" /> Acompanhar transmissão
                  </a>
                </div>
              </div>
            </div>

            <div id="artilharia" className="card-arena p-4">
              <SectionHeader title="Artilharia" action="Ranking completo" />
              <div className="mt-4 flex items-center gap-4 rounded-xl border border-neon/15 bg-neon/[0.045] p-4">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-[conic-gradient(var(--color-neon)_0_78%,rgba(255,255,255,.07)_78%)]" />
                  <PlayerAvatar
                    initials={SCORERS[0].initials}
                    size="lg"
                    className="relative border-4 border-card"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                    Líder
                  </p>
                  <h3 className="mt-1 truncate text-sm font-bold">{SCORERS[0].name}</h3>
                  <p className="text-[9px] text-muted-foreground">{SCORERS[0].team.name}</p>
                </div>
                <div className="text-right">
                  <strong className="block font-display text-3xl font-extrabold text-neon">
                    {SCORERS[0].goals}
                  </strong>
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground">
                    gols
                  </span>
                </div>
              </div>
              <ol className="mt-3 divide-y divide-white/[0.055]">
                {SCORERS.slice(1, 5).map((scorer) => (
                  <li key={scorer.name} className="flex items-center gap-2.5 py-2.5">
                    <span className="w-4 text-center text-[9px] text-muted-foreground">
                      {scorer.position}
                    </span>
                    <PlayerAvatar initials={scorer.initials} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold">
                        {scorer.name}
                      </span>
                      <span className="block text-[8px] text-muted-foreground">
                        {scorer.team.name}
                      </span>
                    </span>
                    <strong className="font-display text-sm">{scorer.goals}</strong>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] px-5 py-6 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <IsArenaLogo size={25} />
            <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
              <span>Página oficial da Copa da Baixada 2026</span>
              <a
                href="#instagram"
                className="transition hover:text-neon"
                aria-label="Instagram da competição"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </footer>
      </div>
      <div className="sr-only">
        Equipes participantes em destaque: {TEAMS.amazonas.name} e {TEAMS.guarani.name}. Símbolo do
        campeonato: <Trophy />
      </div>
    </div>
  );
}

function normalizeAnchor(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}
