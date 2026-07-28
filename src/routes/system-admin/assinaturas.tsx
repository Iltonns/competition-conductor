import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminDirectoryPage } from "@/features/system-admin/components/SystemAdminDirectoryPage";

export const Route = createFileRoute("/system-admin/assinaturas")({
  head: () => ({ meta: [{ title: "Assinaturas · System Admin · IS Arena" }] }),
  component: () => <SystemAdminDirectoryPage kind="subscriptions" />,
});
