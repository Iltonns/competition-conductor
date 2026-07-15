import { useMutation, useQueryClient } from "@tanstack/react-query";
import { championshipKeys, createChampionship } from "../services/championship.service";

export function useCreateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChampionship,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: championshipKeys.all,
      }),
  });
}
