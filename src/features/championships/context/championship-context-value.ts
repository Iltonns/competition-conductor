import { createContext } from "react";
import type { Championship } from "../types/championship.types";

export interface ChampionshipContextValue {
  organizationId: string | null;
  activeChampionship: Championship | null;
  setActiveChampionship: (championship: Championship | null) => void;
}

export const ChampionshipContext = createContext<ChampionshipContextValue | null>(null);
