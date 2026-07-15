import { Link } from "@tanstack/react-router";
import { CalendarDays, Globe2, Lock, Pencil, Settings, Trophy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Championship } from "../types/championship.types";
import {
  CHAMPIONSHIP_STATUS_LABELS,
  formatChampionshipDate,
  formatChampionshipDateTime,
} from "../utils/championship-display";

interface ChampionshipCardProps {
  championship: Championship;
  onEdit: () => void;
  onDelete: () => void;
}

export function ChampionshipCard({ championship, onEdit, onDelete }: ChampionshipCardProps) {
  return (
    <article className="card-arena overflow-hidden">
      <div className="relative h-28 bg-gradient-to-br from-neon/15 via-sky-400/5 to-violet-400/10">
        {championship.cover_url ? (
          <img
            src={championship.cover_url}
            alt={`Capa de ${championship.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Trophy
            className="absolute bottom-4 right-4 h-14 w-14 text-white/10"
            aria-hidden="true"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary">{CHAMPIONSHIP_STATUS_LABELS[championship.status]}</Badge>
          <Badge variant="outline" className="gap-1 bg-black/30 backdrop-blur">
            {championship.is_public ? <Globe2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {championship.is_public ? "Público" : "Privado"}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neon">
          {championship.season || "Temporada não informada"}
        </p>
        <h3 className="mt-1 truncate font-display text-sm font-bold">{championship.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-8 text-[10px] leading-4 text-muted-foreground">
          {championship.description || "Sem descrição."}
        </p>

        <dl className="mt-3 space-y-1.5 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <dt className="sr-only">Período</dt>
            <dd>
              {formatChampionshipDate(championship.starts_at)} —{" "}
              {formatChampionshipDate(championship.ends_at)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Criado em</dt>
            <dd>{formatChampionshipDateTime(championship.created_at)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-white/[0.06] pt-3">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/championships/$id" params={{ id: championship.id }}>
              <Settings className="h-3.5 w-3.5" /> Configurar
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </article>
  );
}
