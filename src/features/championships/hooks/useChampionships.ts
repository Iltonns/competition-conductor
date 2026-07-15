import { useQuery } from "@tanstack/react-query";
import { championshipKeys, listChampionships } from "../services/championship.service";

export function useChampionships() {
  return useQuery({ queryKey: championshipKeys.list(), queryFn: listChampionships });
}
