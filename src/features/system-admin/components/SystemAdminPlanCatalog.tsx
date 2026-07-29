import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  usePublishSystemAdminPlanVersion,
  useSystemAdminPlanCatalog,
} from "../hooks/useSystemAdmin";
import type {
  SystemAdminPlanCatalogItem,
  SystemAdminPlanLimits,
} from "../types/system-admin.types";

const LIMITS: Array<{ key: keyof SystemAdminPlanLimits; label: string; suffix?: string }> = [
  { key: "organizations", label: "Organizações" },
  { key: "active_championships", label: "Campeonatos ativos" },
  { key: "teams", label: "Equipes" },
  { key: "users", label: "Usuários e convites" },
  { key: "storage_bytes", label: "Storage", suffix: "bytes" },
  { key: "athletes_per_championship", label: "Atletas por campeonato" },
  { key: "sponsors_per_championship", label: "Patrocinadores por campeonato" },
];

const MODULES = [
  ["competition", "Competições", true],
  ["sports", "Operação esportiva", true],
  ["publishing", "Publicação", true],
  ["finance", "Financeiro", true],
  ["notifications", "Notificações", true],
  ["ad_free", "Sem propagandas", false],
  ["custom_url", "URL personalizada", false],
  ["digital_match_report", "Súmula digital", false],
  ["attachments", "Anexos", false],
  ["high_resolution_media", "Mídia em alta resolução", false],
  ["report_printing", "Impressão de relatórios", false],
  ["html_embed", "Incorporação HTML", false],
  ["json_api", "API JSON", false],
] as const;

interface PlanForm {
  name: string;
  description: string;
  monthlyPrice: string;
  limits: Record<keyof SystemAdminPlanLimits, string>;
  modules: string[];
  reason: string;
  confirmed: boolean;
}

function planToForm(plan: SystemAdminPlanCatalogItem): PlanForm {
  return {
    name: plan.name,
    description: plan.description ?? "",
    monthlyPrice: (plan.monthly_price_cents / 100).toFixed(2).replace(".", ","),
    limits: Object.fromEntries(
      LIMITS.map(({ key }) => [key, plan.limits[key]?.toString() ?? ""]),
    ) as PlanForm["limits"],
    modules: plan.modules,
    reason: "",
    confirmed: false,
  };
}

