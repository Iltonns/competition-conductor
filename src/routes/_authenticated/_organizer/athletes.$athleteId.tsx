import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GlobalAthleteDetailPage } from "@/features/global-directory/components/GlobalDirectoryPages";

const searchSchema = z.object({ organizationId: z.string().uuid() });

export const Route = createFileRoute("/_authenticated/_organizer/athletes/$athleteId")({
  validateSearch: searchSchema,
  component: Page,
});

function Page() {
  const { athleteId } = Route.useParams();
  const { organizationId } = Route.useSearch();
  return <GlobalAthleteDetailPage athleteId={athleteId} organizationId={organizationId} />;
}
