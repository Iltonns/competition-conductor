import { useEffect, useMemo, useState } from "react";
import { Clock3, Eye, LifeBuoy, Loader2, LockKeyhole, Search } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useActiveSupportSession,
  useSupportSessionActions,
  useSupportSessionContext,
  useSystemAdminDirectory,
} from "../hooks/useSystemAdmin";

export function SystemAdminSupportPage() {
  const active = useActiveSupportSession();
  const context = useSupportSessionContext(active.data?.id ?? null);
  const actions = useSupportSessionActions();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const organizations = useSystemAdminDirectory("organizations", search, 0, 50);
  const [organizationId, setOrganizationId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("30");
  const [endReason, setEndReason] = useState("");

  useEffect(() => {
    if (
      !active.data &&
      organizations.data?.items.length &&
      !organizations.data.items.some((organization) => organization.id === organizationId)
    ) {
      setOrganizationId(organizations.data.items[0].id);
    }
  }, [active.data, organizationId, organizations.data]);

  const remainingMinutes = useMemo(() => {
    if (!active.data) return null;
    return Math.max(
      0,
      Math.ceil((new Date(active.data.expires_at).getTime() - Date.now()) / 60_000),
    );
  }, [active.data]);

  if (active.isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-black">Modo suporte</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Acesso temporário, justificado e limitado a uma organização.
        </p>
      </div>

      <Alert>
        <LockKeyhole className="h-4 w-4" />
        <AlertTitle>Somente leitura por padrão</AlertTitle>
        <AlertDescription>
          Esta sessão não impersona usuários, não amplia RLS e não permite operações financeiras,
          exclusões ou alterações nos dados da organização.
        </AlertDescription>
      </Alert>

      {active.data ? (
        <>
          <Card className="border-amber-300/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-5 w-5 text-amber-300" />
                Sessão ativa · {active.data.organization_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Somente leitura</Badge>
                <Badge variant="outline">
                  <Clock3 className="mr-1 h-3 w-3" />
                  {remainingMinutes} minuto(s) restante(s)
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{active.data.reason}</p>
              <div className="space-y-2">
                <Label htmlFor="support-end-reason">Justificativa de encerramento</Label>
                <Textarea
                  id="support-end-reason"
                  value={endReason}
                  maxLength={1000}
                  onChange={(event) => setEndReason(event.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                disabled={actions.end.isPending || endReason.trim().length < 10}
                onClick={async () => {
                  try {
                    await actions.end.mutateAsync({
                      sessionId: active.data!.id,
                      reason: endReason.trim(),
                    });
                    setEndReason("");
                    toast.success("Sessão de suporte encerrada e auditada.");
                  } catch {
                    toast.error("Não foi possível encerrar a sessão.");
                  }
                }}
              >
                {actions.end.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encerrar sessão
              </Button>
            </CardContent>
          </Card>
          <SupportContext context={context} />
        </>
      ) : (
        <Card className="border-amber-400/10">
          <CardHeader>
            <CardTitle className="text-base">Iniciar sessão temporária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form
              className="flex max-w-xl gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
              }}
            >
              <Input
                value={searchInput}
                maxLength={100}
                placeholder="Buscar organização"
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <Button type="submit" variant="outline">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </form>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organização</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.data?.items.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-reason">Justificativa detalhada</Label>
              <Textarea
                id="support-reason"
                value={reason}
                maxLength={1000}
                rows={5}
                placeholder="Descreva a solicitação, o objetivo e o escopo da análise."
                onChange={(event) => setReason(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 20 caracteres.</p>
            </div>

            <Button
              disabled={actions.start.isPending || !organizationId || reason.trim().length < 20}
              onClick={async () => {
                try {
                  await actions.start.mutateAsync({
                    organizationId,
                    reason: reason.trim(),
                    durationMinutes: Number(duration),
                  });
                  setReason("");
                  toast.success("Sessão de suporte iniciada com auditoria.");
                } catch {
                  toast.error("Não foi possível iniciar a sessão de suporte.");
                }
              }}
            >
              {actions.start.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar modo suporte
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SupportContext({ context }: { context: ReturnType<typeof useSupportSessionContext> }) {
  if (context.isLoading) return <Loading />;
  if (context.isError || !context.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Contexto indisponível</AlertTitle>
        <AlertDescription>A sessão expirou ou a consulta foi negada.</AlertDescription>
      </Alert>
    );
  }

  const data = context.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-5 w-5" /> Contexto sanitizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <strong>{data.organization.name}</strong>
          <p className="text-xs text-muted-foreground">
            {[data.organization.city, data.organization.state].filter(Boolean).join(" · ") ||
              "Local não informado"}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Membros" value={data.metrics.members} />
          <Metric label="Campeonatos" value={data.metrics.championships} />
          <Metric label="Ativos" value={data.metrics.active_championships} />
          <Metric label="Equipes" value={data.metrics.teams} />
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <p className="text-muted-foreground">Assinatura</p>
          <p className="mt-1 font-semibold">
            {data.subscription
              ? `${data.subscription.plan_name} · ${data.subscription.status}`
              : "Não provisionada"}
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Campeonatos recentes</h2>
          <div className="space-y-2">
            {data.recent_championships.map((championship) => (
              <div
                key={championship.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span>{championship.name}</span>
                <Badge variant="secondary">{championship.status}</Badge>
              </div>
            ))}
            {!data.recent_championships.length && (
              <p className="text-sm text-muted-foreground">Nenhum campeonato.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid min-h-40 place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
    </div>
  );
}
