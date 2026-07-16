import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Instagram,
  MapPin,
  Menu,
  Play,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import {
  MatchRow,
  PlayerAvatar,
  SectionHeader,
  StandingsTable,
  TeamCrest,
} from "@/components/arena/arena-ui";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import {
  NEWS,
  RECENT_RESULTS,
  SCORERS,
  STANDINGS,
  TEAMS,
  UPCOMING_MATCHES,
} from "@/data/arena-demo";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => {
    const title = `${decodeURIComponent(params.slug).replace(/-/g, " ")} · IS Arena`;
    const description =
      "Portal oficial da Copa da Baixada 2026: jogos, classificação, artilharia, notícias e transmissões ao vivo.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: "Copa da Baixada 2026 · IS Arena" },
        { property: "og:description", content: description },
        { property: "og:image", content: "/assets/arena-hero.webp" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
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

const HERO_STATS = [
  { label: "Equipes", value: "8" },
  { label: "Partidas", value: "32" },
  { label: "Gols marcados", value: "97" },
  { label: "Público total", value: "12k" },
];

const SPONSORS = ["Montanha", "Aurora", "Vertex", "Umbra", "Credisul", "Alpha"];

function PublicChampionship() {
  const nextMatch = UPCOMING_MATCHES[0];
  const leader = SCORERS[0];

  return (
    <div className="min-h-screen bg-[#050706] text-foreground">
      {/* Top ribbon */}
      <div className="border-b border-white/[0.05] bg-black/60 backdrop-blur">
        <div className="mx-auto flex h-8 max-w-[1440px] items-center justify-between px-4 text-[10px] uppercase tracking-[0.18em] text-white/45 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
            </span>
            Temporada 2026 em andamento
          </span>
          <span className="hidden items-center gap-6 md:flex">
            <span>Transmissão oficial</span>
            <span>Arena da Montanha</span>
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050706]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-6 px-4 sm:px-8">
            <div className="flex items-center gap-8">
              <IsArenaLogo size={30} />
              <nav
                className="hidden items-center gap-7 lg:flex"
                aria-label="Navegação do campeonato"
              >
                {PUBLIC_NAV.map((item, index) => (
                  <a
                    key={item}
                    href={`#${normalizeAnchor(item)}`}
                    className={`relative py-5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:text-neon ${
                      index === 0
                        ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full after:bg-neon"
                        : "text-foreground/55"
                    }`}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/auth"
                className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/65 transition hover:text-neon sm:block"
              >
                Área do organizador
              </Link>
              <Button
                asChild
                size="sm"
                className="hidden h-9 bg-neon px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-neon-foreground hover:bg-neon/90 sm:inline-flex"
              >
                <a href="#jogos">
                  Ver jogos
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
              <button
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-black/20 lg:hidden"
                aria-label="Abrir navegação"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/arena-hero.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050706] via-[#050706]/85 to-[#050706]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050706] via-transparent to-[#050706]/40" />
          <div
            className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, oklch(0.9 0.24 128 / 0.35), transparent 65%)" }}
          />

          <div className="relative grid gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.15fr_.85fr] md:px-12 md:py-20 lg:py-24">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-neon">
                <Trophy className="h-3 w-3" /> Portal oficial · Temporada 2026
              </div>
              <h1 className="mt-6 font-display text-[2.75rem] font-extrabold uppercase leading-[0.9] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Copa da
                <br />
                <span className="text-neon">Baixada</span>
                <span className="ml-3 align-top font-display text-2xl font-extrabold text-white/60 sm:text-3xl">
                  '26
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-[15px]">
                Acompanhe em tempo real a maior competição amadora da região.
                Jogos, súmulas digitais, classificação atualizada e cobertura
                completa das oito equipes que disputam o título.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className="h-11 bg-neon px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-neon-foreground hover:bg-neon/90">
                  Acompanhar ao vivo
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-white/15 bg-white/[0.04] px-5 text-[12px] font-semibold uppercase tracking-[0.14em] backdrop-blur hover:bg-white/[0.08]"
                >
                  <Play className="h-4 w-4" />
                  Melhores momentos
                </Button>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="border-l border-white/10 pl-3">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 font-display text-xl font-extrabold tracking-[-0.03em] text-white sm:text-2xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Next match card */}
            <div className="relative self-end">
              <article className="card-arena border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em]">
                  <span className="inline-flex items-center gap-2 text-neon">
                    <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                    Próximo jogo
                  </span>
                  <span className="text-white/50">{nextMatch.phase}</span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <TeamCrest team={nextMatch.home} size="lg" />
                    <span className="text-xs font-semibold">{nextMatch.home.shortName}</span>
                    <span className="text-[9px] text-white/45">Mandante</span>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-4xl font-extrabold tracking-[-0.04em] text-white">
                      VS
                    </p>
                    <p className="mt-2 font-display text-lg font-bold text-neon">
                      {nextMatch.time}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                      {nextMatch.date}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <TeamCrest team={nextMatch.away} size="lg" />
                    <span className="text-xs font-semibold">{nextMatch.away.shortName}</span>
                    <span className="text-[9px] text-white/45">Visitante</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-neon" /> {nextMatch.venue}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-neon" /> {nextMatch.status}
                  </span>
                </div>
                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-neon/25 bg-neon/[0.06] py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neon transition hover:bg-neon/10">
                  <Radio className="h-3.5 w-3.5" /> Assistir transmissão
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* Sponsors marquee */}
        <section aria-labelledby="sponsors-title" className="border-y border-white/[0.05] bg-black/40">
          <div className="flex flex-col items-center gap-4 px-5 py-6 sm:flex-row sm:gap-8 sm:px-8">
            <p
              id="sponsors-title"
              className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40"
            >
              Patrocinadores oficiais
            </p>
            <div className="grid flex-1 grid-cols-3 items-center gap-4 sm:grid-cols-6">
              {SPONSORS.map((sponsor) => (
                <div
                  key={sponsor}
                  className="grid h-10 place-items-center font-display text-[13px] font-extrabold uppercase tracking-[-0.02em] text-white/45 transition hover:text-white/85"
                >
                  {sponsor}
                </div>
              ))}
            </div>
          </div>
        </section>

        <main className="space-y-8 px-4 py-10 sm:px-8 md:py-14">
          {/* Recent results strip */}
          <section aria-label="Resultados recentes">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon">
                  Últimos resultados
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                  Rodada anterior
                </h2>
              </div>
              <a
                href="#jogos"
                className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60 hover:text-neon sm:inline-flex"
              >
                Todos os resultados <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {RECENT_RESULTS.map((result) => (
                <article
                  key={result.id}
                  className="card-arena flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <TeamCrest team={result.home} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{result.home.name}</p>
                      <p className="text-[10px] text-white/45">Mandante</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-3xl font-extrabold tracking-[-0.04em]">
                      <span
                        className={
                          result.homeScore > result.awayScore ? "text-neon" : "text-white/70"
                        }
                      >
                        {result.homeScore}
                      </span>
                      <span className="mx-2 text-white/25">:</span>
                      <span
                        className={
                          result.awayScore > result.homeScore ? "text-neon" : "text-white/70"
                        }
                      >
                        {result.awayScore}
                      </span>
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/45">
                      {result.date} · Encerrada
                    </p>
                  </div>
                  <div className="flex flex-1 items-center justify-end gap-3">
                    <div className="min-w-0 text-right">
                      <p className="truncate text-sm font-semibold">{result.away.name}</p>
                      <p className="text-[10px] text-white/45">Visitante</p>
                    </div>
                    <TeamCrest team={result.away} size="md" />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Matches + standings */}
          <section id="jogos" className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="card-arena p-5">
              <SectionHeader
                eyebrow="Agenda"
                title="Próximas partidas"
                action="Ver calendário completo"
              />
              <div className="mt-4 space-y-3">
                {UPCOMING_MATCHES.map((match) => (
                  <MatchRow key={match.id} {...match} />
                ))}
              </div>
            </div>

            <div id="classificacao" className="card-arena min-w-0 p-5">
              <SectionHeader
                eyebrow="Grupo A"
                title="Classificação"
                action="Ver tabela completa"
              />
              <div className="mt-4">
                <StandingsTable rows={STANDINGS} compact />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4 text-[10px] text-white/50">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-neon" /> Classificado
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-neon" /> Regulamento oficial
                </span>
              </div>
            </div>
          </section>

          {/* News + top scorer */}
          <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <div id="noticias" className="card-arena overflow-hidden p-5">
              <SectionHeader eyebrow="Cobertura" title="Últimas notícias" action="Todas as notícias" />
              <div className="mt-4 grid gap-4 md:grid-cols-[1.35fr_.65fr]">
                <article className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-white/[0.06]">
                  <img
                    src="/assets/news-victory.webp"
                    alt="Jogadores comemorando uma vitória"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon">
                      Destaque · {NEWS[0].date}
                    </p>
                    <h3 className="mt-3 max-w-lg font-display text-2xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-3xl">
                      {NEWS[0].title}
                    </h3>
                    <p className="mt-3 max-w-md text-[12px] leading-relaxed text-white/70">
                      {NEWS[0].excerpt}
                    </p>
                    <button className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neon">
                      Ler matéria completa <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>

                <div className="space-y-3">
                  {NEWS.slice(1).map((article) => (
                    <article
                      key={article.id}
                      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-neon/20 hover:bg-white/[0.04]"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neon">
                        {article.date}
                      </p>
                      <h4 className="mt-2 text-[13px] font-bold leading-snug">{article.title}</h4>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/55">
                        {article.excerpt}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 transition group-hover:text-neon">
                        Ler mais <ChevronRight className="h-3 w-3" />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div id="artilharia" className="card-arena p-5">
              <SectionHeader eyebrow="Top scorers" title="Artilharia" action="Ranking completo" />
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-neon/20 bg-gradient-to-br from-neon/[0.09] to-transparent p-5">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-[conic-gradient(var(--color-neon)_0_82%,rgba(255,255,255,.08)_82%)]" />
                  <PlayerAvatar
                    initials={leader.initials}
                    size="lg"
                    className="relative border-4 border-card"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neon">
                    Líder
                  </p>
                  <h3 className="mt-1 truncate text-base font-bold">{leader.name}</h3>
                  <p className="text-[11px] text-white/55">{leader.team.name}</p>
                </div>
                <div className="text-right">
                  <strong className="block font-display text-4xl font-extrabold leading-none text-neon">
                    {leader.goals}
                  </strong>
                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/50">gols</span>
                </div>
              </div>
              <ol className="mt-4 divide-y divide-white/[0.06]">
                {SCORERS.slice(1, 5).map((scorer) => (
                  <li key={scorer.name} className="flex items-center gap-3 py-3">
                    <span className="w-5 text-center font-display text-xs font-bold text-white/45">
                      {scorer.position}
                    </span>
                    <PlayerAvatar initials={scorer.initials} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">
                        {scorer.name}
                      </span>
                      <span className="block text-[10px] text-white/45">{scorer.team.name}</span>
                    </span>
                    <strong className="font-display text-base font-extrabold">
                      {scorer.goals}
                    </strong>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* CTA */}
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-neon/[0.14] via-black/40 to-black p-8 md:p-12">
            <div
              className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, oklch(0.9 0.24 128 / 0.4), transparent 65%)" }}
            />
            <div className="relative grid gap-6 md:grid-cols-[1.4fr_.6fr] md:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neon">
                  Para organizadores
                </p>
                <h3 className="mt-3 max-w-xl font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl">
                  Gerencie seu próprio campeonato com a plataforma IS Arena.
                </h3>
                <p className="mt-3 max-w-lg text-sm text-white/65">
                  Súmula digital, classificação automática, financeiro, notícias
                  e página pública em um só lugar. Comece grátis em minutos.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Button
                  asChild
                  className="h-12 bg-neon px-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-neon-foreground hover:bg-neon/90"
                >
                  <Link to="/auth">
                    Criar meu campeonato
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
                  <Users className="h-3.5 w-3.5" /> +1.200 organizadores ativos
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-black/50 px-5 py-10 sm:px-8">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <IsArenaLogo size={28} />
              <p className="mt-4 max-w-xs text-[11px] leading-relaxed text-white/50">
                Portal oficial da Copa da Baixada 2026, mantido pela organização
                em parceria com a plataforma IS Arena.
              </p>
            </div>
            {[
              { title: "Competição", items: ["Jogos", "Classificação", "Equipes", "Artilharia"] },
              { title: "Conteúdo", items: ["Notícias", "Galeria", "Transmissões", "Súmulas"] },
              { title: "Organização", items: ["Regulamento", "Arbitragem", "Contato", "Área do organizador"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2 text-[12px] text-white/70">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="transition hover:text-neon">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">
              © 2026 Copa da Baixada · Powered by IS Arena
            </p>
            <div className="flex items-center gap-4 text-white/50">
              <a href="#" aria-label="Instagram" className="transition hover:text-neon">
                <Instagram className="h-4 w-4" />
              </a>
              <span className="text-[10px] uppercase tracking-[0.16em]">
                {TEAMS.amazonas.name} vs {TEAMS.guarani.name}
              </span>
            </div>
          </div>
        </footer>
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
