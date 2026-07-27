import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Championship } from "@/features/championships/types/championship.types";
import {
  type FinanceFilters,
  type FinanceSummary,
  type FinancialTransaction,
  type FinancialTransactionPayload,
} from "../api/finance";
import { useFinance } from "../hooks/useFinance";
import { financeTransactionsToCsv } from "../utils/finance-csv";

const emptyFilters: FinanceFilters = {
  dateFrom: "",
  dateTo: "",
  status: "",
  transactionType: "",
  category: "",
};

const emptyPayload = (): FinancialTransactionPayload => ({
  transaction_type: "income",
  category: "",
  description: "",
  competence_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  amount: 0,
  counterparty: "",
  notes: "",
});

export function ChampionshipFinancePage({ championship }: { championship: Championship }) {
  const [filters, setFilters] = useState<FinanceFilters>(emptyFilters);
  const finance = useFinance(championship.organization_id, championship.id, filters);
  const [editing, setEditing] = useState<FinancialTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (transaction: FinancialTransaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const exportCsv = () => {
    const csv = financeTransactionsToCsv(finance.data?.transactions ?? []);
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `financeiro-${championship.slug || championship.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neon">Gestão e governança</p>
          <h2 className="font-display text-xl font-extrabold">Financeiro</h2>
          <p className="text-xs text-muted-foreground">
            Receitas, despesas, vencimentos e comprovantes de {championship.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!finance.data?.transactions.length}
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo lançamento
          </Button>
        </div>
      </header>

      <FinanceFiltersPanel
        filters={filters}
        categories={finance.data?.categories ?? []}
        onChange={setFilters}
      />

      {finance.isLoading && <FinanceSkeleton />}
      {finance.error && (
        <section className="card-arena p-6 text-center" role="alert">
          <p className="text-sm font-semibold">Não foi possível carregar o financeiro.</p>
          <p className="mt-1 text-xs text-muted-foreground">{finance.error.message}</p>
          <Button className="mt-3" variant="outline" onClick={() => finance.refetch()}>
            Tentar novamente
          </Button>
        </section>
      )}

      {finance.data && (
        <>
          <SummaryCards summary={finance.data.summary} />
          <TransactionsTable
            transactions={finance.data.transactions}
            pending={
              finance.settle.isPending ||
              finance.reverse.isPending ||
              finance.cancel.isPending ||
              finance.uploadAttachment.isPending ||
              finance.removeAttachment.isPending
            }
            onEdit={openEdit}
            onSettle={async (transaction) => {
              try {
                await finance.settle.mutateAsync({
                  transactionId: transaction.id,
                  paidAt: new Date().toISOString(),
                });
                toast.success("Baixa registrada e auditada.");
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            onReverse={async (transaction) => {
              const reason = window.prompt("Informe o motivo do estorno (mínimo 10 caracteres):");
              if (!reason) return;
              try {
                await finance.reverse.mutateAsync({ transactionId: transaction.id, reason });
                toast.success("Baixa estornada e histórico preservado.");
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            onCancel={async (transaction) => {
              const reason = window.prompt(
                "Informe o motivo do cancelamento (mínimo 10 caracteres):",
              );
              if (!reason) return;
              try {
                await finance.cancel.mutateAsync({ transactionId: transaction.id, reason });
                toast.success("Lançamento cancelado e auditado.");
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            onUpload={async (transaction, file) => {
              try {
                await finance.uploadAttachment.mutateAsync({
                  transactionId: transaction.id,
                  file,
                });
                toast.success("Comprovante anexado.");
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
            onRemoveAttachment={async (attachmentId) => {
              if (!window.confirm("Remover este comprovante? A ação será auditada.")) return;
              try {
                await finance.removeAttachment.mutateAsync(attachmentId);
                toast.success("Comprovante removido.");
              } catch (error) {
                toast.error(getErrorMessage(error));
              }
            }}
          />
        </>
      )}

      <TransactionDialog
        open={formOpen}
        transaction={editing}
        categories={finance.data?.categories ?? []}
        pending={finance.save.isPending}
        onOpenChange={setFormOpen}
        onSave={async (payload) => {
          try {
            await finance.save.mutateAsync({ transactionId: editing?.id ?? null, payload });
            toast.success(editing ? "Lançamento atualizado." : "Lançamento criado.");
            setFormOpen(false);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />
    </div>
  );
}

function FinanceFiltersPanel({
  filters,
  categories,
  onChange,
}: {
  filters: FinanceFilters;
  categories: string[];
  onChange: (filters: FinanceFilters) => void;
}) {
  const update = <K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) =>
    onChange({ ...filters, [key]: value });
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <section className="card-arena grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-6">
      <Input
        aria-label="Competência inicial"
        type="date"
        value={filters.dateFrom}
        onChange={(event) => update("dateFrom", event.target.value)}
      />
      <Input
        aria-label="Competência final"
        type="date"
        value={filters.dateTo}
        onChange={(event) => update("dateTo", event.target.value)}
      />
      <select
        aria-label="Tipo"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.transactionType}
        onChange={(event) =>
          update("transactionType", event.target.value as FinanceFilters["transactionType"])
        }
      >
        <option value="">Todos os tipos</option>
        <option value="income">Receitas</option>
        <option value="expense">Despesas</option>
      </select>
      <select
        aria-label="Status"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.status}
        onChange={(event) => update("status", event.target.value as FinanceFilters["status"])}
      >
        <option value="">Todos os status</option>
        <option value="pending">Pendente</option>
        <option value="overdue">Vencido</option>
        <option value="paid">Pago</option>
        <option value="cancelled">Cancelado</option>
      </select>
      <select
        aria-label="Categoria"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.category}
        onChange={(event) => update("category", event.target.value)}
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <Button variant="ghost" disabled={!hasFilters} onClick={() => onChange(emptyFilters)}>
        Limpar filtros
      </Button>
    </section>
  );
}

function SummaryCards({ summary }: { summary: FinanceSummary }) {
  const items = [
    {
      label: "Receitas realizadas",
      value: summary.realized_income,
      icon: ArrowUpRight,
      tone: "text-emerald-300 bg-emerald-400/10",
    },
    {
      label: "Despesas realizadas",
      value: summary.realized_expense,
      icon: ArrowDownRight,
      tone: "text-red-300 bg-red-400/10",
    },
    {
      label: "Saldo realizado",
      value: summary.realized_balance,
      icon: WalletCards,
      tone: "text-sky-300 bg-sky-400/10",
    },
    {
      label: "Saldo projetado",
      value: summary.projected_balance,
      icon: CalendarClock,
      tone: "text-neon bg-neon/10",
    },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <article key={label} className="card-arena p-4">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <strong className="number-tabular mt-1 block font-display text-lg font-extrabold">
            {formatCurrency(value)}
          </strong>
        </article>
      ))}
    </section>
  );
}

function TransactionsTable({
  transactions,
  pending,
  onEdit,
  onSettle,
  onReverse,
  onCancel,
  onUpload,
  onRemoveAttachment,
}: {
  transactions: FinancialTransaction[];
  pending: boolean;
  onEdit: (transaction: FinancialTransaction) => void;
  onSettle: (transaction: FinancialTransaction) => void;
  onReverse: (transaction: FinancialTransaction) => void;
  onCancel: (transaction: FinancialTransaction) => void;
  onUpload: (transaction: FinancialTransaction, file: File) => void;
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  if (!transactions.length) {
    return (
      <section className="card-arena p-8 text-center">
        <WalletCards className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-display text-sm font-bold">Nenhum lançamento encontrado</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajuste os filtros ou registre a primeira movimentação financeira.
        </p>
      </section>
    );
  }
  return (
    <section className="card-arena overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead className="border-b border-white/[0.06] bg-black/15 text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Lançamento</th>
              <th className="px-3 py-3">Competência</th>
              <th className="px-3 py-3">Vencimento</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.055]">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        transaction.transaction_type === "income"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-red-400/10 text-red-300"
                      }`}
                    >
                      {transaction.transaction_type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <strong className="block max-w-[260px] truncate">
                        {transaction.description}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        {transaction.category}
                        {transaction.counterparty ? ` · ${transaction.counterparty}` : ""}
                      </span>
                      {!!transaction.attachments.length && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {transaction.attachments.map((attachment) => (
                            <span
                              key={attachment.id}
                              className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-1 text-[9px]"
                            >
                              <FileText className="h-3 w-3" />
                              {attachment.signed_url ? (
                                <a
                                  className="max-w-28 truncate hover:text-neon"
                                  href={attachment.signed_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {attachment.file_name}
                                </a>
                              ) : (
                                <span className="max-w-28 truncate">{attachment.file_name}</span>
                              )}
                              <button
                                type="button"
                                aria-label={`Remover ${attachment.file_name}`}
                                disabled={pending}
                                onClick={() => onRemoveAttachment(attachment.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-300" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{formatDate(transaction.competence_date)}</td>
                <td className="px-3 py-3">{formatDate(transaction.due_date)}</td>
                <td className="px-3 py-3">
                  <TransactionStatusBadge transaction={transaction} />
                </td>
                <td
                  className={`number-tabular px-3 py-3 text-right font-semibold ${
                    transaction.transaction_type === "income" ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {transaction.transaction_type === "income" ? "+" : "-"}{" "}
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {transaction.status === "pending" && (
                      <>
                        <ActionButton
                          label="Editar"
                          icon={Pencil}
                          pending={pending}
                          onClick={() => onEdit(transaction)}
                        />
                        <ActionButton
                          label="Baixar"
                          icon={Check}
                          pending={pending}
                          onClick={() => onSettle(transaction)}
                        />
                        <ActionButton
                          label="Cancelar"
                          icon={Trash2}
                          pending={pending}
                          onClick={() => onCancel(transaction)}
                        />
                      </>
                    )}
                    {transaction.status === "paid" && (
                      <ActionButton
                        label="Estornar"
                        icon={RotateCcw}
                        pending={pending}
                        onClick={() => onReverse(transaction)}
                      />
                    )}
                    {transaction.status !== "cancelled" && (
                      <label
                        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-[9px] hover:bg-white/[0.05]"
                        title="Anexar comprovante"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="sr-only">Anexar comprovante</span>
                        <input
                          className="sr-only"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          disabled={pending}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onUpload(transaction, file);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TransactionDialog({
  open,
  transaction,
  categories,
  pending,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  transaction: FinancialTransaction | null;
  categories: string[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: FinancialTransactionPayload) => void;
}) {
  const initialValue = useMemo<FinancialTransactionPayload>(
    () =>
      transaction
        ? {
            transaction_type: transaction.transaction_type,
            category: transaction.category,
            description: transaction.description,
            competence_date: transaction.competence_date,
            due_date: transaction.due_date ?? "",
            amount: transaction.amount,
            counterparty: transaction.counterparty ?? "",
            notes: transaction.notes ?? "",
          }
        : emptyPayload(),
    [transaction],
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            Lançamentos pagos ficam bloqueados; use o estorno auditado antes de corrigir.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <TransactionForm
            key={transaction?.id ?? "new"}
            initialValue={initialValue}
            categories={categories}
            pending={pending}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  initialValue,
  categories,
  pending,
  onCancel,
  onSave,
}: {
  initialValue: FinancialTransactionPayload;
  categories: string[];
  pending: boolean;
  onCancel: () => void;
  onSave: (payload: FinancialTransactionPayload) => void;
}) {
  const [payload, setPayload] = useState(initialValue);
  const update = <K extends keyof FinancialTransactionPayload>(
    key: K,
    value: FinancialTransactionPayload[K],
  ) => setPayload((current) => ({ ...current, [key]: value }));
  const valid =
    payload.category.trim().length >= 2 &&
    payload.description.trim().length >= 3 &&
    payload.competence_date &&
    payload.amount > 0;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Tipo</Label>
          <select
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={payload.transaction_type}
            onChange={(event) =>
              update(
                "transaction_type",
                event.target.value as FinancialTransactionPayload["transaction_type"],
              )
            }
          >
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div>
          <Label>Categoria</Label>
          <Input
            className="mt-1"
            list="finance-categories"
            maxLength={80}
            value={payload.category}
            onChange={(event) => update("category", event.target.value)}
          />
          <datalist id="finance-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Input
            className="mt-1"
            maxLength={240}
            value={payload.description}
            onChange={(event) => update("description", event.target.value)}
          />
        </div>
        <div>
          <Label>Competência</Label>
          <Input
            className="mt-1"
            type="date"
            value={payload.competence_date}
            onChange={(event) => update("competence_date", event.target.value)}
          />
        </div>
        <div>
          <Label>Vencimento</Label>
          <Input
            className="mt-1"
            type="date"
            value={payload.due_date}
            onChange={(event) => update("due_date", event.target.value)}
          />
        </div>
        <div>
          <Label>Valor</Label>
          <Input
            className="mt-1"
            type="number"
            min="0.01"
            max="999999999999.99"
            step="0.01"
            value={payload.amount || ""}
            onChange={(event) => update("amount", Number(event.target.value))}
          />
        </div>
        <div>
          <Label>Favorecido/Pagador</Label>
          <Input
            className="mt-1"
            value={payload.counterparty}
            onChange={(event) => update("counterparty", event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Observação</Label>
          <Textarea
            className="mt-1"
            value={payload.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid || pending} onClick={() => onSave(payload)}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}

function TransactionStatusBadge({ transaction }: { transaction: FinancialTransaction }) {
  const overdue =
    transaction.status === "pending" &&
    !!transaction.due_date &&
    transaction.due_date < new Date().toISOString().slice(0, 10);
  if (overdue) return <Badge variant="destructive">Vencido</Badge>;
  const labels = { pending: "Pendente", paid: "Pago", cancelled: "Cancelado" };
  return (
    <Badge variant={transaction.status === "paid" ? "secondary" : "outline"}>
      {labels[transaction.status]}
    </Badge>
  );
}

function ActionButton({
  label,
  icon: Icon,
  pending,
  onClick,
}: {
  label: string;
  icon: typeof Check;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      title={label}
      disabled={pending}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

function FinanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível concluir a operação.";
  const messages: Record<string, string> = {
    "finance:forbidden": "Seu papel não permite acessar o financeiro.",
    "finance:invalid_payload": "Revise os dados do lançamento.",
    "finance:transaction_locked": "Somente lançamentos pendentes podem ser alterados.",
    "finance:reversal_reason_required": "Informe um motivo com pelo menos 10 caracteres.",
    "finance:cancellation_reason_required": "Informe um motivo com pelo menos 10 caracteres.",
  };
  const match = Object.keys(messages).find((code) => error.message.includes(code));
  return match ? messages[match] : error.message;
}
