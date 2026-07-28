import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GlobalTeamDetailPage } from "@/features/global-directory/components/GlobalDirectoryPages";

const searchSchema = z.object({ organizationId: z.string().uuid() });

export const Route = createFileRoute("/_authenticated/_organizer/teams/$teamId")({
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { teamId } = Route.useParams();
  const { organizationId } = Route.useSearch();
  return <GlobalTeamDetailPage teamId={teamId} organizationId={organizationId} />;
}
