import { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileClock,
  FilterX,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSystemAdminAudit } from "../hooks/useSystemAdmin";
import type {
  AdminAuditAlertCategory,
  AdminAuditFilters,
  AdminAuditLogItem,
  AdminAuditSeverity,
} from "../types/system-admin.types";

const PAGE_SIZE = 25;

const emptyFilters: AdminAuditFilters = {
  search: "",
  actorUserId: "",
  action: "",
  targetType: "",
  alertCategory: "",
  dateFrom: "",
  dateTo: "",
};

const categoryLabels: Record<AdminAuditAlertCategory, string> = {
  plan: "Plano e assinatura",
  suspension: "Suspensão",
  support: "Modo suporte",
  privileged: "Acesso privilegiado",
  general: "Geral",
};

const severityLabels: Record<AdminAuditSeverity, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Informativo",
};

export function SystemAdminAuditPage() {
  const [filters, setFilters] = useState<AdminAuditFilters>(emptyFilters);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const audit = useSystemAdminAudit(filters, page, PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil((audit.data?.total ?? 0) / PAGE_SIZE));

  const updateFilter = <K extends keyof AdminAuditFilters>(key: K, value: AdminAuditFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchInput("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300">
          Segurança e governança
        </p>
        <h1 className="font-display text-xl font-black">Auditoria administrativa</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Trilha imutável das operações de plataforma, separada da auditoria dos campeonatos.
        </p>
      </header>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Preservação indefinida</AlertTitle>
        <AlertDescription>
          A exclusão automática permanece desativada até a aprovação de um prazo jurídico e
          operacional. Campos com nomes de credenciais, tokens e segredos são mascarados pela RPC.
        </AlertDescription>
      </Alert>

      {audit.data && <AlertSummary counts={audit.data.alert_counts} />}

      <Card className="border-amber-400/10">
        <CardHeader>
          <CardTitle className="text-base">Pesquisa e filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex max-w-2xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              updateFilter("search", searchInput.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={searchInput}
                maxLength={100}
                placeholder="Ação, alvo, justificativa ou responsável"
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Categoria de alerta"
              value={filters.alertCategory}
              onChange={(value) =>
                updateFilter("alertCategory", value as AdminAuditAlertCategory | "")
              }
              options={Object.entries(categoryLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <FilterSelect
              label="Ação"
              value={filters.action}
              onChange={(value) => updateFilter("action", value)}
              options={(audit.data?.filter_options.actions ?? []).map((value) => ({
                value,
                label: value,
              }))}
            />
            <FilterSelect
              label="Tipo de alvo"
              value={filters.targetType}
              onChange={(value) => updateFilter("targetType", value)}
              options={(audit.data?.filter_options.target_types ?? []).map((value) => ({
                value,
                label: value,
              }))}
            />
            <FilterSelect
              label="Responsável"
              value={filters.actorUserId}
              onChange={(value) => updateFilter("actorUserId", value)}
              options={(audit.data?.filter_options.actors ?? []).map((actor) => ({
                value: actor.id,
                label: actor.email ? `${actor.name} · ${actor.email}` : actor.name,
              }))}
            />
            <Input
              aria-label="Data inicial"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
            />
            <Input
              aria-label="Data final"
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
            />
            <Button
              variant="ghost"
              disabled={!Object.values(filters).some(Boolean)}
              onClick={clearFilters}
            >
              <FilterX className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {audit.isLoading ? (
        <Loading />
      ) : audit.isError || !audit.data ? (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Auditoria indisponível</AlertTitle>
          <AlertDescription>{getAuditError(audit.error)}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{audit.data.total}</strong> evento(s)
              encontrado(s)
            </span>
            {audit.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>

          <AuditTimeline items={audit.data.items} />

          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Paginação da auditoria administrativa"
          >
            <Button
              variant="outline"
              disabled={page === 0 || audit.isFetching}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {pageCount}
            </span>
            <Button
              variant="outline"
              disabled={page + 1 >= pageCount || audit.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}

function AlertSummary({
  counts,
}: {
  counts: Record<Exclude<AdminAuditAlertCategory, "general">, number>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Suporte" value={counts.support} />
      <SummaryCard label="Planos" value={counts.plan} />
      <SummaryCard label="Suspensões" value={counts.suspension} critical />
      <SummaryCard label="Privilégios" value={counts.privileged} critical />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  critical = false,
}: {
  label: string;
  value: number;
  critical?: boolean;
}) {
  return (
    <Card className={critical && value ? "border-red-400/30" : "border-amber-400/10"}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-black">{value}</p>
        </div>
        <AlertTriangle
          className={`h-5 w-5 ${critical && value ? "text-red-300" : "text-amber-300"}`}
        />
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={label}
      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Todos · {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AuditTimeline({ items }: { items: AdminAuditLogItem[] }) {
  if (!items.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Nenhum evento encontrado.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ajuste os filtros para consultar outro período.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <article key={item.id} className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-300/10 text-amber-300">
              <FileClock className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm">{item.action}</strong>
                <SeverityBadge severity={item.severity} />
                <Badge variant="outline">{categoryLabels[item.alert_category]}</Badge>
                <Badge variant="secondary">{item.target_type}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {item.actor_name}
                  {item.actor_email && ` · ${item.actor_email}`}
                </span>
                <time dateTime={item.occurred_at}>{formatDateTime(item.occurred_at)}</time>
                {item.target_id && <code className="text-[10px]">{item.target_id}</code>}
              </div>
              {item.reason && <p className="mt-3 text-xs text-muted-foreground">{item.reason}</p>}
            </div>
          </div>

          {hasDetails(item) && (
            <details className="mt-3 rounded-lg border bg-black/10 p-3">
              <summary className="cursor-pointer text-xs font-semibold">
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
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: AdminAuditSeverity }) {
  return (
    <Badge
      variant={severity === "critical" ? "destructive" : "outline"}
      className={severity === "warning" ? "border-amber-300/40 text-amber-300" : undefined}
    >
      {severityLabels[severity]}
    </Badge>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <h3 className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</h3>
      <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-md bg-black/20 p-2 text-[10px]">
        {hasJsonData(value) ? JSON.stringify(value, null, 2) : "Sem dados"}
      </pre>
    </div>
  );
}

function hasDetails(item: AdminAuditLogItem) {
  return hasJsonData(item.old_data) || hasJsonData(item.new_data) || hasJsonData(item.context);
}

function hasJsonData(value: unknown) {
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
  if (!(error instanceof Error)) return "A consulta foi negada ou está indisponível.";
  if (error.message.includes("admin_audit:invalid_date_range")) {
    return "A data inicial não pode ser posterior à data final.";
  }
  if (error.message.includes("system_admin:forbidden")) {
    return "Somente administradores gerais podem consultar esta trilha.";
  }
  return error.message;
}

function Loading() {
  return (
    <div className="grid min-h-48 place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
    </div>
  );
}
