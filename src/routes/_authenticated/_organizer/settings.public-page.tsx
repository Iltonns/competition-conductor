import { createFileRoute } from "@tanstack/react-router";
import { OrganizationPublicPageSettings } from "@/features/organization-public-page/components/OrganizationPublicPageSettings";

export const Route = createFileRoute("/_authenticated/_organizer/settings/public-page")({
  head: () => ({ meta: [{ title: "Página pública · IS Arena" }] }),
  component: OrganizationPublicPageSettings,
});
