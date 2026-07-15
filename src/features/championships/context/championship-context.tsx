import { useMemo, useState, type ReactNode } from "react";
import type { Championship } from "../types/championship.types";
import { ChampionshipContext } from "./championship-context-value";

export function ChampionshipProvider({ children }: { children: ReactNode }) {
  const [activeChampionship, setActiveChampionship] = useState<Championship | null>(null);
  const value = useMemo(
    () => ({
      organizationId: activeChampionship?.organization_id ?? null,
      activeChampionship,
      setActiveChampionship,
    }),
    [activeChampionship],
  );

  return <ChampionshipContext.Provider value={value}>{children}</ChampionshipContext.Provider>;
}
