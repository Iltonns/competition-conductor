import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  LogOut,
  Menu,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { IsArenaLogo } from "@/components/is-arena-logo";
import {
  endTeamRegistrationSession,
  getTeamRegistrationDraft,
  saveTeamRegistrationSection,
  submitTeamRegistration,
  uploadTeamRegistrationFile,
} from "../api/team-registration.functions";
import type { PublicTeamAccess, TeamAccessPermissionKey } from "../types/team-access.types";
import type {
  RegistrationAthlete,
  RegistrationDocument,
  RegistrationPerson,
  RegistrationStepId,
  TeamRegistrationDraft,
  TeamRegistrationPayload,
} from "../types/team-registration.types";

const steps: { id: RegistrationStepId; label: string; short: string; icon: typeof ShieldCheck }[] =
  [
    { id: "team", label: "Dados da equipe", short: "Equipe", icon: ShieldCheck },
    {
      id: "responsibles",
      label: "Dirigentes e responsáveis",
      short: "Dirigentes",
      icon: UserRound,
    },
    { id: "staff", label: "Comissão técnica", short: "Comissão", icon: Users },
    { id: "athletes", label: "Atletas", short: "Atletas", icon: Users },
    { id: "documents", label: "Documentos", short: "Docs", icon: FileText },
    { id: "review", label: "Revisão e envio", short: "Revisão", icon: Send },
  ];

const permissionFor: Partial<Record<RegistrationStepId, TeamAccessPermissionKey>> = {
  team: "edit_team_details",
  responsibles: "edit_responsibles",
  staff: "edit_staff",
  athletes: "edit_athletes",
  documents: "add_documents",
  review: "submit_for_review",
};

function initialStep(): RegistrationStepId {
  if (typeof window === "undefined") return "team";
  const value = window.location.hash.replace("#", "") as RegistrationStepId;
  return steps.some((step) => step.id === value) ? value : "team";
}

