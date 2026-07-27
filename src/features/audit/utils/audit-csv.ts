import type { AuditExportItem } from "../api/audit";

export function auditLogsToCsv(items: AuditExportItem[]) {
  const rows = [
    ["Data", "Ator", "Módulo", "Recurso", "ID do recurso", "Ação", "Contexto"],
    ...items.map((item) => [
      item.created_at,
      item.actor_name,
      item.module,
      item.entity_type,
      item.entity_id ?? "",
      item.action,
      JSON.stringify(item.context ?? {}),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n");
}

function escapeCsvCell(value: unknown) {
  const text = String(value);
  const formulaSafeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${formulaSafeText.replaceAll('"', '""')}"`;
}
