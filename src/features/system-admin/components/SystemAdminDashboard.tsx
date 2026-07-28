import {
  AlertTriangle,
  Building2,
  CreditCard,
  Database,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemAdminDashboard } from "../hooks/useSystemAdmin";

export function SystemAdminDashboard() {
  const dashboard = useSystemAdminDashboard();

  if (dashboard.isLoading) {
    return (
      <div className="grid min-h-52 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
      </div>
    );
  }
  if (dashboard.isError || !dashboard.data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dados administrativos indisponíveis</AlertTitle>
        <AlertDescription>
          O acesso falhou fechado. Confirme a migration e o vínculo em system_admins.
        </AlertDescription>
      </Alert>
    );
  }

  const { metrics, alerts } = dashboard.data;
  const cards = [
    { label: "Organizações", value: metrics.organizations, icon: Building2 },
    { label: "Usuários", value: metrics.users, icon: Users },
    { label: "Campeonatos", value: metrics.championships, icon: Trophy },
    { label: "Assinaturas ativas", value: metrics.active_subscriptions, icon: CreditCard },
    { label: "Storage", value: formatBytes(metrics.storage_bytes), icon: Database },
  ];
  const alertCount =
    alerts.past_due_subscriptions +
    alerts.suspended_subscriptions +
    alerts.organizations_without_subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-black">Dashboard global</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Métricas autoritativas da plataforma, calculadas no backend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-amber-400/10">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-amber-300" />
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl font-black">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-400/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            Alertas operacionais ({alertCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <AlertMetric label="Assinaturas em atraso" value={alerts.past_due_subscriptions} />
          <AlertMetric label="Assinaturas suspensas" value={alerts.suspended_subscriptions} />
          <AlertMetric
            label="Organizações sem assinatura"
            value={alerts.organizations_without_subscription}
          />
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground">
        Atualizado em {new Date(dashboard.data.generated_at).toLocaleString("pt-BR")}.
      </p>
    </div>
  );
}

function AlertMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-black">{value}</p>
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
