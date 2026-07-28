import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GlobalAthletesPage } from "@/features/global-directory/components/GlobalDirectoryPages";

const searchSchema = z.object({ organizationId: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/_organizer/athletes/")({
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { organizationId } = Route.useSearch();
  return <GlobalAthletesPage initialOrganizationId={organizationId} />;
}
