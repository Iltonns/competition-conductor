import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/teams")({
  component: () => <ComingSoon title="Teams" />,
});