export function TeamRegistrationPortal({ access }: { access: PublicTeamAccess }) {
  const query = useQuery({
    queryKey: ["team-registration-draft"],
    queryFn: () => getTeamRegistrationDraft(),
    staleTime: 0,
    retry: false,
  });
  const [draft, setDraft] = useState<TeamRegistrationDraft | null>(null);
  const [active, setActive] = useState<RegistrationStepId>(initialStep);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);
  useEffect(() => {
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${active}`);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const saveMutation = useMutation({
    mutationFn: async ({
      section,
      complete,
    }: {
      section: Exclude<RegistrationStepId, "review">;
      complete: boolean;
    }) => {
      if (!draft) throw new Error("Rascunho indisponível");
      return saveTeamRegistrationSection({
        data: { section, value: draft.payload[section], markComplete: complete },
      });
    },
    onSuccess: (saved) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              version: saved.version,
              updatedAt: saved.updatedAt,
              completedSteps: saved.completedSteps as RegistrationStepId[],
            }
          : current,
      );
      toast.success("Rascunho salvo com segurança.");
    },
    onError: () => toast.error("Não foi possível salvar o rascunho."),
  });
  const submitMutation = useMutation({
    mutationFn: () => submitTeamRegistration(),
    onSuccess: ({ submittedAt }) => {
      setDraft((current) => (current ? { ...current, status: "submitted", submittedAt } : current));
      toast.success("Cadastro enviado para análise.");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message.includes("incomplete")
          ? "Conclua todas as etapas antes do envio."
          : "Não foi possível enviar o cadastro.",
      ),
  });
  const logout = useMutation({
    mutationFn: () => endTeamRegistrationSession(),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  if (query.isLoading || !draft) return <PortalLoading />;
  if (query.error) return <PortalError onRetry={() => query.refetch()} />;
  const locked = draft.status === "submitted" || draft.status === "approved";
  const permission = permissionFor[active];
  const stagePermission =
    active === "athletes"
      ? access.permissions.add_athletes ||
        access.permissions.edit_athletes ||
        access.permissions.remove_athletes
      : !permission || access.permissions[permission];
  const canEdit = !locked && stagePermission;
  const completedCount = draft.completedSteps.length;
  const progress = Math.round((completedCount / 5) * 100);
  const index = steps.findIndex((step) => step.id === active);
  const pending = steps.slice(0, 5).filter((step) => !draft.completedSteps.includes(step.id));
  const setPayload = (payload: TeamRegistrationPayload) => setDraft({ ...draft, payload });
  const go = (offset: number) =>
    setActive(steps[Math.max(0, Math.min(steps.length - 1, index + offset))].id);
  const saveCurrent = (complete = false) =>
    active !== "review" && saveMutation.mutate({ section: active, complete });

  return (
    <div className="min-h-dvh overflow-x-clip bg-arena text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/90 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-[120rem] items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir etapas"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <IsArenaLogo size={30} className="hidden sm:flex" />
          <div className="min-w-0 flex-1 border-l-0 sm:border-l sm:border-white/10 sm:pl-4">
            <p className="truncate text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {access.championshipName}
            </p>
            <div className="flex min-w-0 items-center gap-2">
              <strong className="truncate text-sm">{access.teamName}</strong>
              <Status status={draft.status} />
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <Clock3 className="h-4 w-4 text-neon" />
            <span>Acesso até {formatDate(access.expiresAt)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Encerrar</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[120rem] lg:grid-cols-[15rem_minmax(0,1fr)] 2xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
        <aside className="sticky top-[65px] hidden h-[calc(100dvh-65px)] border-r border-white/[0.07] p-4 lg:block">
          <StepNavigation active={active} completed={draft.completedSteps} onSelect={setActive} />
        </aside>
        <main className="min-w-0 px-3 pb-28 pt-4 sm:px-5 lg:px-7 lg:pb-10 lg:pt-6 xl:px-10">
          <CompactStepper active={active} completed={draft.completedSteps} onSelect={setActive} />
          <div className="mx-auto max-w-5xl">
            <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-label-strong text-neon">Etapa {index + 1} de 6</p>
                <h1 className="mt-1 text-page-title">{steps[index].label}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {stepDescription(active)}
                </p>
              </div>
              <Button
                variant="outline"
                className="hidden shrink-0 lg:flex"
                onClick={() => saveCurrent(false)}
                disabled={active === "review" || !canEdit || saveMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar rascunho"}
              </Button>
            </section>

            {!canEdit && active !== "review" && (
              <Notice
                text={
                  locked
                    ? "O cadastro foi enviado e está bloqueado para edição."
                    : "Este acesso permite consultar esta etapa, mas não alterá-la."
                }
              />
            )}
            {active === "team" && (
              <TeamFields
                value={draft.payload.team}
                disabled={!canEdit}
                onChange={(team) => setPayload({ ...draft.payload, team })}
              />
            )}
            {active === "responsibles" && (
              <PeopleEditor
                title="Dirigentes e responsáveis"
                items={draft.payload.responsibles}
                disabled={!canEdit}
                primary
                onChange={(responsibles) => setPayload({ ...draft.payload, responsibles })}
              />
            )}
            {active === "staff" && (
              <PeopleEditor
                title="Comissão técnica"
                items={draft.payload.staff}
                disabled={!canEdit}
                onChange={(staff) => setPayload({ ...draft.payload, staff })}
              />
            )}
            {active === "athletes" && (
              <AthletesEditor
                items={draft.payload.athletes}
                disabled={!canEdit}
                onChange={(athletes) => setPayload({ ...draft.payload, athletes })}
              />
            )}
            {active === "documents" && (
              <DocumentsEditor
                items={draft.payload.documents}
                disabled={!canEdit}
                onChange={(documents) => setPayload({ ...draft.payload, documents })}
              />
            )}
            {active === "review" && (
              <Review
                draft={draft}
                access={access}
                onStep={setActive}
                onSubmit={() => submitMutation.mutate()}
                submitting={submitMutation.isPending}
              />
            )}

            <nav
              className="mt-6 hidden items-center justify-between border-t border-white/10 pt-5 lg:flex"
              aria-label="Navegação entre etapas"
            >
              <Button variant="outline" onClick={() => go(-1)} disabled={index === 0}>
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {active !== "review" ? (
                <Button
                  onClick={() => {
                    saveCurrent(true);
                    go(1);
                  }}
                  disabled={!canEdit || saveMutation.isPending}
                >
                  Salvar e continuar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </nav>
          </div>
        </main>
        <aside className="sticky top-[65px] hidden h-[calc(100dvh-65px)] border-l border-white/[0.07] p-5 2xl:block">
          <ProgressPanel
            progress={progress}
            completed={completedCount}
            pending={pending}
            onStep={setActive}
          />
        </aside>
      </div>

      <button
        className="fixed bottom-20 right-3 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-card px-3 py-2 text-xs shadow-elevated 2xl:hidden"
        onClick={() => setPendingOpen((value) => !value)}
      >
        <AlertCircle className="h-4 w-4 text-warning" />
        {pending.length} pendência(s)
      </button>
      {pendingOpen && (
        <div className="fixed inset-x-3 bottom-32 z-40 ml-auto max-w-sm card-arena p-4 2xl:hidden">
          <div className="flex items-center justify-between">
            <strong className="text-sm">Progresso e pendências</strong>
            <Button size="icon" variant="ghost" onClick={() => setPendingOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ProgressPanel
            progress={progress}
            completed={completedCount}
            pending={pending}
            onStep={(step) => {
              setActive(step);
              setPendingOpen(false);
            }}
          />
        </div>
      )}
      <MobileActions
        index={index}
        active={active}
        canEdit={canEdit}
        saving={saveMutation.isPending}
        onBack={() => go(-1)}
        onSave={() => saveCurrent(false)}
        onNext={() => {
          saveCurrent(true);
          go(1);
        }}
      />
      {menuOpen && (
        <MobileMenu
          active={active}
          completed={draft.completedSteps}
          onClose={() => setMenuOpen(false)}
          onSelect={setActive}
        />
      )}
    </div>
  );
}

function StepNavigation({
  active,
  completed,
  onSelect,
}: {
  active: RegistrationStepId;
  completed: RegistrationStepId[];
  onSelect: (id: RegistrationStepId) => void;
}) {
  return (
    <nav aria-label="Etapas do cadastro">
      <p className="mb-3 px-2 text-label-strong text-muted-foreground">Cadastro da equipe</p>
      <div className="space-y-1">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const done = completed.includes(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onSelect(step.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs transition ${active === step.id ? "bg-neon text-neon-foreground" : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${active === step.id ? "border-black/20" : done ? "border-neon/40 text-neon" : "border-white/10"}`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span>
                <span className="block text-[9px] opacity-70">0{index + 1}</span>
                <strong className="font-semibold">{step.label}</strong>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function CompactStepper(props: Parameters<typeof StepNavigation>[0]) {
  return (
    <div
      className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden compact-scrollbar"
      aria-label="Etapas do cadastro"
    >
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => props.onSelect(step.id)}
          className={`flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-[11px] ${props.active === step.id ? "border-neon/50 bg-neon-soft text-neon" : "border-white/10 text-muted-foreground"}`}
        >
          <span>{props.completed.includes(step.id) ? "✓" : index + 1}</span>
          {step.short}
        </button>
      ))}
    </div>
  );
}

