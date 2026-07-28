import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminDirectoryPage } from "@/features/system-admin/components/SystemAdminDirectoryPage";

export const Route = createFileRoute("/system-admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários · System Admin · IS Arena" }] }),
  component: () => <SystemAdminDirectoryPage kind="users" />,
});
