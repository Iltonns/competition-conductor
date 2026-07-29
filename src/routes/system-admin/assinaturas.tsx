import { createFileRoute } from "@tanstack/react-router";
import { SystemAdminPlanCatalog } from "@/features/system-admin/components/SystemAdminPlanCatalog";
import { SystemAdminDirectoryPage } from "@/features/system-admin/components/SystemAdminDirectoryPage";

export const Route = createFileRoute("/system-admin/assinaturas")({
  head: () => ({ meta: [{ title: "Assinaturas · System Admin · IS Arena" }] }),
  component: () => (
    <div className="space-y-8">
      <SystemAdminPlanCatalog />
      <SystemAdminDirectoryPage kind="subscriptions" />
    </div>
  ),
});
