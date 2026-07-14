import { createFileRoute, Link } from "@tanstack/react-router";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, BarChart3, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IS Arena — Gestão premium para grandes competições" },
      {
        name: "description",
        content:
          "Organize campeonatos, equipes, atletas, súmula digital, financeiro e página pública com o IS Arena.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="bg-arena min-h-screen text-foreground">
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-5 py-5">
        <IsArenaLogo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Recursos</a>
          <a href="#modules" className="hover:text-foreground">Módulos</a>
          <Link to="/auth" className="hover:text-foreground">Entrar</Link>
        </nav>
        <Link to="/auth">
          <Button size="sm" className="bg-neon text-neon-foreground hover:bg-neon/90">
            Começar agora
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="container mx-auto grid gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:pt-16">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-neon shadow-[0_0_10px_var(--color-neon)]" />
            Sports OS · v1.0
          </div>
          <h1 className="font-display text-5xl font-black leading-[0.95] md:text-7xl">
            Gestão completa <br />
            para grandes <span className="text-neon">competições</span>.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            Do cadastro à súmula digital, do financeiro à página pública do
            campeonato — tudo em um só lugar, com estética esportiva premium.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-neon text-neon-foreground hover:bg-neon/90">
                Acompanhar agora <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <a href="#modules">
              <Button size="lg" variant="outline" className="border-border bg-card/40">
                Ver módulos
              </Button>
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              { k: "8", l: "Competições" },
              { k: "32", l: "Equipes" },
              { k: "432", l: "Atletas" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-black text-neon">{s.k}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative">
          <div className="card-arena relative overflow-hidden p-6">
            <div className="absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_100%_0%,var(--color-neon-soft),transparent_60%)]" />
            <div className="relative">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Semifinal · Jogo de Ida</span>
                <span className="rounded-full border border-border px-2 py-0.5">Ao vivo</span>
              </div>
              <div className="mt-6 grid grid-cols-3 items-center gap-3 text-center">
                <TeamCrest label="Amazonas EC" tone="neon" />
                <div>
                  <div className="font-display text-5xl font-black">2 - 1</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    88'
                  </div>
                </div>
                <TeamCrest label="Guarani FC" tone="info" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                <EventPill min="12'" label="Gol · João Pedro" tone="neon" />
                <EventPill min="45'" label="Amarelo · Vinícius" tone="warning" />
                <EventPill min="73'" label="Gol · M. Lima" tone="neon" />
              </div>
              <div className="mt-6 grid grid-cols-4 gap-2 border-t border-border pt-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                <div><div className="font-display text-lg text-foreground">63%</div>Posse</div>
                <div><div className="font-display text-lg text-foreground">14</div>Chutes</div>
                <div><div className="font-display text-lg text-foreground">6</div>Escanteios</div>
                <div><div className="font-display text-lg text-foreground">2</div>Cartões</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto grid gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { i: Trophy, t: "Campeonatos", d: "Grupos, mata-mata e critérios de desempate." },
          { i: Users, t: "Equipes & Atletas", d: "Elenco, escalações e histórico." },
          { i: BarChart3, t: "Estatísticas", d: "Artilharia, cartões, desempenho." },
          { i: ShieldCheck, t: "Súmula Digital", d: "Registre eventos ao vivo do celular." },
        ].map((f) => (
          <div key={f.t} className="card-arena p-5">
            <f.i className="h-6 w-6 text-neon" />
            <div className="mt-3 font-display font-bold">{f.t}</div>
            <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
          </div>
        ))}
      </section>

      <footer id="modules" className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:justify-between">
          <IsArenaLogo size={24} />
          <span>© 2026 IS Arena · Gestão completa para grandes competições.</span>
        </div>
      </footer>
    </div>
  );
}

function TeamCrest({ label, tone }: { label: string; tone: "neon" | "info" }) {
  const bg = tone === "neon" ? "bg-neon/15 text-neon" : "bg-info/15 text-info";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`grid h-16 w-16 place-items-center rounded-2xl border border-border ${bg} font-display text-xl font-black`}>
        {label
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="text-xs font-semibold">{label}</div>
    </div>
  );
}

function EventPill({ min, label, tone }: { min: string; label: string; tone: "neon" | "warning" }) {
  const c = tone === "neon" ? "text-neon" : "text-warning";
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1.5">
      <span className={`font-display text-xs font-bold ${c}`}>{min}</span>
      <span className="truncate text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

