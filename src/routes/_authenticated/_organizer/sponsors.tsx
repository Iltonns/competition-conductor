import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_organizer/sponsors")({
  beforeLoad: () => {
    throw redirect({ to: "/championships" });
  },
});
