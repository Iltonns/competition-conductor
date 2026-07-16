import { TeamPeoplePage } from "@/features/team-staff/components/TeamPeoplePage";

export function TeamResponsiblesPage({
  championshipId,
  teamId,
}: {
  championshipId: string;
  teamId: string;
}) {
  return <TeamPeoplePage championshipId={championshipId} teamId={teamId} kind="responsibles" />;
}
