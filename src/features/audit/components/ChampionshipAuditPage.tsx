import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
  FilterX,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Championship } from "@/features/championships/types/championship.types";
import type { Json } from "@/integrations/supabase/types";
import { type AuditFilters, type AuditLogItem } from "../api/audit";
import { useAuditLogs } from "../hooks/useAuditLogs";
import { auditLogsToCsv } from "../utils/audit-csv";

const pageSize = 25;
const emptyFilters: AuditFilters = {
  actorId: "",
  action: "",
  module: "",
  entityType: "",
  entityId: "",
  dateFrom: "",
  dateTo: "",
};

const moduleLabels: Record<string, string> = {
  competition: "Competição",
  sports: "Operação esportiva",
  publishing: "Publicação",
  finance: "Financeiro",
  registry: "Cadastros",
  other: "Outros",
};

export function ChampionshipAuditPage({ championship }: { championship: Championship }) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const audit = useAuditLogs(championship.id, page, pageSize, filters);
  const pageCount = Math.max(1, Math.ceil((audit.data?.total ?? 0) / pageSize));

  const updateFilters = (next: AuditFilters) => {
    setFilters(next);
    setPage(1);
  };

  const exportCsv = async () => {
    try {
      const items = await audit.exportLogs.mutateAsync();
      const csv = auditLogsToCsv(items);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `auditoria-${championship.slug || championship.id}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`${items.length} registro(s) exportado(s).`);
    } catch (error) {
      toast.error(getAuditError(error));
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neon">Gestão e governança</p>
          <h2 className="font-display text-xl font-extrabold">Auditoria</h2>
          <p className="text-xs text-muted-foreground">
            Histórico imutável das operações críticas de {championship.name}.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!audit.data?.total || audit.exportLogs.isPending}
          onClick={exportCsv}
        >
          {audit.exportLogs.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </header>

      <AuditFiltersPanel filters={filters} options={audit.data?.filters} onChange={updateFilters} />

      {audit.isLoading && <AuditSkeleton />}
      {audit.error && (
        <section className="card-arena p-6 text-center" role="alert">
          <ShieldCheck className="mx-auto h-8 w-8 text-red-300" />
          <h3 className="mt-3 font-display text-sm font-bold">
            Não foi possível consultar a auditoria
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{getAuditError(audit.error)}</p>
          <Button className="mt-3" variant="outline" onClick={() => audit.refetch()}>
            Tentar novamente
          </Button>
        </section>
      )}

      {audit.data && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-[10px] text-muted-foreground">
            <span>
              <strong className="text-foreground">{audit.data.total}</strong> evento(s)
              encontrado(s)
            </span>
            <span>
              Retenção configurada:{" "}
              <strong className="text-foreground">{audit.data.retention_months} meses</strong>
            </span>
          </section>

          <AuditTimeline items={audit.data.items} />

          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Paginação da auditoria"
          >
            <Button
              variant="outline"
              disabled={page <= 1 || audit.isFetching}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {page} de {pageCount}
            </span>
            <Button
              variant="outline"
              disabled={page >= pageCount || audit.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}

function AuditFiltersPanel({
  filters,
  options,
  onChange,
}: {
  filters: AuditFilters;
  options:
    | {
        actions: string[];
        entity_types: string[];
        actors: Array<{ id: string | null; name: string }>;
      }
    | undefined;
  onChange: (filters: AuditFilters) => void;
}) {
  const update = <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) =>
    onChange({ ...filters, [key]: value });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <section className="card-arena grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
      <select
        aria-label="Módulo"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.module}
        onChange={(event) => update("module", event.target.value)}
      >
        <option value="">Todos os módulos</option>
        {Object.entries(moduleLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Ação"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.action}
        onChange={(event) => update("action", event.target.value)}
      >
        <option value="">Todas as ações</option>
        {(options?.actions ?? []).map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select>
      <select
        aria-label="Tipo de recurso"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.entityType}
        onChange={(event) => update("entityType", event.target.value)}
      >
        <option value="">Todos os recursos</option>
        {(options?.entity_types ?? []).map((entityType) => (
          <option key={entityType} value={entityType}>
            {entityType}
          </option>
        ))}
      </select>
      <select
        aria-label="Ator"
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={filters.actorId}
        onChange={(event) => update("actorId", event.target.value)}
      >
        <option value="">Todos os atores</option>
        {(options?.actors ?? [])
          .filter((actor) => actor.id)
          .map((actor) => (
            <option key={actor.id} value={actor.id ?? ""}>
              {actor.name}
            </option>
          ))}
      </select>
      <Input
        aria-label="Data inicial"
        type="date"
        value={filters.dateFrom}
        onChange={(event) => update("dateFrom", event.target.value)}
      />
      <Input
        aria-label="Data final"
        type="date"
        value={filters.dateTo}
        onChange={(event) => update("dateTo", event.target.value)}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          aria-label="ID do recurso"
          placeholder="ID exato do recurso"
          value={filters.entityId}
          onChange={(event) => update("entityId", event.target.value.trim())}
        />
      </div>
      <Button variant="ghost" disabled={!hasFilters} onClick={() => onChange(emptyFilters)}>
        <FilterX className="h-4 w-4" /> Limpar filtros
      </Button>
    </section>
  );
}

function AuditTimeline({ items }: { items: AuditLogItem[] }) {
  if (!items.length) {
    return (
      <section className="card-arena p-8 text-center">
        <FileClock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-3 font-display text-sm font-bold">Nenhum evento encontrado</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajuste os filtros para consultar outro período ou recurso.
        </p>
      </section>
    );
  }

  return (
    <section className="card-arena divide-y divide-white/[0.055] overflow-hidden">
      {items.map((item) => (
        <article key={item.id} className="p-4">
          <div className="flex flex-wrap items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/10 text-neon">
              <FileClock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-xs">{item.action}</strong>
                <Badge variant="outline">{moduleLabels[item.module] ?? item.module}</Badge>
                <Badge variant="secondary">{item.entity_type}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserRound className="h-3 w-3" /> {item.actor_name}
                </span>
                <time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time>
                {item.entity_id && <code className="text-[9px]">{item.entity_id}</code>}
              </div>
            </div>
          </div>

          {(hasJsonData(item.old_data) ||
            hasJsonData(item.new_data) ||
            hasJsonData(item.context)) && (
            <details className="mt-3 rounded-lg border border-white/[0.05] bg-black/10 p-3">
              <summary className="cursor-pointer text-[10px] font-semibold">
                Ver detalhes sanitizados
              </summary>
              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                <JsonBlock label="Antes" value={item.old_data} />
                <JsonBlock label="Depois" value={item.new_data} />
                <JsonBlock label="Contexto" value={item.context} />
              </div>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}

function JsonBlock({ label, value }: { label: string; value: Json | null }) {
  return (
    <div className="min-w-0">
      <h4 className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</h4>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-black/20 p-2 text-[9px]">
        {hasJsonData(value) ? JSON.stringify(value, null, 2) : "Sem dados"}
      </pre>
    </div>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}

function hasJsonData(value: Json | null) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function getAuditError(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível concluir a operação.";
  if (error.message.includes("audit:forbidden")) {
    return "Somente owner e admin podem consultar a auditoria.";
  }
  if (error.message.includes("audit:export_too_large")) {
    return "A exportação excede 5.000 eventos. Reduza o período ou aplique mais filtros.";
  }
  if (error.message.includes("invalid input syntax for type uuid")) {
    return "O ID do recurso informado não é um UUID válido.";
  }
  return error.message;
}
