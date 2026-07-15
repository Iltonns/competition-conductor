import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { teamSchema, type TeamFormValues } from "../schemas/team.schema";
import { uploadTeamImage } from "../services/team-media.service";
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
  const [crestFile, setCrestFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [crestPreview, setCrestPreview] = useState(team?.crest_url ?? "");
  const [coverPreview, setCoverPreview] = useState(team?.cover_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (crestPreview.startsWith("blob:")) URL.revokeObjectURL(crestPreview);
      if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview, crestPreview]);

  const selectImage = (
    file: File | undefined,
    setFile: (file: File | null) => void,
    setPreview: (url: string) => void,
  ) => {
    if (!file) return;
    setUploadError(null);
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (values: TeamFormValues) => {
    setUploading(true);
    setUploadError(null);
    try {
      const [crestUrl, coverUrl] = await Promise.all([
        crestFile ? uploadTeamImage(crestFile, "crest") : Promise.resolve(values.crest_url),
        coverFile ? uploadTeamImage(coverFile, "cover") : Promise.resolve(values.cover_url),
      ]);
      const input: TeamInput = {
        ...values,
        crest_url: crestUrl,
        cover_url: coverUrl,
        slug: values.slug || slugifyTeamName(values.name),
        foundation_year: values.foundation_year === "" ? undefined : Number(values.foundation_year),
      };
      await onSubmit(input);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const isPending = pending || uploading;

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
        <ImageField
          label="Escudo"
          kind="crest"
          preview={crestPreview}
          onSelect={(file) => selectImage(file, setCrestFile, setCrestPreview)}
          onClear={() => {
            setCrestFile(null);
            setCrestPreview("");
            form.setValue("crest_url", "");
          }}
        />
        <ImageField
          label="Capa"
          kind="cover"
          preview={coverPreview}
          onSelect={(file) => selectImage(file, setCoverFile, setCoverPreview)}
          onClear={() => {
            setCoverFile(null);
            setCoverPreview("");
            form.setValue("cover_url", "");
          }}
        />
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
        <Field label="História" error={form.formState.errors.history?.message} wide>
          <Textarea rows={4} {...form.register("history")} placeholder="História e conquistas" />
        </Field>
      </FormSection>

      {uploadError && (
        <p
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          {uploadError}
        </p>
      )}

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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {uploading
            ? "Enviando imagens..."
            : pending
              ? "Salvando..."
              : team
                ? "Salvar alterações"
                : "Cadastrar equipe"}
        </Button>
      </div>
    </form>
  );
}

function ImageField({
  label,
  kind,
  preview,
  onSelect,
  onClear,
}: {
  label: string;
  kind: "crest" | "cover";
  preview: string;
  onSelect: (file?: File) => void;
  onClear: () => void;
}) {
  const id = useId();
  return (
    <div className={kind === "cover" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={
          kind === "cover"
            ? "relative h-32 overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]"
            : "relative h-32 max-w-40 overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03]"
        }
      >
        {preview ? (
          <img
            src={preview}
            alt={`Prévia de ${label.toLowerCase()}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImagePlus className="h-7 w-7" />
          </div>
        )}
        {preview && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={onClear}
            aria-label={`Remover ${label.toLowerCase()}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={(event) => onSelect(event.target.files?.[0])}
        className="file:mr-3 file:border-0 file:bg-transparent file:text-xs"
      />
      <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP ou HEIC, até 5 MB.</p>
    </div>
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
