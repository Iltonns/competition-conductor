import { Link } from "@tanstack/react-router";
import { MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TeamInChampionship } from "../types/team.types";

export function TeamCard({
  championshipId,
  item,
}: {
  championshipId: string;
  item: TeamInChampionship;
}) {
  const archived = item.registration.status === "archived";
  return (
    <Link
      to="/championships/$id/teams/$teamId"
      params={{ id: championshipId, teamId: item.team.id }}
      className="card-arena group block p-4 transition hover:border-neon/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon"
    >
      <div className="flex items-start gap-3">
        {item.team.crest_url ? (
          <img
            src={item.team.crest_url}
            alt={`Escudo de ${item.team.name}`}
            className="h-12 w-12 rounded-xl object-cover"
          />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-neon/10 text-neon">
            <Shield className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-display text-sm font-bold group-hover:text-neon">
              {item.team.name}
            </h2>
            <Badge variant={archived ? "outline" : "secondary"}>
              {archived ? "Arquivada" : "Ativa"}
            </Badge>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {item.team.abbreviation || item.team.short_name || "Sem sigla"}
          </p>
          <p className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[item.team.city, item.team.state].filter(Boolean).join(" · ") || "Local não informado"}
          </p>
        </div>
      </div>
    </Link>
  );
}
