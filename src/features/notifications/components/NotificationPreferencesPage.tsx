import { useEffect, useState } from "react";
import { BellRing, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useDirectoryOrganizations } from "@/features/global-directory/hooks/useGlobalDirectory";
import { useNotificationPreferences } from "../hooks/useNotifications";
import type { NotificationPreference } from "../types/notification.types";
import { NOTIFICATION_LABELS } from "../utils/notification-display";

export function NotificationPreferencesPage() {
  const organizations = useDirectoryOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const preferences = useNotificationPreferences(organizationId);
  const [form, setForm] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    if (!organizationId && organizations.data?.length) {
      setOrganizationId(organizations.data[0].id);
    }
  }, [organizationId, organizations.data]);

  useEffect(() => {
    if (preferences.data) setForm(preferences.data.preferences);
  }, [preferences.data]);

  if (organizations.isLoading) return <Loading />;
  if (!organizations.data?.length) {
    return (
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Nenhuma organização disponível</AlertTitle>
        <AlertDescription>
          As preferências são definidas separadamente em cada organização.
        </AlertDescription>
      </Alert>
    );
  }

  const updatePreference = (
    type: NotificationPreference["notification_type"],
    field: "internal_enabled" | "email_enabled",
    value: boolean,
  ) =>
    setForm((current) =>
      current.map((item) => (item.notification_type === type ? { ...item, [field]: value } : item)),
    );

  return (
    <div className="space-y-5">
      <div className="max-w-md space-y-2">
        <Label>Organização</Label>
        <Select value={organizationId ?? ""} onValueChange={setOrganizationId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {organizations.data.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preferences.isLoading ? (
        <Loading />
      ) : preferences.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar</AlertTitle>
          <AlertDescription>Não foi possível consultar suas preferências.</AlertDescription>
        </Alert>
      ) : (
        <>
          {!preferences.data?.email_available && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertTitle>E-mail ainda não habilitado</AlertTitle>
              <AlertDescription>
                O envio por e-mail ficará disponível somente após configuração e validação do SMTP.
                As notificações internas já estão operacionais.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="h-5 w-5" /> Eventos
              </CardTitle>
              <CardDescription>
                Escolha como deseja receber cada atualização nesta organização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {form.map((preference) => {
                const copy = NOTIFICATION_LABELS[preference.notification_type];
                return (
                  <div
                    key={preference.notification_type}
                    className="grid gap-4 border-b py-4 last:border-0 md:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-medium">{copy.title}</p>
                      <p className="text-sm text-muted-foreground">{copy.description}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={preference.internal_enabled}
                        onCheckedChange={(checked) =>
                          updatePreference(
                            preference.notification_type,
                            "internal_enabled",
                            checked,
                          )
                        }
                      />
                      Interna
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={preference.email_enabled}
                        disabled={!preferences.data?.email_available}
                        onCheckedChange={(checked) =>
                          updatePreference(preference.notification_type, "email_enabled", checked)
                        }
                      />
                      E-mail
                    </label>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Button
            disabled={preferences.save.isPending || form.length === 0}
            onClick={async () => {
              try {
                await preferences.save.mutateAsync(form);
                toast.success("Preferências atualizadas.");
              } catch {
                toast.error("Não foi possível salvar as preferências.");
              }
            }}
          >
            {preferences.save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar preferências
          </Button>
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-40 items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
    </div>
  );
}
