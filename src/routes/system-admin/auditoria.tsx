import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminAuditPage } from "@/features/system-admin/components/SystemAdminAuditPage";

export const Route = createFileRoute("/system-admin/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria · System Admin · IS Arena" }] }),
  component: SystemAdminAuditPage,
});