function TeamFields({
  value,
  disabled,
  onChange,
}: {
  value: TeamRegistrationPayload["team"];
  disabled: boolean;
  onChange: (value: TeamRegistrationPayload["team"]) => void;
}) {
  const field = (key: keyof typeof value, label: string, type = "text") => (
    <Field label={label}>
      <Input
        type={type}
        value={value[key]}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      />
    </Field>
  );
  return (
    <div className="space-y-4">
      <FormCard title="Identidade" subtitle="Informações oficiais e identidade visual da equipe">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="sm:col-span-2 xl:col-span-2">{field("name", "Nome oficial")}</div>
          {field("shortName", "Nome curto")}
          {field("abbreviation", "Sigla")}
          {field("category", "Categoria")}
          {field("gender", "Gênero")}
          {field("foundationYear", "Ano de fundação", "number")}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ImageInput
            label="Escudo"
            value={value.crestUrl}
            disabled={disabled}
            onChange={(crestUrl) => onChange({ ...value, crestUrl })}
          />
          <ImageInput
            label="Imagem de capa"
            value={value.coverUrl}
            disabled={disabled}
            onChange={(coverUrl) => onChange({ ...value, coverUrl })}
          />
        </div>
      </FormCard>
      <FormCard
        title="Localização e contato"
        subtitle="Canais usados pela organização do campeonato"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {field("city", "Cidade")}
          {field("state", "UF")}
          {field("neighborhood", "Bairro")}
          {field("phone", "Telefone", "tel")}
          {field("whatsapp", "WhatsApp", "tel")}
          {field("email", "E-mail", "email")}
          {field("instagram", "Instagram")}
        </div>
      </FormCard>
    </div>
  );
}

function ImageInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 10_485_760) {
      toast.error("A imagem deve ter no máximo 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadTeamRegistrationFile({
        data: {
          name: file.name,
          mimeType: file.type as "image/jpeg",
          base64: await fileBase64(file),
        },
      });
      onChange(uploaded.path);
      toast.success(`${label} enviado com segurança.`);
    } catch {
      toast.error(`Não foi possível enviar ${label.toLowerCase()}.`);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <label
        className={`flex min-h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center ${disabled ? "pointer-events-none opacity-50" : "hover:border-neon/40"}`}
      >
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled || uploading}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
          }}
        />
        <span className="text-xs text-muted-foreground">
          <Upload className="mx-auto mb-2 h-5 w-5 text-neon" />
          {value ? `Selecionado: ${value.split("/").pop()}` : "Câmera, galeria ou arquivo"}
        </span>
      </label>
    </div>
  );
}

function PeopleEditor({
  title,
  items,
  disabled,
  primary,
  onChange,
}: {
  title: string;
  items: RegistrationPerson[];
  disabled: boolean;
  primary?: boolean;
  onChange: (items: RegistrationPerson[]) => void;
}) {
  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), fullName: "", role: "", phone: "", email: "", isPrimary: false },
    ]);
  return (
    <FormCard
      title={title}
      subtitle="Adicione e atualize os contatos sem perder o rascunho"
      action={
        <Button size="sm" onClick={add} disabled={disabled}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((person, index) => (
          <PersonCard
            key={person.id}
            person={person}
            disabled={disabled}
            primary={primary}
            onChange={(person) =>
              onChange(items.map((item, position) => (position === index ? person : item)))
            }
            onRemove={() => onChange(items.filter((_, position) => position !== index))}
          />
        ))}
        {!items.length && <Empty text="Nenhum cadastro nesta etapa." />}
      </div>
    </FormCard>
  );
}

function PersonCard({
  person,
  disabled,
  primary,
  onChange,
  onRemove,
}: {
  person: RegistrationPerson;
  disabled: boolean;
  primary?: boolean;
  onChange: (person: RegistrationPerson) => void;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-neon-soft text-neon">
          <UserRound className="h-4 w-4" />
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome completo">
          <Input
            value={person.fullName}
            disabled={disabled}
            onChange={(e) => onChange({ ...person, fullName: e.target.value })}
          />
        </Field>
        <Field label="Função">
          <Input
            value={person.role}
            disabled={disabled}
            onChange={(e) => onChange({ ...person, role: e.target.value })}
          />
        </Field>
        <Field label="Telefone">
          <Input
            type="tel"
            value={person.phone}
            disabled={disabled}
            onChange={(e) => onChange({ ...person, phone: e.target.value })}
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            value={person.email}
            disabled={disabled}
            onChange={(e) => onChange({ ...person, email: e.target.value })}
          />
        </Field>
      </div>
      {primary && (
        <label className="mt-3 flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={person.isPrimary}
            disabled={disabled}
            onChange={(e) => onChange({ ...person, isPrimary: e.target.checked })}
          />
          Responsável principal
        </label>
      )}
    </article>
  );
}

