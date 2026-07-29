import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  BellRing,
  Globe2,
  ImagePlus,
  Link2,
  Loader2,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  INTEGRATION_KEYS,
  type ChampionshipDependencySummary,
  type ChampionshipIdentityInput,
  type IntegrationKey,
  type NotificationPreferences,
  type SaveChampionshipSettingsInput,
} from "../api/championship-settings";
import { useChampionshipSettings } from "../hooks/useChampionshipSettings";
import {
  isDangerConfirmationValid,
  validateChampionshipIdentity,
} from "../utils/championship-settings-validation";

const EMPTY_IDENTITY: ChampionshipIdentityInput = {
  name: "",
  season: "",
  description: "",
  starts_at: "",
  ends_at: "",
  city: "",
  state: "",
  contact_email: "",
  contact_phone: "",
  website_url: "",
  instagram_url: "",
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  registration_updates: true,
  match_changes: true,
  referee_updates: true,
  publication_updates: true,
};

const NOTIFICATION_LABELS: Record<keyof NotificationPreferences, string> = {
  registration_updates: "Atualizações de inscrições",
  match_changes: "Alterações em partidas",
  referee_updates: "Escalas e respostas da arbitragem",
  publication_updates: "Publicações relevantes",
};

const INTEGRATION_LABELS: Record<IntegrationKey, { title: string; description: string }> = {
  registration_finance: {
    title: "Inscrições → financeiro",
    description: "Autoriza lançamentos financeiros idempotentes originados por inscrições.",
  },
  sponsorship_finance: {
    title: "Patrocínios → financeiro",
    description: "Autoriza lançamentos financeiros idempotentes originados por patrocínios.",
  },
  refereeing_finance: {
    title: "Arbitragem → financeiro",
    description: "Autoriza lançamentos financeiros idempotentes originados por escalas.",
  },
};

const DEPENDENCY_LABELS: Record<keyof ChampionshipDependencySummary, string> = {
  matches: "Partidas",
  teams: "Equipes legadas",
  registrations: "Inscrições de equipes",
  stages: "Fases",
  financial_transactions: "Lançamentos financeiros",
  content: "Conteúdos e patrocinadores",
  sports_operations: "Arbitragem e sanções",
  audit_logs: "Histórico de auditoria",
};

type DangerAction = "archive" | "delete" | null;

