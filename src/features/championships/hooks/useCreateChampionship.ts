import { useMutation, useQueryClient } from "@tanstack/react-query";
import { championshipKeys, createChampionship } from "../services/championship.service";

export function useCreateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChampionship,
    onSuccess: (championship) =>
      queryClient.invalidateQueries({
        queryKey: championshipKeys.list(championship.organization_id),
      }),
  });
}
