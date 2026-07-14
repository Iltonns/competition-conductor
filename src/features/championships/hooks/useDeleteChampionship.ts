import { useMutation, useQueryClient } from "@tanstack/react-query";
import { championshipKeys, deleteChampionship } from "../services/championship.service";
import type { DeleteChampionshipVariables } from "../types/championship.types";

export function useDeleteChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, championshipId }: DeleteChampionshipVariables) =>
      deleteChampionship(organizationId, championshipId),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: championshipKeys.list(variables.organizationId),
      }),
  });
}
