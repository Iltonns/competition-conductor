import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveChampionship,
  deleteChampionshipPermanently,
  getChampionshipOperationalSettings,
  saveChampionshipOperationalSettings,
  type SaveChampionshipSettingsInput,
} from "../api/championship-settings";

const settingsKey = (championshipId: string) => ["championship-settings", championshipId] as const;

export function useChampionshipSettings(championshipId: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: settingsKey(championshipId) }),
      queryClient.invalidateQueries({ queryKey: ["championships"] }),
    ]);
  };

  const query = useQuery({
    queryKey: settingsKey(championshipId),
    queryFn: () => getChampionshipOperationalSettings(championshipId),
  });

  return {
    ...query,
    save: useMutation({
      mutationFn: (input: SaveChampionshipSettingsInput) =>
        saveChampionshipOperationalSettings(championshipId, input),
      onSuccess: invalidate,
    }),
    archive: useMutation({
      mutationFn: ({ confirmation, reason }: { confirmation: string; reason: string }) =>
        archiveChampionship(championshipId, confirmation, reason),
      onSuccess: invalidate,
    }),
    permanentlyDelete: useMutation({
      mutationFn: ({ confirmation, reason }: { confirmation: string; reason: string }) =>
        deleteChampionshipPermanently(championshipId, confirmation, reason),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["championships"] });
      },
    }),
  };
}
