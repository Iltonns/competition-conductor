import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminOperationsPage } from "@/features/system-admin/components/SystemAdminOperationsPage";

export const Route = createFileRoute("/system-admin/configuracoes")({
  head: () => ({ meta: [{ title: "Operação · System Admin · IS Arena" }] }),
  component: SystemAdminOperationsPage,
});
