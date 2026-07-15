import { useMemo, useState, type ReactNode } from "react";
import { useCurrentOrganizationId } from "../hooks/useChampionships";
import type { Championship } from "../types/championship.types";
import { ChampionshipContext } from "./championship-context-value";

export function ChampionshipProvider({ children }: { children: ReactNode }) {
  const organization = useCurrentOrganizationId();
  const [activeChampionship, setActiveChampionship] = useState<Championship | null>(null);
  const value = useMemo(
    () => ({
      organizationId: organization.data ?? null,
      activeChampionship,
      setActiveChampionship,
    }),
    [activeChampionship, organization.data],
  );

  return <ChampionshipContext.Provider value={value}>{children}</ChampionshipContext.Provider>;
}
