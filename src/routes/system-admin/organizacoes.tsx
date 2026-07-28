import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminDirectoryPage } from "@/features/system-admin/components/SystemAdminDirectoryPage";

export const Route = createFileRoute("/system-admin/organizacoes")({
  head: () => ({ meta: [{ title: "Organizações · System Admin · IS Arena" }] }),
  component: () => <SystemAdminDirectoryPage kind="organizations" />,
});