function AthletesEditor({
  items,
  disabled,
  onChange,
}: {
  items: RegistrationAthlete[];
  disabled: boolean;
  onChange: (items: RegistrationAthlete[]) => void;
}) {
  const add = () =>
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        fullName: "",
        birthDate: "",
        documentNumber: "",
        position: "",
        shirtNumber: "",
        isCaptain: false,
        isGoalkeeper: false,
      },
    ]);
  return (
    <FormCard
      title="Atletas"
      subtitle={`${items.length} atleta(s) no rascunho`}
      action={
        <Button size="sm" onClick={add} disabled={disabled}>
          <Plus className="h-4 w-4" />
          Adicionar atleta
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((athlete, index) => (
          <article key={athlete.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-neon-soft font-bold text-neon">
                {athlete.shirtNumber || <UserRound className="h-4 w-4" />}
              </span>
              <Button
                size="icon"
                variant="ghost"
                disabled={disabled}
                onClick={() => onChange(items.filter((_, position) => position !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  value={athlete.fullName}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      items.map((item, position) =>
                        position === index ? { ...item, fullName: e.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Nascimento">
                <Input
                  type="date"
                  value={athlete.birthDate}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      items.map((item, position) =>
                        position === index ? { ...item, birthDate: e.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Documento">
                <Input
                  value={athlete.documentNumber}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      items.map((item, position) =>
                        position === index ? { ...item, documentNumber: e.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Posição">
                <Input
                  value={athlete.position}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      items.map((item, position) =>
                        position === index ? { ...item, position: e.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Camisa">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={athlete.shirtNumber}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      items.map((item, position) =>
                        position === index ? { ...item, shirtNumber: e.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <div className="flex flex-wrap items-end gap-3 pb-2 text-xs">
                <label>
                  <input
                    type="checkbox"
                    checked={athlete.isCaptain}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(
                        items.map((item, position) =>
                          position === index ? { ...item, isCaptain: e.target.checked } : item,
                        ),
                      )
                    }
                  />{" "}
                  Capitão
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={athlete.isGoalkeeper}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(
                        items.map((item, position) =>
                          position === index ? { ...item, isGoalkeeper: e.target.checked } : item,
                        ),
                      )
                    }
                  />{" "}
                  Goleiro
                </label>
              </div>
            </div>
          </article>
        ))}
        {!items.length && <Empty text="Nenhum atleta cadastrado." />}
      </div>
    </FormCard>
  );
}

function DocumentsEditor({
  items,
  disabled,
  onChange,
}: {
  items: RegistrationDocument[];
  disabled: boolean;
  onChange: (items: RegistrationDocument[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 10_485_760) return toast.error("O arquivo deve ter no máximo 10 MB.");
    setUploading(true);
    try {
      const base64 = await fileBase64(file);
      const uploaded = await uploadTeamRegistrationFile({
        data: { name: file.name, mimeType: file.type as "application/pdf", base64 },
      });
      onChange([
        ...items,
        { id: crypto.randomUUID(), name: file.name, mimeType: file.type, ...uploaded },
      ]);
      toast.success("Arquivo enviado.");
    } catch {
      toast.error("Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <FormCard title="Imagens e documentos" subtitle="PDF, JPG, PNG, WebP ou HEIC, até 10 MB">
      <label
        className={`grid min-h-40 cursor-pointer place-items-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-center ${disabled ? "pointer-events-none opacity-50" : "hover:border-neon/40"}`}
      >
        <input
          className="sr-only"
          type="file"
          accept="application/pdf,image/*"
          capture="environment"
          disabled={disabled || uploading}
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <span>
          <Upload className="mx-auto mb-3 h-7 w-7 text-neon" />
          <strong className="text-sm">{uploading ? "Enviando..." : "Enviar documento"}</strong>
          <span className="mt-1 block text-xs text-muted-foreground">
            Use câmera, galeria ou seletor de arquivos
          </span>
        </span>
      </label>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((document) => (
          <div
            key={document.id}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 p-3"
          >
            <FileText className="h-5 w-5 shrink-0 text-neon" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-xs">{document.name}</strong>
              <span className="text-[10px] text-muted-foreground">
                {Math.ceil(document.size / 1024)} KB
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              disabled={disabled}
              onClick={() => onChange(items.filter((item) => item.id !== document.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </FormCard>
  );
}

function Review({
  draft,
  access,
  onStep,
  onSubmit,
  submitting,
}: {
  draft: TeamRegistrationDraft;
  access: PublicTeamAccess;
  onStep: (id: RegistrationStepId) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const allDone = steps.slice(0, 5).every((step) => draft.completedSteps.includes(step.id));
  return (
    <div className="space-y-4">
      <FormCard title="Resumo do cadastro" subtitle="Confira todas as informações antes do envio">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {steps.slice(0, 5).map((step) => {
            const done = draft.completedSteps.includes(step.id);
            return (
              <button
                key={step.id}
                onClick={() => onStep(step.id)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-4 text-left"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full ${done ? "bg-neon-soft text-neon" : "bg-warning/10 text-warning"}`}
                >
                  {done ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </span>
                <span>
                  <strong className="block text-xs">{step.label}</strong>
                  <span className="text-[10px] text-muted-foreground">
                    {done ? "Concluída" : "Pendente — revisar"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </FormCard>
      <FormCard
        title="Envio para análise"
        subtitle={`${access.championshipName} · ${access.teamName}`}
      >
        {draft.status === "submitted" ? (
          <div className="rounded-xl border border-neon/20 bg-neon-soft p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-neon" />
            <strong className="mt-3 block">Cadastro enviado</strong>
            <p className="mt-1 text-xs text-muted-foreground">
              A organização analisará os dados enviados.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/15 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong className="text-sm">Tudo pronto para enviar?</strong>
              <p className="mt-1 text-xs text-muted-foreground">
                Após o envio, os dados ficam bloqueados até nova solicitação.
              </p>
            </div>
            <Button
              onClick={onSubmit}
              disabled={!allDone || !access.permissions.submit_for_review || submitting}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Enviando..." : "Enviar para análise"}
            </Button>
          </div>
        )}
      </FormCard>
    </div>
  );
}

function ProgressPanel({
  progress,
  completed,
  pending,
  onStep,
}: {
  progress: number;
  completed: number;
  pending: typeof steps;
  onStep: (id: RegistrationStepId) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <strong>Progresso</strong>
          <span className="number-tabular text-neon">{progress}%</span>
        </div>
        <Progress value={progress} />
        <p className="mt-2 text-[10px] text-muted-foreground">
          {completed} de 5 etapas obrigatórias concluídas
        </p>
      </div>
      <div>
        <p className="text-label-strong text-muted-foreground">Pendências</p>
        <div className="mt-2 space-y-2">
          {pending.length ? (
            pending.map((step) => (
              <button
                key={step.id}
                onClick={() => onStep(step.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-warning/15 bg-warning/[0.04] p-2.5 text-left text-[11px]"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warning" />
                {step.label}
              </button>
            ))
          ) : (
            <p className="flex items-center gap-2 text-xs text-neon">
              <CheckCircle2 className="h-4 w-4" />
              Tudo revisado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileActions({
  index,
  active,
  canEdit,
  saving,
  onBack,
  onSave,
  onNext,
}: {
  index: number;
  active: RegistrationStepId;
  canEdit: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
  onNext: () => void;
}) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-[auto_1fr_auto] gap-2 border-t border-white/10 bg-background/95 p-2 backdrop-blur-xl lg:hidden">
      <Button variant="outline" size="icon" onClick={onBack} disabled={index === 0}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {active !== "review" ? (
        <Button variant="outline" onClick={onSave} disabled={!canEdit || saving}>
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      ) : (
        <span />
      )}
      {active !== "review" && (
        <Button size="icon" onClick={onNext} disabled={!canEdit || saving}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function MobileMenu(props: {
  active: RegistrationStepId;
  completed: RegistrationStepId[];
  onClose: () => void;
  onSelect: (id: RegistrationStepId) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={props.onClose}
        aria-label="Fechar menu"
      />
      <aside className="absolute inset-y-0 left-0 w-[min(88vw,20rem)] overflow-y-auto border-r border-white/10 bg-background p-5 shadow-elevated">
        <div className="mb-6 flex items-center justify-between">
          <IsArenaLogo size={30} />
          <Button size="icon" variant="ghost" onClick={props.onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <StepNavigation {...props} />
      </aside>
    </div>
  );
}

function FormCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-arena min-w-0 p-4 sm:p-5 xl:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-bold">{title}</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="col-span-full grid min-h-32 place-items-center rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground">
      {text}
    </div>
  );
}
function Notice({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/20 bg-warning/[0.06] p-3 text-xs">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      {text}
    </div>
  );
}
function Status({ status }: { status: TeamRegistrationDraft["status"] }) {
  const label = {
    draft: "Rascunho",
    submitted: "Em análise",
    changes_requested: "Ajustes solicitados",
    approved: "Aprovado",
  }[status];
  return (
    <span className="shrink-0 rounded-full border border-neon/20 bg-neon-soft px-2 py-0.5 text-[9px] font-semibold text-neon">
      {label}
    </span>
  );
}
function PortalLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-arena">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-neon" />
        <p className="mt-3 text-xs text-muted-foreground">Carregando rascunho seguro...</p>
      </div>
    </main>
  );
}
function PortalError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-arena p-4">
      <section className="card-arena max-w-md p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-warning" />
        <h1 className="mt-3 text-xl font-bold">Não foi possível abrir o cadastro</h1>
        <p className="mt-2 text-sm text-muted-foreground">Verifique a sessão e tente novamente.</p>
        <Button className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}
function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "não informada";
}
function stepDescription(step: RegistrationStepId) {
  return {
    team: "Revise a identidade, localização e os contatos oficiais.",
    responsibles: "Gerencie quem responde administrativamente pela equipe.",
    staff: "Cadastre treinadores e integrantes da comissão.",
    athletes: "Monte o elenco com documentos, posições e numeração.",
    documents: "Anexe imagens e documentos exigidos pelo campeonato.",
    review: "Confira pendências e envie o cadastro para análise.",
  }[step];
}
function fileBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}
