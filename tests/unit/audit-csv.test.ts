import { describe, expect, it } from "vitest";
import type { AuditExportItem } from "@/features/audit/api/audit";
import { auditLogsToCsv } from "@/features/audit/utils/audit-csv";

const log: AuditExportItem = {
  id: "audit-1",
  actor_id: "user-1",
  actor_name: 'Gestor "Principal"',
  module: "finance",
  entity_type: "financial_transaction",
  entity_id: "transaction-1",
  action: "settled",
  context: { reason: "Pagamento confirmado" },
  created_at: "2026-07-27T18:00:00Z",
};

describe("auditLogsToCsv", () => {
  it("escapes quotes and serializes safe context", () => {
    const csv = auditLogsToCsv([log]);

    expect(csv).toContain('"Gestor ""Principal"""');
    expect(csv).toContain('"{""reason"":""Pagamento confirmado""}"');
  });

  it("returns only the header for an empty export", () => {
    expect(auditLogsToCsv([]).split("\r\n")).toHaveLength(1);
  });

  it("neutralizes spreadsheet formulas in user-controlled fields", () => {
    const csv = auditLogsToCsv([
      {
        ...log,
        actor_name: '=HYPERLINK("https://invalid.example";"click")',
      },
    ]);

    expect(csv).toContain(`"'=HYPERLINK(""https://invalid.example"";""click"")"`);
  });
});
