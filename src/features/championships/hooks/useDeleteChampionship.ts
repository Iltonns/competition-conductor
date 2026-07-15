import { useMutation, useQueryClient } from "@tanstack/react-query";
import { championshipKeys, deleteChampionship } from "../services/championship.service";
import type { DeleteChampionshipVariables } from "../types/championship.types";

export function useDeleteChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ championshipId }: DeleteChampionshipVariables) =>
      deleteChampionship(championshipId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: championshipKeys.all,
      }),
  });
}
