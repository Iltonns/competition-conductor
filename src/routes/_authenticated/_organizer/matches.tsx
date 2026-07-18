import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_organizer/matches")({
  component: () => <Navigate to="/championships" replace />,
});
