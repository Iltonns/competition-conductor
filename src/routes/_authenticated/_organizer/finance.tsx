import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  CircleDollarSign,
  Download,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "@/components/arena/arena-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_organizer/finance")({
  head: () => ({ meta: [{ title: "Financeiro · IS Arena" }] }),
  component: FinancePage,
});

const TRANSACTIONS = [
  {
    title: "Inscrição · Amazonas EC",
    category: "Inscrições",
    date: "03 jul, 10:24",
    value: 650,
    type: "income",
  },
  {
    title: "Cota · Montanha Sports",
    category: "Patrocínio",
    date: "02 jul, 14:15",
    value: 4200,
    type: "income",
  },
  {
    title: "Arbitragem · Semifinal 01",
    category: "Arbitragem",
    date: "01 jul, 18:40",
    value: 480,
    type: "expense",
  },
  {
    title: "Locação · Arena da Montanha",
    category: "Locação",
    date: "30 jun, 09:12",
    value: 1200,
    type: "expense",
  },
] as const;

function FinancePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          className="h-8 border-white/[0.07] bg-white/[0.025] px-3 text-[9px]"
        >
          <CalendarRange className="h-3.5 w-3.5" /> Julho de 2026
        </Button>
        <Button
          variant="outline"
          className="h-8 border-white/[0.07] bg-white/[0.025] px-3 text-[9px]"
        >
          <Download className="h-3.5 w-3.5" /> Exportar
        </Button>
        <Button className="h-8 bg-neon px-3 text-[9px] text-neon-foreground hover:bg-neon/90">
          <Plus className="h-3.5 w-3.5" /> Novo lançamento
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ArrowUpRight}
          label="Receitas"
          value="R$ 28.450,00"
          delta="+18,4%"
          tone="green"
        />
        <SummaryCard
          icon={ArrowDownRight}
          label="Despesas"
          value="R$ 12.370,00"
          delta="-4,2%"
          tone="red"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Lucro"
          value="R$ 16.080,00"
          delta="+31,7%"
          tone="amber"
        />
        <SummaryCard
          icon={Scale}
          label="Saldo projetado"
          value="R$ 21.740,00"
          delta="Julho"
          tone="blue"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card-arena p-4">
          <SectionHeader title="Receitas por categoria" action="Detalhes" />
          <div className="mt-5 grid grid-cols-[130px_1fr] items-center gap-5 sm:grid-cols-[170px_1fr]">
            <Donut
              className="bg-[conic-gradient(#4f8df7_0_45%,#2bc28b_45%_80%,#f5bf36_80%_95%,#bdf22e_95%_100%)]"
              label="R$ 28,4 mil"
            />
            <Legend
              items={[
                { label: "Inscrições", value: "45%", color: "bg-[#4f8df7]" },
                { label: "Patrocínios", value: "35%", color: "bg-[#2bc28b]" },
                { label: "Bilheteria", value: "15%", color: "bg-[#f5bf36]" },
                { label: "Outros", value: "5%", color: "bg-neon" },
              ]}
            />
          </div>
        </div>

        <div className="card-arena p-4">
          <SectionHeader title="Despesas por categoria" action="Detalhes" />
          <div className="mt-5 grid grid-cols-[130px_1fr] items-center gap-5 sm:grid-cols-[170px_1fr]">
            <Donut
              className="bg-[conic-gradient(#ef5a65_0_42%,#9c6bf3_42%_72%,#f59a45_72%_91%,#64748b_91%_100%)]"
              label="R$ 12,3 mil"
            />
            <Legend
              items={[
                { label: "Arbitragem", value: "42%", color: "bg-[#ef5a65]" },
                { label: "Estrutura", value: "30%", color: "bg-[#9c6bf3]" },
                { label: "Premiação", value: "19%", color: "bg-[#f59a45]" },
                { label: "Outros", value: "9%", color: "bg-slate-500" },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="card-arena p-4">
          <SectionHeader title="Movimentações recentes" action="Ver todas" />
          <div className="mt-3 divide-y divide-white/[0.055]">
            {TRANSACTIONS.map((transaction) => (
              <div key={transaction.title} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    transaction.type === "income"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-red-400/10 text-red-300",
                  )}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[10px] font-semibold">
                    {transaction.title}
                  </strong>
                  <span className="mt-0.5 block text-[8px] text-muted-foreground">
                    {transaction.category} · {transaction.date}
                  </span>
                </span>
                <strong
                  className={cn(
                    "number-tabular font-display text-xs",
                    transaction.type === "income" ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.value)}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card-arena p-4">
          <SectionHeader title="Pendências" action="Gerenciar" />
          <div className="mt-3 space-y-2">
            <Pending
              icon={CircleDollarSign}
              label="Inscrições pendentes"
              value="4"
              tone="text-amber-300 bg-amber-400/10"
            />
            <Pending
              icon={Banknote}
              label="Arbitragem a pagar"
              value="3"
              tone="text-red-300 bg-red-400/10"
            />
            <Pending
              icon={TrendingUp}
              label="Recebimentos previstos"
              value="7"
              tone="text-sky-300 bg-sky-400/10"
            />
          </div>
          <div className="mt-4 rounded-xl border border-neon/12 bg-neon/[0.035] p-3">
            <div className="flex items-center gap-2 text-neon">
              <CircleDollarSign className="h-4 w-4" />
              <span className="text-[9px] font-semibold">Saúde financeira</span>
            </div>
            <strong className="mt-2 block font-display text-xl font-extrabold">Excelente</strong>
            <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
              56,5% das receitas permanecem disponíveis após as despesas.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
  delta: string;
  tone: "green" | "red" | "amber" | "blue";
}) {
  const colors = {
    green: "bg-emerald-400/10 text-emerald-300",
    red: "bg-red-400/10 text-red-300",
    amber: "bg-amber-400/10 text-amber-300",
    blue: "bg-sky-400/10 text-sky-300",
  };
  return (
    <article className="card-arena card-interactive p-4">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", colors[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={cn("rounded-md px-2 py-1 text-[8px] font-semibold", colors[tone])}>
          {delta}
        </span>
      </div>
      <p className="mt-4 text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <strong className="number-tabular mt-1.5 block font-display text-lg font-extrabold tracking-[-0.035em]">
        {value}
      </strong>
    </article>
  );
}

function Donut({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={cn("relative mx-auto aspect-square w-full max-w-[150px] rounded-full", className)}
    >
      <div className="absolute inset-[18%] grid place-items-center rounded-full bg-card text-center shadow-[0_0_24px_rgba(0,0,0,.45)]">
        <span className="font-display text-[11px] font-extrabold sm:text-xs">{label}</span>
      </div>
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; value: string; color: string }> }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-[9px]">
          <i className={cn("h-2 w-2 rounded-full", item.color)} />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.label}</span>
          <strong className="font-display">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Pending({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3">
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-[9px] text-muted-foreground">{label}</span>
      <strong className="font-display text-lg font-extrabold">{value}</strong>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
