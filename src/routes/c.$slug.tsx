import { createFileRoute, Link } from "@tanstack/react-router";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.slug).replace(/-/g, " ")} · IS Arena` },
      { name: "description", content: "Página oficial do campeonato · IS Arena" },
    ],
  }),
  component: PublicChampionship,
});

function PublicChampionship() {
  return (
    <div className="bg-arena min-h-screen text-foreground">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-5 py-4">
          <IsArenaLogo />
          <nav className="hidden items-center gap-5 text-xs uppercase tracking-widest text-muted-foreground md:flex">
            {["Início", "Jogos", "Classificação", "Equipes", "Notícias", "Galeria", "Artilharia"].map((n) => (
              <a key={n} href="#" className="hover:text-foreground">{n}</a>
            ))}
          </nav>
          <Link to="/auth">
            <Button size="sm" variant="outline" className="border-border bg-card/40">Entrar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(70%_50%_at_100%_20%,var(--color-neon-soft),transparent_60%)]" />
        <div className="container relative mx-auto grid gap-8 px-5 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <div className="text-xs uppercase tracking-[0.35em] text-neon">Copa</div>
            <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] md:text-7xl">
              Copa da <br /> <span className="text-neon">Baixada</span> 2026
            </h1>
            <p className="mt-4 max-w-md text-sm uppercase tracking-widest text-muted-foreground">
              A maior competição amadora da região
            </p>
            <div className="mt-8 flex gap-3">
              <Button size="lg" className="bg-neon text-neon-foreground hover:bg-neon/90">
                Acompanhar agora <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border bg-card/40">
                Tabela de jogos
              </Button>
            </div>
          </div>
          <div className="card-arena flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-neon/10 text-neon">
                <span className="font-display text-6xl font-black">🏆</span>
              </div>
              <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                Edição 2026 · 8 equipes · 32 jogos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-6 px-5 py-6 text-xs uppercase tracking-widest text-muted-foreground md:gap-10">
          <span>Patrocinadores</span>
          {["Sport +", "Umbro", "TNT", "Sicredi", "Arena Co."].map((s) => (
            <span key={s} className="font-display text-sm font-bold text-foreground/70">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Matches + standings */}
      <section className="container mx-auto grid gap-6 px-5 py-12 lg:grid-cols-2">
        <div className="card-arena p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest">
              Próximos jogos
            </h3>
            <a href="#" className="text-xs text-muted-foreground hover:text-neon">Ver todos</a>
          </div>
          <ul className="space-y-3">
            {[
              { h: "Amazonas EC", a: "Guarani FC", d: "05 JUL · 15:00", v: "Arena da Montanha" },
              { h: "Real Unidos", a: "Vila Nova FC", d: "06 JUL · 10:00", v: "Vila Verde" },
            ].map((m) => (
              <li key={m.d} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Semifinal
                </div>
                <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-semibold">
                  <span className="text-right">{m.h}</span>
                  <span className="rounded bg-card px-2 py-1 text-center font-display text-xs text-neon">VS</span>
                  <span>{m.a}</span>
                </div>
                <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{m.d}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.v}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-arena p-5">
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest">
            Classificação
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-1.5 text-left">Pos</th>
                <th className="py-1.5 text-left">Equipe</th>
                <th className="py-1.5 text-right">P</th>
                <th className="py-1.5 text-right">J</th>
                <th className="py-1.5 text-right">SG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { p: 1, t: "Amazonas EC", pts: 12, j: 5, sg: 8 },
                { p: 2, t: "Guarani FC", pts: 10, j: 5, sg: 5 },
                { p: 3, t: "Real Unidos", pts: 8, j: 5, sg: 3 },
                { p: 4, t: "Vila Nova FC", pts: 4, j: 5, sg: -2 },
              ].map((r) => (
                <tr key={r.t}>
                  <td className="py-2">
                    <span className={"grid h-6 w-6 place-items-center rounded text-[11px] font-bold " + (r.p === 1 ? "bg-neon/15 text-neon" : "bg-secondary")}>
                      {r.p}
                    </span>
                  </td>
                  <td className="py-2 font-semibold">{r.t}</td>
                  <td className="py-2 text-right font-display font-black">{r.pts}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.j}</td>
                  <td className="py-2 text-right">{r.sg > 0 ? `+${r.sg}` : r.sg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center gap-3 px-5 py-8 text-xs text-muted-foreground md:flex-row md:justify-between">
          <IsArenaLogo size={22} />
          <span>Página oficial gerada pelo IS Arena.</span>
        </div>
      </footer>
    </div>
  );
}