export function SystemAdminPlanCatalog() {
  const catalog = useSystemAdminPlanCatalog();
  const [selectedPlan, setSelectedPlan] = useState<SystemAdminPlanCatalogItem | null>(null);

  return (
    <section className="space-y-5" aria-labelledby="plan-catalog-title">
      <div>
        <h1 id="plan-catalog-title" className="font-display text-xl font-black">
          Catálogo comercial
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Versões ativas usadas em novas contratações e renovações.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Publicação preserva contratos existentes</AlertTitle>
        <AlertDescription>
          Uma nova versão substitui o catálogo ativo, mas não migra assinaturas existentes. Preço,
          módulos e limites atuais continuam válidos até uma renovação ou troca paga.
        </AlertDescription>
      </Alert>

      {catalog.isLoading ? (
        <div className="grid min-h-32 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : catalog.isError || !catalog.data ? (
        <p className="text-sm text-destructive">O catálogo administrativo está indisponível.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {catalog.data.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <Badge variant="secondary">v{plan.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{plan.code}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-display text-2xl font-black">
                  {formatCurrency(plan.monthly_price_cents)}
                  <span className="text-xs font-normal text-muted-foreground">/mês</span>
                </p>
                <div className="text-xs text-muted-foreground">
                  {plan.subscriptions_count} assinatura(s) vinculada(s) ao histórico deste plano
                </div>
                <Button className="w-full" variant="outline" onClick={() => setSelectedPlan(plan)}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Publicar nova versão
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PublishPlanDialog
        plan={selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      />
    </section>
  );
}

function PublishPlanDialog({
  plan,
  onOpenChange,
}: {
  plan: SystemAdminPlanCatalogItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const publish = usePublishSystemAdminPlanVersion();
  const [form, setForm] = useState<PlanForm | null>(null);

  useEffect(() => setForm(plan ? planToForm(plan) : null), [plan]);

  const parsedPrice = useMemo(
    () => Math.round(Number(form?.monthlyPrice.replace(",", ".") ?? "") * 100),
    [form?.monthlyPrice],
  );
  const parsedLimits = useMemo(() => {
    if (!form) return null;
    return LIMITS.reduce<SystemAdminPlanLimits>(
      (limits, { key }) => {
        const value = form.limits[key].trim();
        limits[key] = value === "" ? null : Number(value);
        return limits;
      },
      {
        organizations: null,
        active_championships: null,
        teams: null,
        users: null,
        storage_bytes: null,
        athletes_per_championship: null,
        sponsors_per_championship: null,
      },
    );
  }, [form]);
  const limitsValid =
    parsedLimits &&
    Object.values(parsedLimits).every(
      (value) => value === null || (Number.isSafeInteger(value) && value >= 0),
    );
  const canSubmit =
    form &&
    form.name.trim().length >= 3 &&
    Number.isSafeInteger(parsedPrice) &&
    parsedPrice > 0 &&
    limitsValid &&
    form.reason.trim().length >= 10 &&
    form.confirmed;

  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Publicar {plan?.code} v{(plan?.version ?? 0) + 1}
          </DialogTitle>
          <DialogDescription>
            A publicação é imediata, auditada e passa a valer para novos checkouts.
          </DialogDescription>
        </DialogHeader>

        {form && plan && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome">
                <Input
                  value={form.name}
                  maxLength={120}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </Field>
              <Field label="Preço mensal (R$)">
                <Input
                  inputMode="decimal"
                  value={form.monthlyPrice}
                  onChange={(event) => setForm({ ...form, monthlyPrice: event.target.value })}
                />
              </Field>
            </div>

            <Field label="Descrição">
              <Textarea
                value={form.description}
                maxLength={500}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Field>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Limites</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {LIMITS.map(({ key, label, suffix }) => (
                  <Field key={key} label={label}>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={form.limits[key]}
                      placeholder="Ilimitado"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          limits: { ...form.limits, [key]: event.target.value },
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {form.limits[key] === "" ? "Ilimitado" : suffix || "unidades"}
                    </p>
                  </Field>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Módulos contratados</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {MODULES.map(([code, label, required]) => {
                  const checked = form.modules.includes(code);
                  return (
                    <label
                      key={code}
                      className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={required}
                        onCheckedChange={(next) =>
                          setForm({
                            ...form,
                            modules: next
                              ? [...form.modules, code]
                              : form.modules.filter((module) => module !== code),
                          })
                        }
                      />
                      <span>{label}</span>
                      {required && <Badge variant="outline">Obrigatório</Badge>}
                    </label>
                  );
                })}
              </div>
            </div>

            <Field label="Justificativa da alteração">
              <Textarea
                value={form.reason}
                minLength={10}
                maxLength={1000}
                rows={4}
                placeholder="Explique a decisão comercial e o impacto esperado."
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">Mínimo de 10 caracteres.</p>
            </Field>

            <label className="flex items-start gap-3 rounded-lg border border-amber-400/30 p-4 text-sm">
              <Checkbox
                checked={form.confirmed}
                onCheckedChange={(checked) => setForm({ ...form, confirmed: checked === true })}
              />
              <span>
                Confirmo que revisei preço, limites e módulos e que esta versão será publicada
                imediatamente para novas contratações e renovações.
              </span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit || publish.isPending || !form || !plan || !parsedLimits}
            onClick={async () => {
              if (!form || !plan || !parsedLimits) return;
              try {
                const result = await publish.mutateAsync({
                  code: plan.code,
                  expectedActiveVersion: plan.version,
                  name: form.name.trim(),
                  description: form.description.trim(),
                  monthlyPriceCents: parsedPrice,
                  limits: parsedLimits,
                  modules: form.modules,
                  reason: form.reason.trim(),
                });
                toast.success(`Plano ${result.code} v${result.version} publicado e auditado.`);
                onOpenChange(false);
              } catch {
                toast.error("Não foi possível publicar. Atualize o catálogo e revise os dados.");
              }
            }}
          >
            {publish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicar nova versão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
