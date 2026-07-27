import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSettingsPage } from "@/features/organization-settings/components/OrganizationSettingsPage";

export const Route = createFileRoute("/_authenticated/_organizer/settings/users")({
  component: () => <OrganizationSettingsPage view="users" />,
});
