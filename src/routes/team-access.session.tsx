import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PublicTeamAccessLayout } from "@/features/team-access/components/PublicTeamAccessLayout";
import { getPublicTeamAccessSession } from "@/features/team-access/api/team-access.functions";
import {
  DEFAULT_TEAM_ACCESS_PERMISSIONS,
  type PublicTeamAccess,
  type TeamAccessState,
} from "@/features/team-access/types/team-access.types";

const stateSchema = z.object({
  state: z
    .enum([
      "blocked",
      "revoked",
      "replaced",
      "expired",
      "invalid",
      "unavailable",
      "access_limit",
      "rate_limited",
    ])
    .catch("invalid")
    .optional(),
});

export const Route = createFileRoute("/team-access/session")({
  validateSearch: stateSchema,
  head: () => ({
    meta: [
      { title: "Acesso seguro · IS Arena" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: TeamAccessSessionPage,
});

function TeamAccessSessionPage() {
  const { state } = Route.useSearch();
  const accessQuery = useQuery({
    queryKey: ["public-team-access-session"],
    queryFn: () => getPublicTeamAccessSession(),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (accessQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando acesso seguro...
      </main>
    );
  }

  const sessionAccess = accessQuery.data;
  const effectiveState: TeamAccessState =
    sessionAccess?.state === "valid" ? "valid" : (state ?? sessionAccess?.state ?? "invalid");
  const access: PublicTeamAccess = sessionAccess
    ? { ...sessionAccess, state: effectiveState }
    : {
        state: effectiveState,
        sessionExpiresAt: null,
        championshipName: null,
        championshipLogoUrl: null,
        teamName: null,
        teamCrestUrl: null,
        expiresAt: null,
        permissions: DEFAULT_TEAM_ACCESS_PERMISSIONS,
      };

  return <PublicTeamAccessLayout access={access} />;
}
