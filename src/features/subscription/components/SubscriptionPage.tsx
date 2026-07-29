import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CreditCard,
  Database,
  Gauge,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManageableOrganizations } from "@/features/organization-settings/hooks/useOrganizationSettings";
import {
  useAvailablePlans,
  useCreateInfinitePayCheckout,
  useOrganizationSubscription,
} from "../hooks/useSubscription";
import type {
  CommercialPlan,
  OrganizationSubscriptionContext,
  ResourceUsage,
  SubscriptionStatus,
} from "../types/subscription.types";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Período de teste",
  active: "Ativa",
  past_due: "Pagamento pendente",
  cancelled: "Cancelada",
  suspended: "Suspensa",
};

const MODULE_LABEL: Record<string, string> = {
  competition: "Competições",
  sports: "Operação esportiva",
  publishing: "Publicação",
  finance: "Financeiro",
  notifications: "Notificações",
  ad_free: "Campeonatos sem propagandas",
  custom_url: "URL personalizada",
  digital_match_report: "Súmula digital",
  attachments: "Arquivos de anexo",
  high_resolution_media: "Melhor resolução de imagens",
  report_printing: "Impressão de relatórios",
  html_embed: "Incorporação HTML",
  json_api: "Acesso à API JSON",
};

export function SubscriptionPage() {
  const organizations = useManageableOrganizations();
  const ownedOrganizations = useMemo(
    () => organizations.data?.filter((organization) => organization.role === "owner") ?? [],
    [organizations.data],
  );
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const subscription = useOrganizationSubscription(organizationId);

  useEffect(() => {
    if (
      ownedOrganizations.length > 0 &&
      !ownedOrganizations.some((organization) => organization.id === organizationId)
    ) {
      setOrganizationId(ownedOrganizations[0].id);
    }
  }, [organizationId, ownedOrganizations]);

  if (organizations.isLoading) return <LoadingState />;
  if (organizations.isError) {
    return <ErrorState message="Não foi possível carregar suas organizações." />;
  }
  if (ownedOrganizations.length === 0) {
    return (
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso do proprietário necessário</AlertTitle>
        <AlertDescription>
          Assinatura, consumo e limites são visíveis somente para proprietários da organização.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="max-w-md space-y-2">
        <Label htmlFor="subscription-organization">Organização</Label>
        <Select value={organizationId ?? ""} onValueChange={setOrganizationId}>
          <SelectTrigger id="subscription-organization">
            <SelectValue placeholder="Selecione uma organização" />
          </SelectTrigger>
          <SelectContent>
            {ownedOrganizations.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subscription.isLoading ? (
        <LoadingState />
      ) : subscription.isError || !subscription.data ? (
        <ErrorState message="Não foi possível carregar a assinatura e o consumo." />
      ) : (
        <SubscriptionContent context={subscription.data} />
      )}
    </div>
  );
}

function SubscriptionContent({ context }: { context: OrganizationSubscriptionContext }) {
  const availablePlans = useAvailablePlans();
  const checkout = useCreateInfinitePayCheckout();
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);
  const subscriptionWarning =
    context.subscription.status === "past_due" || context.subscription.status === "suspended";

  return (
    <>
      {subscriptionWarning && (
        <Alert variant={context.subscription.status === "suspended" ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{STATUS_LABEL[context.subscription.status]}</AlertTitle>
          <AlertDescription>
            {context.subscription.status === "suspended"
              ? "Novos recursos sujeitos a limite estão bloqueados no backend."
              : "A assinatura exige atenção. O acesso não é alterado pelo estado do frontend."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {context.plan.name}
            </CardTitle>
            <CardDescription>
              Versão {context.plan.version} · {STATUS_LABEL[context.subscription.status]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {context.plan.description && (
              <p className="text-sm text-muted-foreground">{context.plan.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {context.plan.modules.map((module) => (
                <Badge key={module} variant="secondary">
                  {MODULE_LABEL[module] ?? module}
                </Badge>
              ))}
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              {context.subscription.provider_connected
                ? "Provedor de cobrança conectado."
                : "Cobrança online ainda não conectada. O estado exibido vem do backend."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" /> Consumo e limites
            </CardTitle>
            <CardDescription>
              Medição calculada no banco. Limites não definidos são exibidos como ilimitados.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <UsageItem label="Organizações" usage={context.usage.organizations} />
            <UsageItem label="Campeonatos ativos" usage={context.usage.active_championships} />
            <UsageItem label="Equipes ativas" usage={context.usage.teams} />
            <UsageItem label="Usuários e convites" usage={context.usage.users} />
            <UsageItem
              label="Armazenamento"
              usage={context.usage.storage_bytes}
              format={formatBytes}
              icon={<Database className="h-4 w-4" />}
            />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4 pt-2" aria-labelledby="available-plans-title">
        <div>
          <h2 id="available-plans-title" className="text-xl font-semibold">
            Planos disponíveis
          </h2>
          <p className="text-sm text-muted-foreground">
            Campeonatos são ilimitados em todos os planos. Os limites são aplicados no backend por
            campeonato.
          </p>
        </div>
        {availablePlans.isLoading ? (
          <LoadingState />
        ) : availablePlans.isError || !availablePlans.data ? (
          <ErrorState message="Não foi possível carregar o catálogo de planos." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {availablePlans.data.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={plan.code === context.plan.code}
                featured={index % 2 === 1}
                loading={checkout.isPending && checkoutPlanId === plan.id}
                onSubscribe={async () => {
                  setCheckoutPlanId(plan.id);
                  try {
                    const result = await checkout.mutateAsync({
                      organizationId: context.organization.id,
                      planVersionId: plan.id,
                      clientRequestId: crypto.randomUUID(),
                    });
                    window.location.assign(result.url);
                  } catch {
                    toast.error("Não foi possível iniciar o checkout. Tente novamente.");
                    setCheckoutPlanId(null);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function PlanCard({
  plan,
  current,
  featured,
  loading,
  onSubscribe,
}: {
  plan: CommercialPlan;
  current: boolean;
  featured: boolean;
  loading: boolean;
  onSubscribe: () => Promise<void>;
}) {
  const athleteLimit = plan.limits.athletes_per_championship;
  const sponsorLimit = plan.limits.sponsors_per_championship;
  const features = [
    athleteLimit === null
      ? "Atletas ilimitados por campeonato"
      : `Até ${athleteLimit.toLocaleString("pt-BR")} atletas por campeonato`,
    sponsorLimit === null
      ? "Patrocinadores ilimitados"
      : `Até ${sponsorLimit.toLocaleString("pt-BR")} patrocinadores por campeonato`,
    "Campeonatos ilimitados",
    ...plan.modules
      .filter(
        (module) =>
          !["competition", "sports", "publishing", "finance", "notifications"].includes(module),
      )
      .map((module) => MODULE_LABEL[module] ?? module),
  ];

  return (
    <Card
      className={
        featured
          ? "relative overflow-hidden border-orange-400 shadow-sm"
          : "relative overflow-hidden"
      }
    >
      {current && (
        <Badge className="absolute right-4 top-4" variant="secondary">
          Plano atual
        </Badge>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="max-w-[15rem] text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-10">{plan.description}</CardDescription>
        <div className="pt-3">
          <span className="text-3xl font-bold">
            {formatCurrency(plan.monthly_price_cents, plan.currency)}
          </span>
          <span className="text-sm text-muted-foreground">/mês</span>
        </div>
      </CardHeader>
      <CardContent className="flex h-[calc(100%-10rem)] flex-col gap-4">
        <ul className="flex-1 space-y-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 border-b pb-2 last:border-0">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          disabled={loading}
          className={featured ? "bg-orange-500 hover:bg-orange-600" : undefined}
          onClick={() => void onSubscribe()}
        >
          {loading ? "Abrindo checkout..." : current ? "Renovar plano" : "Assinar plano"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Pagamento seguro via InfinitePay.
        </p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(priceInCents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(priceInCents / 100);
}

function UsageItem({
  label,
  usage,
  format = (value) => String(value),
  icon,
}: {
  label: string;
  usage: ResourceUsage;
  format?: (value: number) => string;
  icon?: React.ReactNode;
}) {
  const warning = usage.state === "warning" || usage.state === "blocked";
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </span>
        {usage.state === "unlimited" ? (
          <Badge variant="outline">Ilimitado</Badge>
        ) : warning ? (
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Limite em atenção" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Consumo normal" />
        )}
      </div>
      <div className="text-lg font-semibold">
        {format(usage.used)}
        {usage.limit !== null && (
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            de {format(usage.limit)}
          </span>
        )}
      </div>
      {usage.limit !== null && (
        <Progress
          value={Math.min(100, usage.percentage ?? 0)}
          aria-label={`${label}: ${usage.percentage ?? 0}% utilizado`}
        />
      )}
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value / 1024;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[index]}`;
}

function LoadingState() {
  return (
    <div className="flex min-h-40 items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando assinatura...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Falha ao carregar</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
