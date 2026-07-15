import { useQuery } from "@tanstack/react-query";
import {
  championshipKeys,
  getChampionship,
  getChampionshipOverview,
} from "../services/championship.service";
import type { Championship } from "../types/championship.types";

export function useChampionship(championshipId: string) {
  return useQuery({
    queryKey: championshipKeys.detail(championshipId),
    queryFn: () => getChampionship(championshipId),
    enabled: Boolean(championshipId),
    retry: false,
  });
}

export function useChampionshipOverview(championship?: Championship) {
  return useQuery({
    queryKey: championshipKeys.overview(championship?.id ?? "pending"),
    queryFn: () => getChampionshipOverview(championship!.organization_id, championship!.id),
    enabled: Boolean(championship),
  });
}
