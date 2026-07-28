import { useEffect, useState } from "react";
import { ExternalLink, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useManageableOrganizations } from "@/features/organization-settings/hooks/useOrganizationSettings";
import { useOrganizationPublicPage } from "../hooks/useOrganizationPublicPage";
import type {
  OrganizationPublicPageInput,
  OrganizationSocialNetwork,
} from "../types/organization-public-page.types";
import {
  normalizeOrganizationSlug,
  validateOrganizationPublicPage,
} from "../utils/organization-public-page-validation";

const emptyForm: OrganizationPublicPageInput = {
  slug: "",
  headline: "",
  description: "",
  social_links: {},
  show_contact_email: false,
  show_contact_phone: false,
};

const networks: Array<{ key: OrganizationSocialNetwork; label: string }> = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
];

export function OrganizationPublicPageSettings() {
  const organizations = useManageableOrganizations();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const page = useOrganizationPublicPage(organizationId);
  const [form, setForm] = useState<OrganizationPublicPageInput>(emptyForm);

  useEffect(() => {
    if (!organizationId && organizations.data?.length) {
      setOrganizationId(organizations.data[0].id);
    }
  }, [organizationId, organizations.data]);

  useEffect(() => {
    if (!page.data) return;
    setForm({
      slug: page.data.slug,
      headline: page.data.headline ?? "",
      description: page.data.description ?? "",
      social_links: page.data.social_links,
      show_contact_email: page.data.show_contact_email,
      show_contact_phone: page.data.show_contact_phone,
    });
  }, [page.data]);

  if (organizations.isLoading) return <Loading />;
  if (organizations.isError || !organizations.data?.length) {
    return (
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Acesso administrativo necessário</AlertTitle>
        <AlertDescription>
          Apenas proprietários e administradores podem configurar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const update = <K extends keyof OrganizationPublicPageInput>(
    field: K,
    value: OrganizationPublicPageInput[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const save = async () => {
    const normalized = { ...form, slug: normalizeOrganizationSlug(form.slug) };
    const validationError = validateOrganizationPublicPage(normalized);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      await page.save.mutateAsync(normalized);
      toast.success("Configuração pública salva com auditoria.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("duplicate_slug")
          ? "Este endereço público já está em uso."
          : "Não foi possível salvar a página pública.",
      );
    }
  };

  const changePublicationStatus = async () => {
    if (!page.data) return;
    const shouldPublish = !page.data.is_public;
    try {
      if (shouldPublish) {
        const normalized = { ...form, slug: normalizeOrganizationSlug(form.slug) };
        const validationError = validateOrganizationPublicPage(normalized);
        if (validationError) {
          toast.error(validationError);
          return;
        }
        await page.save.mutateAsync(normalized);
      }
      await page.setPublished.mutateAsync(shouldPublish);
      toast.success(shouldPublish ? "Página publicada." : "Página retirada do ar.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("duplicate_slug")
          ? "Este endereço público já está em uso."
          : "Salve uma descrição com pelo menos 20 caracteres antes de publicar.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="max-w-md space-y-2">
        <Label htmlFor="public-organization-selector">Organização</Label>
        <select
          id="public-organization-selector"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={organizationId ?? ""}
          onChange={(event) => setOrganizationId(event.target.value)}
        >
          {organizations.data.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </div>

      {page.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar a página pública</AlertTitle>
          <AlertDescription>
            Confirme se a migration desta etapa foi aplicada e tente novamente.
          </AlertDescription>
        </Alert>
      ) : page.isLoading || !page.data ? (
        <Loading />
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe2 className="h-5 w-5" /> Página pública da organização
                </CardTitle>
                <CardDescription>
                  Perfil institucional separado dos portais de campeonato.
                </CardDescription>
              </div>
              <Badge variant={page.data.is_public ? "default" : "secondary"}>
                {page.data.is_public ? "Publicada" : "Rascunho"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Endereço público">
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      /o/
                    </span>
                    <Input
                      className="rounded-l-none"
                      value={form.slug}
                      maxLength={80}
                      onChange={(event) => update("slug", event.target.value)}
                      onBlur={() => update("slug", normalizeOrganizationSlug(form.slug))}
                    />
                  </div>
                </Field>
                <Field label="Título">
                  <Input
                    value={form.headline ?? ""}
                    maxLength={160}
                    placeholder={page.data.organization_name}
                    onChange={(event) => update("headline", event.target.value)}
                  />
                </Field>
              </div>

              <Field label="Apresentação">
                <Textarea
                  value={form.description ?? ""}
                  maxLength={2000}
                  rows={6}
                  placeholder="Conte a história da organização, sua atuação e seus campeonatos."
                  onChange={(event) => update("description", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Pelo menos 20 caracteres são necessários para publicar.
                </p>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                {networks.map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={form.social_links[key] ?? ""}
                      onChange={(event) =>
                        update("social_links", {
                          ...form.social_links,
                          [key]: event.target.value || undefined,
                        })
                      }
                    />
                  </Field>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <VisibilitySwitch
                  label="Exibir e-mail institucional"
                  checked={form.show_contact_email}
                  onCheckedChange={(checked) => update("show_contact_email", checked)}
                />
                <VisibilitySwitch
                  label="Exibir telefone institucional"
                  checked={form.show_contact_phone}
                  onCheckedChange={(checked) => update("show_contact_phone", checked)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button disabled={page.save.isPending} onClick={() => void save()}>
                  {page.save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar rascunho
                </Button>
                {page.data.is_public && (
                  <Button variant="outline" asChild>
                    <a href={`/o/${page.data.slug}`} target="_blank" rel="noreferrer">
                      Visualizar <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button
                  variant={page.data.is_public ? "destructive" : "default"}
                  disabled={page.save.isPending || page.setPublished.isPending}
                  onClick={() => void changePublicationStatus()}
                >
                  {page.setPublished.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {page.data.is_public ? "Retirar do ar" : "Publicar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Privacidade por padrão</AlertTitle>
            <AlertDescription>
              E-mail e telefone só aparecem quando autorizados. A página lista apenas campeonatos já
              publicados e nunca expõe dados de membros, atletas ou assinatura.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
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

function VisibilitySwitch({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