export function ChampionshipSettingsPage({ championshipId }: { championshipId: string }) {
  const navigate = useNavigate();
  const settings = useChampionshipSettings(championshipId);
  const [identity, setIdentity] = useState(EMPTY_IDENTITY);
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [locale, setLocale] = useState<SaveChampionshipSettingsInput["locale"]>("pt-BR");
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [integrations, setIntegrations] = useState<IntegrationKey[]>([]);
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);

  useEffect(() => {
    if (!settings.data) return;
    const data = settings.data;
    setIdentity({
      name: data.identity.name,
      season: data.identity.season ?? "",
      description: data.identity.description ?? "",
      starts_at: data.identity.starts_at ?? "",
      ends_at: data.identity.ends_at ?? "",
      city: data.identity.city ?? "",
      state: data.identity.state ?? "",
      contact_email: data.identity.contact_email ?? "",
      contact_phone: data.identity.contact_phone ?? "",
      website_url: data.identity.website_url ?? "",
      instagram_url: data.identity.instagram_url ?? "",
    });
    setTimezone(data.preferences.timezone);
    setLocale(data.preferences.locale);
    setNotifications({
      ...DEFAULT_NOTIFICATIONS,
      ...data.preferences.notification_preferences,
    });
    setIntegrations(data.preferences.enabled_integrations);
  }, [settings.data]);

  if (settings.isLoading) return <SettingsSkeleton />;

  if (settings.error || !settings.data) {
    return (
      <section className="card-arena p-8 text-center" role="alert">
        <ShieldAlert className="mx-auto h-8 w-8 text-red-300" />
        <h2 className="mt-3 font-display text-sm font-bold">
          Não foi possível abrir as configurações
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{settingsErrorMessage(settings.error)}</p>
        <Button variant="outline" className="mt-4" onClick={() => settings.refetch()}>
          Tentar novamente
        </Button>
      </section>
    );
  }

  const data = settings.data;
  const updateIdentity = (key: keyof ChampionshipIdentityInput, value: string) =>
    setIdentity((current) => ({ ...current, [key]: value }));

  const save = async () => {
    const validationError = validateChampionshipIdentity(identity);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await settings.save.mutateAsync({
        identity,
        timezone,
        locale,
        notificationPreferences: notifications,
        enabledIntegrations: integrations,
      });
      toast.success("Configurações operacionais salvas e auditadas.");
    } catch (error) {
      toast.error(settingsErrorMessage(error));
    }
  };

  const toggleIntegration = (key: IntegrationKey) =>
    setIntegrations((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-neon">Gestão e governança</p>
          <h2 className="font-display text-xl font-extrabold">Configurações do campeonato</h2>
          <p className="text-xs text-muted-foreground">
            Preferências operacionais separadas do regulamento esportivo.
          </p>
        </div>
        <Button disabled={settings.save.isPending} onClick={save}>
          {settings.save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar configurações
        </Button>
      </header>

      {data.identity.status === "archived" && (
        <section className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
          <div className="flex items-center gap-2 text-amber-200">
            <Archive className="h-4 w-4" />
            <strong className="text-xs">Campeonato arquivado</strong>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            O histórico foi preservado e a exposição pública está desativada.
          </p>
        </section>
      )}

      <SettingsSection
        icon={Globe2}
        title="Identidade e contato"
        description="Dados administrativos. A publicação pública continua controlada pela página pública."
      >
        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs">Logo do campeonato</Label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]">
              {data.identity.logo_url ? (
                <img
                  src={data.identity.logo_url}
                  alt={`Logo de ${data.identity.name}`}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <ImagePlus className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Input
                id="championship-logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="max-w-sm file:mr-3 file:border-0 file:bg-transparent file:text-xs"
                disabled={settings.uploadLogo.isPending || settings.removeLogo.isPending}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  try {
                    await settings.uploadLogo.mutateAsync(file);
                    toast.success("Logo do campeonato atualizada.");
                  } catch (error) {
                    toast.error(settingsErrorMessage(error));
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                JPG, PNG ou WebP, até 5 MB. A imagem será usada no painel e na página pública.
              </p>
              {data.identity.logo_url && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={settings.uploadLogo.isPending || settings.removeLogo.isPending}
                  onClick={async () => {
                    try {
                      await settings.removeLogo.mutateAsync();
                      toast.success("Logo do campeonato removida.");
                    } catch (error) {
                      toast.error(settingsErrorMessage(error));
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Remover logo
                </Button>
              )}
            </div>
          </div>
        </div>
        <TextField
          label="Nome"
          value={identity.name}
          maxLength={120}
          onChange={(value) => updateIdentity("name", value)}
        />
        <TextField
          label="Temporada"
          value={identity.season}
          maxLength={40}
          onChange={(value) => updateIdentity("season", value)}
        />
        <div className="sm:col-span-2">
          <Label className="text-xs">Descrição</Label>
          <Textarea
            className="mt-1 min-h-24"
            maxLength={4000}
            value={identity.description}
            onChange={(event) => updateIdentity("description", event.target.value)}
          />
        </div>
        <TextField
          label="Data inicial"
          type="date"
          value={identity.starts_at}
          onChange={(value) => updateIdentity("starts_at", value)}
        />
        <TextField
          label="Data final"
          type="date"
          value={identity.ends_at}
          onChange={(value) => updateIdentity("ends_at", value)}
        />
        <TextField
          label="Cidade"
          value={identity.city}
          maxLength={120}
          onChange={(value) => updateIdentity("city", value)}
        />
        <TextField
          label="Estado/região"
          value={identity.state}
          maxLength={120}
          onChange={(value) => updateIdentity("state", value)}
        />
        <TextField
          label="E-mail de contato"
          type="email"
          value={identity.contact_email}
          maxLength={254}
          onChange={(value) => updateIdentity("contact_email", value)}
        />
        <TextField
          label="Telefone de contato"
          type="tel"
          value={identity.contact_phone}
          maxLength={40}
          onChange={(value) => updateIdentity("contact_phone", value)}
        />
        <TextField
          label="Website HTTPS"
          type="url"
          value={identity.website_url}
          maxLength={2048}
          placeholder="https://"
          onChange={(value) => updateIdentity("website_url", value)}
        />
        <TextField
          label="Instagram HTTPS"
          type="url"
          value={identity.instagram_url}
          maxLength={2048}
          placeholder="https://instagram.com/..."
          onChange={(value) => updateIdentity("instagram_url", value)}
        />
      </SettingsSection>

      <SettingsSection
        icon={Settings2}
        title="Preferências regionais"
        description="Controlam a apresentação de datas e o contexto operacional."
      >
        <SelectField
          label="Fuso horário"
          value={timezone}
          onChange={setTimezone}
          options={[
            ["America/Sao_Paulo", "Brasília / São Paulo"],
            ["America/Manaus", "Manaus"],
            ["America/Cuiaba", "Cuiabá"],
            ["America/Rio_Branco", "Rio Branco"],
            ["UTC", "UTC"],
          ]}
        />
        <SelectField
          label="Idioma"
          value={locale}
          onChange={(value) => setLocale(value as SaveChampionshipSettingsInput["locale"])}
          options={[
            ["pt-BR", "Português (Brasil)"],
            ["en-US", "English (US)"],
            ["es-ES", "Español"],
          ]}
        />
      </SettingsSection>

      <SettingsSection
        icon={BellRing}
        title="Notificações"
        description="Preferências para notificações internas. Entrega por e-mail depende de SMTP validado."
      >
        {(Object.keys(NOTIFICATION_LABELS) as Array<keyof NotificationPreferences>).map((key) => (
          <ToggleRow
            key={key}
            title={NOTIFICATION_LABELS[key]}
            checked={notifications[key]}
            onChange={(checked) => setNotifications((current) => ({ ...current, [key]: checked }))}
          />
        ))}
      </SettingsSection>

      <SettingsSection
        icon={Link2}
        title="Integrações permitidas"
        description="Estes controles apenas autorizam fluxos idempotentes; não ativam provedores externos."
      >
        {INTEGRATION_KEYS.map((key) => (
          <ToggleRow
            key={key}
            title={INTEGRATION_LABELS[key].title}
            description={INTEGRATION_LABELS[key].description}
            checked={integrations.includes(key)}
            onChange={() => toggleIntegration(key)}
          />
        ))}
      </SettingsSection>

      <section className="rounded-xl border border-red-400/20 bg-red-500/[0.035] p-4">
        <div className="flex items-center gap-2 text-red-200">
          <ShieldAlert className="h-4 w-4" />
          <h3 className="font-display text-sm font-bold">Zona de perigo</h3>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Arquivar preserva todo o histórico. A exclusão física é exclusiva do owner e somente para
          campeonatos sem dependências.
        </p>

        <DependencySummary dependencies={data.governance.dependencies} />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={data.identity.status === "archived"}
            onClick={() => setDangerAction("archive")}
          >
            <Archive className="h-4 w-4" /> Arquivar campeonato
          </Button>
          <Button
            variant="destructive"
            disabled={
              !data.governance.can_permanently_delete || data.governance.dependency_total > 0
            }
            onClick={() => setDangerAction("delete")}
          >
            <Trash2 className="h-4 w-4" /> Excluir permanentemente
          </Button>
        </div>
        {!data.governance.can_permanently_delete && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Somente o owner da organização pode realizar a exclusão física.
          </p>
        )}
      </section>

      <DangerActionDialog
        action={dangerAction}
        championshipName={data.identity.name}
        isPending={settings.archive.isPending || settings.permanentlyDelete.isPending}
        onOpenChange={(open) => !open && setDangerAction(null)}
        onConfirm={async (confirmation, reason) => {
          try {
            if (dangerAction === "archive") {
              await settings.archive.mutateAsync({ confirmation, reason });
              toast.success("Campeonato arquivado sem apagar o histórico.");
              setDangerAction(null);
              return;
            }
            await settings.permanentlyDelete.mutateAsync({ confirmation, reason });
            toast.success("Campeonato excluído permanentemente.");
            setDangerAction(null);
            await navigate({ to: "/championships" });
          } catch (error) {
            toast.error(settingsErrorMessage(error));
          }
        }}
      />
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Settings2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-arena p-4">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-neon" />
        <div>
          <h3 className="font-display text-sm font-bold">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        className="mt-1"
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <select
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] p-3">
      <div>
        <p className="text-xs font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-[9px] text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function DependencySummary({ dependencies }: { dependencies: ChampionshipDependencySummary }) {
  const active = (
    Object.entries(dependencies) as Array<[keyof ChampionshipDependencySummary, number]>
  ).filter(([, count]) => count > 0);

  return (
    <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/10 p-3">
      <p className="text-[10px] font-semibold">Dependências protegidas</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {active.length ? (
          active.map(([key, count]) => (
            <Badge key={key} variant="outline">
              {DEPENDENCY_LABELS[key]}: {count}
            </Badge>
          ))
        ) : (
          <span className="text-[10px] text-muted-foreground">
            Nenhuma dependência bloqueadora encontrada.
          </span>
        )}
      </div>
    </div>
  );
}

function DangerActionDialog({
  action,
  championshipName,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  action: DangerAction;
  championshipName: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (confirmation: string, reason: string) => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!action) {
      setConfirmation("");
      setReason("");
    }
  }, [action]);

  const isDelete = action === "delete";
  const valid = isDangerConfirmationValid(confirmation, championshipName, reason);

  return (
    <AlertDialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDelete ? "Excluir campeonato permanentemente?" : "Arquivar campeonato?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? "Esta ação é irreversível. Ela só será aceita se não houver dependências."
              : "O campeonato deixará de ser público, mas todo o histórico será preservado."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">
              Digite <strong>{championshipName}</strong> para confirmar
            </Label>
            <Input
              className="mt-1"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Justificativa obrigatória</Label>
            <Textarea
              className="mt-1"
              value={reason}
              maxLength={1000}
              placeholder="Informe o motivo com pelo menos 10 caracteres."
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!valid || isPending}
            className={isDelete ? "bg-destructive text-destructive-foreground" : undefined}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm(confirmation, reason);
            }}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDelete ? "Excluir permanentemente" : "Arquivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16" />
      <Skeleton className="h-80" />
      <Skeleton className="h-44" />
    </div>
  );
}

function settingsErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível concluir a operação.";
  if (error.message.includes("championship_settings:forbidden")) {
    return "Somente owner e admin podem gerenciar estas configurações.";
  }
  if (error.message.includes("championship_settings:owner_required")) {
    return "Somente o owner pode excluir permanentemente um campeonato.";
  }
  if (error.message.includes("championship_settings:has_dependencies")) {
    return "Existem dependências protegidas. Arquive o campeonato em vez de excluí-lo.";
  }
  if (error.message.includes("championship_settings:confirmation_mismatch")) {
    return "O nome digitado não corresponde ao campeonato.";
  }
  if (error.message.includes("championship_settings:invalid_period")) {
    return "A data final não pode ser anterior à data inicial.";
  }
  if (error.message.includes("championship_settings:invalid_email")) {
    return "Informe um e-mail de contato válido.";
  }
  if (
    error.message.includes("championship_settings:invalid_website") ||
    error.message.includes("championship_settings:invalid_instagram")
  ) {
    return "Os endereços externos devem usar HTTPS.";
  }
  return error.message;
}
