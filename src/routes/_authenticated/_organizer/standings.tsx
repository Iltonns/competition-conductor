import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/_organizer/standings")({
  component: () => <Navigate to="/championships" replace />,
});
