import { createFileRoute } from "@tanstack/react-router";
import { SponsorsPublishingPage } from "@/features/publishing/components/SponsorsPublishingPage";

export const Route = createFileRoute("/_authenticated/championships_/$id/sponsors")({
  head: () => ({ meta: [{ title: "Patrocinadores · IS Arena" }] }),
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <SponsorsPublishingPage championshipId={id} />;
}
