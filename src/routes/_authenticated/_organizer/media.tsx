import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_organizer/media")({
  beforeLoad: () => {
    throw redirect({ to: "/championships" });
  },
});
