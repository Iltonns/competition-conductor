import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_organizer/settings/")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/organization" });
  },
});
