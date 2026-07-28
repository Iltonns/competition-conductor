import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminSupportPage } from "@/features/system-admin/components/SystemAdminSupportPage";

export const Route = createFileRoute("/system-admin/suporte")({
  head: () => ({ meta: [{ title: "Modo suporte · System Admin · IS Arena" }] }),
  component: SystemAdminSupportPage,
});
