import { useMutation, useQueryClient } from "@tanstack/react-query";
import { championshipKeys, updateChampionship } from "../services/championship.service";
import type { UpdateChampionshipVariables } from "../types/championship.types";

export function useUpdateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organizationId, championshipId, changes }: UpdateChampionshipVariables) =>
      updateChampionship(organizationId, championshipId, changes),
    onSuccess: (championship) =>
      queryClient.invalidateQueries({
        queryKey: championshipKeys.organization(championship.organization_id),
      }),
  });
}
