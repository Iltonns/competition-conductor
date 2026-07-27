import type { FinancialTransaction } from "../api/finance";

export function financeTransactionsToCsv(transactions: FinancialTransaction[]) {
  const rows = [
    [
      "Tipo",
      "Categoria",
      "Descrição",
      "Competência",
      "Vencimento",
      "Pagamento",
      "Valor",
      "Status",
      "Favorecido/Pagador",
      "Observação",
    ],
    ...transactions.map((transaction) => [
      transaction.transaction_type === "income" ? "Receita" : "Despesa",
      transaction.category,
      transaction.description,
      transaction.competence_date,
      transaction.due_date ?? "",
      transaction.paid_at ?? "",
      transaction.amount.toFixed(2),
      transaction.status,
      transaction.counterparty ?? "",
      transaction.notes ?? "",
    ]),
  ];
  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
}
