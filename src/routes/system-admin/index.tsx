import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminDashboard } from "@/features/system-admin/components/SystemAdminDashboard";

export const Route = createFileRoute("/system-admin/")({
  head: () => ({ meta: [{ title: "Administração do sistema · IS Arena" }] }),
  component: SystemAdminDashboard,
});
