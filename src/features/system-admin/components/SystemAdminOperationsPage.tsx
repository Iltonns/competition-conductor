import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  ServerCog,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlatformOperationalStatus } from "../hooks/useSystemAdmin";
import type { OperationalSeverity, PlatformOperationalStatus } from "../types/system-admin.types";

const dependencyLabels: Record<PlatformOperationalStatus["health"][number]["dependency"], string> =
  {
    database: "PostgreSQL",
    auth: "Supabase Auth",
    storage: "Supabase Storage",
    email: "E-mail",
    billing: "Cobrança",
    client_error_reporting: "Erros do cliente",
  };

const statusLabels: Record<PlatformOperationalStatus["health"][number]["status"], string> = {
  operational: "Operacional",
  configured: "Configurado",
  not_configured: "Não configurado",
  collecting: "Coletando",
  ready_no_recent_events: "Pronto · sem eventos",
};

export function SystemAdminOperationsPage() {
  const operational = usePlatformOperationalStatus();

  if (operational.isLoading) return <Loading />;
  if (operational.isError || !operational.data) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Status operacional indisponível</AlertTitle>
        <AlertDescription>
          A consulta falhou fechada. Confirme a migration e o vínculo de administrador geral.
        </AlertDescription>
      </Alert>
    );
  }

  const data = operational.data;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300">
            Observabilidade e operação
          </p>
          <h1 className="font-display text-xl font-black">Configuração da plataforma</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Saúde, falhas, recursos, continuidade e procedimentos operacionais.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={operational.isFetching}
          onClick={() => operational.refetch()}
        >
          {operational.isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </header>

      <HealthGrid items={data.health} />
      <MetricsGrid data={data} />
      <OperationalAlerts alerts={data.alerts} runbooks={data.runbooks} />
      <ResourceUsage data={data} />
      <Continuity data={data} />
      <RecentEvents events={data.recent_events} />

      <p className="text-[10px] text-muted-foreground">
        Atualizado em {formatDateTime(data.generated_at)}. Atualização automática a cada minuto.
      </p>
    </div>
  );
}

function HealthGrid({ items }: { items: PlatformOperationalStatus["health"] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Dependências</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const healthy = ["operational", "configured", "collecting"].includes(item.status);
          return (
            <Card
              key={item.dependency}
              className={healthy ? "border-emerald-400/15" : "border-amber-400/20"}
            >
              <CardContent className="flex items-start gap-3 p-4">
                {healthy ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{dependencyLabels[item.dependency]}</strong>
                    <Badge variant="outline">{statusLabels[item.status]}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function MetricsGrid({ data }: { data: PlatformOperationalStatus }) {
  const metrics = [
    { label: "Eventos · 24h", value: data.metrics_24h.events },
    { label: "Erros · 24h", value: data.metrics_24h.errors },
    { label: "Críticos · 24h", value: data.metrics_24h.critical },
    { label: "Falhas RPC", value: data.metrics_24h.rpc_failures },
    { label: "Falhas Auth", value: data.metrics_24h.auth_failures },
    {
      label: "Falhas jobs/webhooks",
      value: data.metrics_24h.job_failures + data.metrics_24h.webhook_failures,
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Métricas operacionais</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-amber-400/10">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 font-display text-2xl font-black">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CompactMetric
          label="Latência média"
          value={formatDuration(data.metrics_24h.average_duration_ms)}
        />
        <CompactMetric
          label="Latência p95"
          value={formatDuration(data.metrics_24h.p95_duration_ms)}
        />
        <CompactMetric
          label="Commits do banco"
          value={data.database_activity.commits.toLocaleString("pt-BR")}
        />
        <CompactMetric
          label="Rollbacks do banco"
          value={data.database_activity.rollbacks.toLocaleString("pt-BR")}
        />
      </div>
    </section>
  );
}

function OperationalAlerts({
  alerts,
  runbooks,
}: {
  alerts: PlatformOperationalStatus["alerts"];
  runbooks: PlatformOperationalStatus["runbooks"];
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Alertas e runbooks</h2>
      {!alerts.length ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Nenhum alerta ativo</AlertTitle>
          <AlertDescription>Os sinais coletados não exigem ação no momento.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const runbook = runbooks.find((item) => item.id === alert.runbook_id);
            return (
              <Card
                key={alert.id}
                className={
                  alert.severity === "critical" ? "border-red-400/30" : "border-amber-400/20"
                }
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <strong className="text-sm">{alert.title}</strong>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{alert.description}</p>
                  {runbook && (
                    <details className="mt-3 rounded-lg border bg-black/10 p-3">
                      <summary className="cursor-pointer text-xs font-semibold">
                        Runbook · {runbook.title}
                      </summary>
                      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                        {runbook.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResourceUsage({ data }: { data: PlatformOperationalStatus }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Uso de recursos e custos</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Database className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-xs text-muted-foreground">Banco de dados</p>
              <p className="font-display text-xl font-black">
                {formatBytes(data.resource_usage.database_bytes)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <HardDrive className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-xs text-muted-foreground">
                Storage · {data.resource_usage.storage_objects} objeto(s)
              </p>
              <p className="font-display text-xl font-black">
                {formatBytes(data.resource_usage.storage_bytes)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Alert className="mt-3">
        <Activity className="h-4 w-4" />
        <AlertTitle>Valores financeiros indisponíveis</AlertTitle>
        <AlertDescription>
          Custos de cobrança e e-mail dependem das integrações dos respectivos provedores. O painel
          não estima valores fictícios.
        </AlertDescription>
      </Alert>
    </section>
  );
}

function Continuity({ data }: { data: PlatformOperationalStatus }) {
  return (
    <Card className="border-amber-400/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ServerCog className="h-4 w-4 text-amber-300" />
          Continuidade e recuperação
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <Decision label="RPO" value={data.continuity.rpo} />
        <Decision label="RTO" value={data.continuity.rto} />
        <Decision label="Teste de restauração" value={data.continuity.restore_test} />
      </CardContent>
    </Card>
  );
}

function Decision({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">
        {value === "not_recorded" ? "Sem evidência registrada" : "Aguardando aprovação"}
      </p>
    </div>
  );
}

function RecentEvents({ events }: { events: PlatformOperationalStatus["recent_events"] }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Eventos recentes</h2>
      <Card className="divide-y divide-border overflow-hidden">
        {!events.length && (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum evento operacional registrado.
          </CardContent>
        )}
        {events.map((event) => (
          <article key={event.id} className="flex flex-wrap items-center gap-3 p-4 text-xs">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <SeverityBadge severity={event.severity} />
            <strong>{event.code}</strong>
            <Badge variant="secondary">{event.event_kind}</Badge>
            {event.route && <code>{event.route}</code>}
            {event.fingerprint && (
              <span className="text-muted-foreground">#{event.fingerprint}</span>
            )}
            <time className="ml-auto text-muted-foreground" dateTime={event.occurred_at}>
              {formatDateTime(event.occurred_at)}
            </time>
          </article>
        ))}
      </Card>
    </section>
  );
}

function SeverityBadge({ severity }: { severity: OperationalSeverity }) {
  return (
    <Badge
      variant={severity === "critical" || severity === "error" ? "destructive" : "outline"}
      className={severity === "warning" ? "border-amber-300/40 text-amber-300" : undefined}
    >
      {severity}
    </Badge>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[index]}`;
}

function formatDuration(value: number | null) {
  return value === null ? "Sem amostra" : `${value.toLocaleString("pt-BR")} ms`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function Loading() {
  return (
    <div className="grid min-h-52 place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
    </div>
  );
}
