import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/championships_/$id/teams/$teamId")({
  component: Outlet,
});
