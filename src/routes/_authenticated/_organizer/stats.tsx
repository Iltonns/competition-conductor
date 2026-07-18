import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/_organizer/stats")({
  component: () => <Navigate to="/championships" replace />,
});
