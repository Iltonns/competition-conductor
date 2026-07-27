import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  Shield,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useManageableOrganizations,
  useOrganizationSettings,
} from "../hooks/useOrganizationSettings";
import type {
  OrganizationMember,
  OrganizationProfileInput,
  OrganizationRole,
} from "../types/organization-settings.types";
import {
  assignableRoles,
  validateOrganizationProfile,
} from "../utils/organization-settings-validation";

const ROLE_LABEL: Record<OrganizationRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

const emptyProfile: OrganizationProfileInput = {
  name: "",
  logo_url: "",
  contact_email: "",
  contact_phone: "",
  website_url: "",
  city: "",
  state: "",
  timezone: "America/Sao_Paulo",
  locale: "pt-BR",
};

export function OrganizationSettingsPage({ view }: { view: "organization" | "users" }) {
  const organizations = useManageableOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const settings = useOrganizationSettings(organizationId);

  useEffect(() => {
    if (!organizationId && organizations.data?.length) {
      setOrganizationId(organizations.data[0].id);
    }
  }, [organizationId, organizations.data]);

  if (organizations.isLoading) return <LoadingState />;
  if (organizations.isError) {
    return <ErrorState message="Não foi possível carregar suas organizações administráveis." />;
  }
  if (!organizations.data?.length) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Acesso administrativo necessário</AlertTitle>
        <AlertDescription>
          Apenas proprietários e administradores podem acessar estas configurações.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <div className="max-w-md space-y-2">
        <Label htmlFor="organization-selector">Organização</Label>
        <Select value={organizationId ?? ""} onValueChange={setOrganizationId}>
          <SelectTrigger id="organization-selector">
            <SelectValue placeholder="Selecione uma organização" />
          </SelectTrigger>
          <SelectContent>
            {organizations.data.map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>
                {organization.name} · {ROLE_LABEL[organization.role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {settings.isLoading ? (
        <LoadingState />
      ) : settings.isError || !settings.data ? (
        <ErrorState message="Não foi possível carregar as configurações da organização." />
      ) : view === "organization" ? (
        <OrganizationProfileCard
          key={settings.data.organization.id}
          profile={settings.data.organization}
          pending={settings.saveProfile.isPending}
          onSave={async (profile) => {
            try {
              await settings.saveProfile.mutateAsync(profile);
              toast.success("Dados da organização atualizados.");
            } catch {
              toast.error("Não foi possível atualizar a organização.");
            }
          }}
        />
      ) : (
        <UsersAccessCard settings={settings} />
      )}
    </div>
  );
}

function OrganizationProfileCard({
  profile,
  pending,
  onSave,
}: {
  profile: OrganizationProfileInput & { plan: string; plan_expires_at: string | null };
  pending: boolean;
  onSave: (profile: OrganizationProfileInput) => Promise<void>;
}) {
  const [form, setForm] = useState<OrganizationProfileInput>({ ...emptyProfile, ...profile });
  const update = (field: keyof OrganizationProfileInput, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Dados da organização
        </CardTitle>
        <CardDescription>
          Informações institucionais exibidas nos módulos administrativos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const validationError = validateOrganizationProfile(form);
            if (validationError) {
              toast.error(validationError);
              return;
            }
            void onSave(form);
          }}
        >
          <Field label="Nome" required>
            <Input
              value={form.name}
              maxLength={120}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field label="Plano">
            <Input value={profile.plan} disabled />
          </Field>
          <Field label="E-mail de contato">
            <Input
              type="email"
              value={form.contact_email ?? ""}
              onChange={(e) => update("contact_email", e.target.value)}
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={form.contact_phone ?? ""}
              maxLength={40}
              onChange={(e) => update("contact_phone", e.target.value)}
            />
          </Field>
          <Field label="Website HTTPS">
            <Input
              value={form.website_url ?? ""}
              placeholder="https://..."
              onChange={(e) => update("website_url", e.target.value)}
            />
          </Field>
          <Field label="Logo (URL)">
            <Input
              value={form.logo_url ?? ""}
              placeholder="https://..."
              onChange={(e) => update("logo_url", e.target.value)}
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={form.city ?? ""}
              maxLength={100}
              onChange={(e) => update("city", e.target.value)}
            />
          </Field>
          <Field label="Estado">
            <Input
              value={form.state ?? ""}
              maxLength={3}
              onChange={(e) => update("state", e.target.value)}
            />
          </Field>
          <Field label="Fuso horário">
            <Input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} />
          </Field>
          <Field label="Idioma">
            <Select value={form.locale} onValueChange={(value) => update("locale", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UsersAccessCard({
  settings,
}: {
  settings: ReturnType<typeof useOrganizationSettings> & {
    data: NonNullable<ReturnType<typeof useOrganizationSettings>["data"]>;
  };
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [action, setAction] = useState<
    | { kind: "role"; member: OrganizationMember; role: OrganizationRole }
    | { kind: "remove"; member: OrganizationMember }
    | { kind: "revoke"; invitationId: string }
    | null
  >(null);
  const [reason, setReason] = useState("");
  const actorRole = settings.data.actor_role;
  const invitationRoles = useMemo(
    () => assignableRoles(actorRole).filter((role) => role !== "owner"),
    [actorRole],
  );

  const canManage = (member: OrganizationMember) =>
    actorRole === "owner" || !["owner", "admin"].includes(member.role);

  const submitAction = async () => {
    if (!action || reason.trim().length < 10) {
      toast.error("Informe uma justificativa com pelo menos 10 caracteres.");
      return;
    }
    try {
      if (action.kind === "role") {
        await settings.changeRole.mutateAsync({
          userId: action.member.user_id,
          role: action.role,
          reason,
        });
      } else if (action.kind === "remove") {
        await settings.removeMember.mutateAsync({ userId: action.member.user_id, reason });
      } else {
        await settings.revokeInvitation.mutateAsync({
          invitationId: action.invitationId,
          reason,
        });
      }
      toast.success("Acesso atualizado com auditoria.");
      setAction(null);
      setReason("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("last_owner")
          ? "O último proprietário não pode ser removido ou rebaixado."
          : "Não foi possível atualizar o acesso.",
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Usuários e acessos</CardTitle>
            <CardDescription>
              Papéis efetivos por organização. Alterações sensíveis exigem justificativa.
            </CardDescription>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" /> Convidar
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Função</th>
                  <th className="w-12 px-4 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {settings.data.members.map((member) => (
                  <tr key={member.user_id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{member.display_name || "Usuário"}</div>
                      <div className="text-muted-foreground">
                        {member.email || "E-mail indisponível"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canManage(member) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {assignableRoles(actorRole, true)
                              .filter((role) => role !== member.role)
                              .map((role) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => setAction({ kind: "role", member, role })}
                                >
                                  Alterar para {ROLE_LABEL[role]}
                                </DropdownMenuItem>
                              ))}
                            {member.user_id !== settings.data.actor_user_id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setAction({ kind: "remove", member })}
                                >
                                  <UserX className="mr-2 h-4 w-4" /> Remover membro
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Convites</h3>
            {settings.data.invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite recente.</p>
            ) : (
              <div className="space-y-2">
                {settings.data.invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {ROLE_LABEL[invitation.role]} ·{" "}
                        {invitation.status === "pending" ? "Pendente" : "Provisionado"}
                      </div>
                    </div>
                    {invitation.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={settings.resendInvitation.isPending}
                          onClick={async () => {
                            try {
                              await settings.resendInvitation.mutateAsync(invitation.id);
                              toast.success("Convite reenviado.");
                            } catch {
                              toast.error("Aguarde 60 segundos entre reenvios.");
                            }
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Reenviar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAction({ kind: "revoke", invitationId: invitation.id })}
                        >
                          Revogar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
            <DialogDescription>
              O acesso será limitado a esta organização. Convites para proprietário não são
              permitidos.
            </DialogDescription>
          </DialogHeader>
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Função">
            <Select
              value={inviteRole}
              onValueChange={(value) => setInviteRole(value as typeof inviteRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {invitationRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={settings.invite.isPending || !email}
              onClick={async () => {
                try {
                  const result = await settings.invite.mutateAsync({ email, role: inviteRole });
                  toast.success(
                    result.status === "provisioned" ? "Usuário adicionado." : "Convite enviado.",
                  );
                  setInviteOpen(false);
                  setEmail("");
                } catch {
                  toast.error(
                    "Não foi possível enviar o convite. Verifique o e-mail e as permissões.",
                  );
                }
              }}
            >
              {settings.invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração de acesso</DialogTitle>
            <DialogDescription>
              Informe o motivo. A ação e a justificativa serão registradas na auditoria.
            </DialogDescription>
          </DialogHeader>
          <Field label="Justificativa">
            <Textarea
              value={reason}
              maxLength={1000}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mínimo de 10 caracteres"
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button
              variant={
                action?.kind === "remove" || action?.kind === "revoke" ? "destructive" : "default"
              }
              onClick={() => void submitAction()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && " *"}
      </Label>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-40 items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
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
