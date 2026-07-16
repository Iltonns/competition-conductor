import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRosterAthlete, listRoster, registerAthlete } from "../api/athletes";
import type { AthleteInput } from "../types/athlete.types";

const key = (championshipId: string, teamId: string) => ["roster", championshipId, teamId] as const;
export function useRoster(championshipId: string, teamId: string) {
  return useQuery({
    queryKey: key(championshipId, teamId),
    queryFn: () => listRoster(championshipId, teamId),
  });
}
export function useRosterAthlete(championshipId: string, teamId: string, athleteId: string) {
  return useQuery({
    queryKey: [...key(championshipId, teamId), athleteId],
    queryFn: () => getRosterAthlete(championshipId, teamId, athleteId),
  });
}
export function useRegisterAthlete(championshipId: string, teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AthleteInput) => registerAthlete(championshipId, teamId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: key(championshipId, teamId) }),
  });
}
