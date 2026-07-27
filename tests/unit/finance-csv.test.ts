import { describe, expect, it } from "vitest";
import type { FinancialTransaction } from "@/features/finance/api/finance";
import { financeTransactionsToCsv } from "@/features/finance/utils/finance-csv";

const transaction: FinancialTransaction = {
  id: "transaction-1",
  organization_id: "organization-1",
  championship_id: "championship-1",
  transaction_type: "income",
  category: "Patrocínio",
  description: 'Cota "Ouro"',
  competence_date: "2026-07-01",
  due_date: "2026-07-10",
  paid_at: null,
  amount: 1250.5,
  status: "pending",
  counterparty: "Empresa Exemplo",
  notes: "Primeira parcela",
  cancelled_at: null,
  cancellation_reason: null,
  created_at: "2026-07-01T12:00:00Z",
  updated_at: "2026-07-01T12:00:00Z",
  attachments: [],
};

describe("financeTransactionsToCsv", () => {
  it("exports a semicolon-delimited row with fixed decimal precision", () => {
    const csv = financeTransactionsToCsv([transaction]);

    expect(csv).toContain('"Receita";"Patrocínio";"Cota ""Ouro"""');
    expect(csv).toContain('"1250.50";"pending"');
  });

  it("exports only the header when the filtered result is empty", () => {
    const csv = financeTransactionsToCsv([]);

    expect(csv.split("\r\n")).toHaveLength(1);
    expect(csv).toContain('"Favorecido/Pagador"');
  });
});
