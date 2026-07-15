import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/championships_/$id/teams")({
  head: () => ({ meta: [{ title: "Equipes do campeonato · IS Arena" }] }),
  component: Outlet,
});
