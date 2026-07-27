import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_organizer/finance")({
  beforeLoad: () => {
    throw redirect({ to: "/championships" });
  },
});
