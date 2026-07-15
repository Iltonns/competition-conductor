import { useContext } from "react";
import { ChampionshipContext, type ChampionshipContextValue } from "./championship-context-value";

export function useChampionshipContext(): ChampionshipContextValue {
  const context = useContext(ChampionshipContext);
  if (!context)
    throw new Error("useChampionshipContext deve ser usado dentro de ChampionshipProvider.");
  return context;
}
