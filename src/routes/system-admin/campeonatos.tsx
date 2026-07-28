import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminDirectoryPage } from "@/features/system-admin/components/SystemAdminDirectoryPage";

export const Route = createFileRoute("/system-admin/campeonatos")({
  head: () => ({ meta: [{ title: "Campeonatos · System Admin · IS Arena" }] }),
  component: () => <SystemAdminDirectoryPage kind="championships" />,
});
