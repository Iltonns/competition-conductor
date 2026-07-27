import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSettingsPage } from "@/features/organization-settings/components/OrganizationSettingsPage";

export const Route = createFileRoute("/_authenticated/_organizer/settings/organization")({
  component: () => <OrganizationSettingsPage view="organization" />,
});
