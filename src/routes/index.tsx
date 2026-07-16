import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Globe2,
  Radio,
  ShieldCheck,
  Smartphone,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { MatchRow, SectionHeader, StandingsTable, TeamCrest } from "@/components/arena/arena-ui";
import { Button } from "@/components/ui/button";
import { SCORERS, STANDINGS, TEAMS, UPCOMING_MATCHES } from "@/data/arena-demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IS Arena — SaaS premium para competições" },
      {
        name: "description",
        content:
          "Sistema esportivo premium para organizar campeonatos, equipes, atletas, súmula digital, estatísticas e páginas públicas.",
      },
    ],
  }),
  component: Landing,
});

const MODULES = [
  { icon: Trophy, title: "Campeonatos", text: "Temporadas, fases, grupos e regras de disputa em uma operação centralizada." },
  { icon: Users, title: "Equipes & atletas", text: "Elencos, documentos, status de inscrição e histórico competitivo." },
  { icon: Radio, title: "Súmula ao vivo", text: "Eventos de jogo, cartões, gols e substituições registrados no celular." },
  { icon: BarChart3, title: "Estatísticas", text: "Classificação, artilharia e indicadores prontos para organizadores e público." },
  { icon: WalletCards, title: "Financeiro", text: "Controle receitas, despesas, patrocinadores e prestação de contas." },
  { icon: Globe2, title: "Portal público", text: "Landing da competição com agenda, notícias, ranking e resultados." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-arena text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <IsArenaLogo />
          <nav className="hidden items-center gap-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground md:flex">
            <a href="#produto" className="transition hover:text-neon">Produto</a>
            <a href="#modulos" className="transition hover:text-neon">Módulos</a>
            <a href="#publico" className="transition hover:text-neon">Página pública</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden text-xs font-semibold text-muted-foreground transition hover:text-neon sm:block">
              Entrar
            </Link>
            <Button asChild className="bg-neon text-neon-foreground hover:bg-neon/90">
              <Link to="/auth">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section id="produto" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/arena-hero.webp')] bg-cover bg-center opacity-22" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/42" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-neon/25 bg-neon/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neon">
                <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_16px_var(--color-neon)]" />
                Sports management OS
              </div>
              <h1 className="mt-5 font-display text-5xl font-black leading-[0.92] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
                IS Arena
                <span className="block text-neon">gestão premium</span>
                para competições.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Organize campeonatos com uma plataforma esportiva completa: dashboard, equipes,
                atletas, partidas, súmula digital, estatísticas, financeiro e portal público.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-neon text-neon-foreground hover:bg-neon/90">
                  <Link to="/auth">
                    Criar competição <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/12 bg-black/20">
                  <Link to="/c/copa-da-baixada-2026">Ver portal público</Link>
                </Button>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/[0.08] pt-6">
                {[
                  ["32", "partidas"],
                  ["8", "equipes"],
                  ["432", "atletas"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong className="font-display text-3xl font-black text-neon">{value}</strong>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-w-0 lg:justify-self-end">
              <div className="card-arena overflow-hidden p-3 shadow-elevated">
                <div className="rounded-xl border border-white/[0.06] bg-background/72 p-3">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neon">Final · Ao vivo</p>
                      <p className="mt-1 font-display text-sm font-bold">Copa da Baixada 2026</p>
                    </div>
                    <span className="rounded-md border border-neon/25 bg-neon/10 px-2 py-1 text-[10px] font-bold text-neon">88'</span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-6 text-center">
                    <div className="min-w-0 space-y-2">
                      <TeamCrest team={TEAMS.amazonas} size="lg" className="justify-center" showStars />
                      <p className="truncate text-xs font-bold">Amazonas EC</p>
                    </div>
                    <div>
                      <p className="font-display text-5xl font-black tracking-[-0.05em]">2–1</p>
                      <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">placar</p>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <TeamCrest team={TEAMS.guarani} size="lg" className="justify-center" />
                      <p className="truncate text-xs font-bold">Guarani FC</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ["12'", "Gol · João Pedro"],
                      ["45'", "Cartão · Vinícius"],
                      ["73'", "Gol · M. Lima"],
                    ].map(([minute, event]) => (
                      <div key={minute} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2">
                        <strong className="font-display text-xs text-neon">{minute}</strong>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modulos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon">Plataforma completa</p>
            <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
              Tudo que uma operação esportiva profissional precisa.
            </h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((item) => (
              <article key={item.title} className="card-arena card-interactive min-h-40 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon/15 bg-neon/10 text-neon">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="publico" className="border-y border-white/[0.06] bg-surface/35">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
            <div className="self-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon">Experiência pública</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                O campeonato também vira mídia.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
                Cada competição pode ter uma página pública com identidade visual, agenda, notícias,
                classificação, artilharia e próximos jogos — pronta para atletas, torcedores e patrocinadores.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {["Layout responsivo para mobile", "Ranking e tabela sempre visíveis", "Espaços para patrocinadores e notícias"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-neon" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-[1fr_.9fr]">
              <div className="card-arena min-w-0 p-4">
                <SectionHeader title="Próximos jogos" action="Ver todos" />
                <div className="mt-3 space-y-2">
                  {UPCOMING_MATCHES.map((match) => (
                    <MatchRow key={match.id} {...match} compact />
                  ))}
                </div>
              </div>
              <div className="card-arena min-w-0 p-4">
                <SectionHeader title="Classificação" action="Completa" />
                <div className="mt-3">
                  <StandingsTable rows={STANDINGS} compact />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Seguro por organização", text: "Dados separados por organizador, com permissões e autenticação." },
              { icon: Smartphone, title: "Mobile-first em campo", text: "Fluxos rápidos para registrar jogo, atletas e eventos ao vivo." },
              { icon: CalendarCheck, title: "Rotina operacional", text: "Agenda, status, filtros e módulos preparados para crescer." },
            ].map((item) => (
              <article key={item.title} className="flex gap-4 border-t border-white/[0.08] pt-5">
                <item.icon className="mt-1 h-5 w-5 shrink-0 text-neon" />
                <div>
                  <h3 className="font-display text-sm font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="card-arena grid gap-6 overflow-hidden p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon">Pronto para começar</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em]">
                Leve sua competição para um padrão profissional.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Cadastre seu primeiro campeonato e veja a operação ganhar forma em poucos minutos.
              </p>
            </div>
            <Button asChild size="lg" className="bg-neon text-neon-foreground hover:bg-neon/90">
              <Link to="/auth">
                Acessar IS Arena <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-7 text-center text-[10px] text-muted-foreground sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <IsArenaLogo size={26} />
          <span>© 2026 IS Arena · Plataforma premium para gestão esportiva.</span>
          <span className="font-semibold text-neon">Artilheiro demo: {SCORERS[0].name}</span>
        </div>
      </footer>
    </div>
  );
}