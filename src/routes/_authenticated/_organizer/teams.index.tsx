import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GlobalTeamsPage } from "@/features/global-directory/components/GlobalDirectoryPages";

const searchSchema = z.object({ organizationId: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/_organizer/teams/")({
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { organizationId } = Route.useSearch();
  return <GlobalTeamsPage initialOrganizationId={organizationId} />;
}
