import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { teamSchema, type TeamFormValues } from "../schemas/team.schema";
import type { Team, TeamInput } from "../types/team.types";
import { slugifyTeamName } from "../utils/team-utils";

const textFields = [
  ["short_name", "Nome curto", "Ex.: Real Unidos"],
  ["abbreviation", "Sigla", "Ex.: REU"],
  ["slug", "Slug", "real-unidos"],
  ["city", "Cidade", "Cidade"],
  ["state", "UF", "SP"],
  ["neighborhood", "Bairro", "Bairro"],
  ["category", "Categoria", "Adulto"],
  ["gender", "Gênero", "Masculino, feminino ou misto"],
  ["registration_number", "Número de inscrição", "Identificador interno"],
  ["phone", "Telefone", "(00) 0000-0000"],
  ["whatsapp", "WhatsApp", "(00) 00000-0000"],
  ["email", "E-mail", "equipe@exemplo.com"],
  ["instagram", "Instagram", "@equipe"],
  ["facebook", "Facebook", "Perfil ou página"],
  ["website", "Site", "https://exemplo.com"],
  ["crest_url", "URL do escudo", "https://..."],
  ["cover_url", "URL da capa", "https://..."],
] as const;

function defaults(team?: Team): TeamFormValues {
  return {
    name: team?.name ?? "",
    short_name: team?.short_name ?? "",
    abbreviation: team?.abbreviation ?? "",
    slug: team?.slug ?? "",
    crest_url: team?.crest_url ?? "",
    cover_url: team?.cover_url ?? "",
    primary_color: team?.primary_color ?? "",
    secondary_color: team?.secondary_color ?? "",
    city: team?.city ?? "",
    state: team?.state ?? "",
    neighborhood: team?.neighborhood ?? "",
    foundation_year: team?.foundation_year ?? "",
    category: team?.category ?? "",
    gender: team?.gender ?? "",
    description: team?.description ?? "",
    history: team?.history ?? "",
    phone: team?.phone ?? "",
    whatsapp: team?.whatsapp ?? "",
    email: team?.email ?? "",
    instagram: team?.instagram ?? "",
    facebook: team?.facebook ?? "",
    website: team?.website ?? "",
    registration_number: team?.registration_number ?? "",
    internal_notes: team?.internal_notes ?? "",
  };
}

export function TeamForm({
  team,
  pending,
  onSubmit,
  onCancel,
}: {
  team?: Team;
  pending: boolean;
  onSubmit: (input: TeamInput) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaults(team),
  });
  const submit = async (values: TeamFormValues) => {
    const input: TeamInput = {
      ...values,
      slug: values.slug || slugifyTeamName(values.name),
      foundation_year: values.foundation_year === "" ? undefined : Number(values.foundation_year),
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
      <FormSection title="Identidade" description="Dados essenciais e identidade visual da equipe.">
        <Field label="Nome" error={form.formState.errors.name?.message} wide>
          <Input {...form.register("name")} placeholder="Nome oficial da equipe" autoFocus />
        </Field>
        {textFields.slice(0, 3).map(([name, label, placeholder]) => (
          <Field key={name} label={label} error={form.formState.errors[name]?.message}>
            <Input {...form.register(name)} placeholder={placeholder} />
          </Field>
        ))}
        <Field label="Cor principal" error={form.formState.errors.primary_color?.message}>
          <Input {...form.register("primary_color")} placeholder="#B6FF00" />
        </Field>
        <Field label="Cor secundária" error={form.formState.errors.secondary_color?.message}>
          <Input {...form.register("secondary_color")} placeholder="#111827" />
        </Field>
        {textFields.slice(15).map(([name, label, placeholder]) => (
          <Field key={name} label={label} error={form.formState.errors[name]?.message}>
            <Input {...form.register(name)} placeholder={placeholder} />
          </Field>
        ))}
      </FormSection>

      <FormSection
        title="Localização e perfil"
        description="Informações esportivas e geográficas opcionais."
      >
        {textFields.slice(3, 8).map(([name, label, placeholder]) => (
          <Field key={name} label={label} error={form.formState.errors[name]?.message}>
            <Input
              {...form.register(name)}
              placeholder={placeholder}
              maxLength={name === "state" ? 2 : undefined}
            />
          </Field>
        ))}
        <Field label="Ano de fundação" error={form.formState.errors.foundation_year?.message}>
          <Input
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            {...form.register("foundation_year")}
          />
        </Field>
        <Field label="Descrição" error={form.formState.errors.description?.message} wide>
          <Textarea
            rows={3}
            {...form.register("description")}
            placeholder="Apresentação curta da equipe"
          />
        </Field>
        <Field label="História" error={form.formState.errors.history?.message} wide>
          <Textarea rows={4} {...form.register("history")} placeholder="História e conquistas" />
        </Field>
      </FormSection>

      <FormSection
        title="Contato e administração"
        description="Canais de contato e dados visíveis apenas na administração."
      >
        {textFields.slice(8, 15).map(([name, label, placeholder]) => (
          <Field key={name} label={label} error={form.formState.errors[name]?.message}>
            <Input
              type={name === "email" ? "email" : name === "website" ? "url" : "text"}
              {...form.register(name)}
              placeholder={placeholder}
            />
          </Field>
        ))}
        <Field
          label="Observações internas"
          error={form.formState.errors.internal_notes?.message}
          wide
        >
          <Textarea
            rows={3}
            {...form.register("internal_notes")}
            placeholder="Não exibidas publicamente"
          />
        </Field>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : team ? "Salvar alterações" : "Cadastrar equipe"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-arena p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold">{title}</h2>
      <p className="mt-1 text-[10px] text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label>{label}</Label>
      {children}
      {error && (
        <p className="text-[10px] text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
