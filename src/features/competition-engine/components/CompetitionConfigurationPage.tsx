import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, LockKeyhole, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompetitionSettings,
  usePublishCompetition,
  useSaveCompetitionSettings,
} from "../hooks/useCompetitionEngine";
import type { CompetitionSettingsInput } from "../types/engine-records.types";
import type { CompetitionFormat, Tiebreaker } from "../types/competition.types";

const TIEBREAKER_LABELS: Record<Tiebreaker, string> = {
  points: "Pontos",
  wins: "Vitórias",
  goal_difference: "Saldo de gols",
  goals_for: "Gols pró",
  head_to_head: "Confronto direto",
  fair_play: "Fair play",
  draw: "Sorteio reproduzível",
};

const DEFAULT_SETTINGS: CompetitionSettingsInput = {
  competition_format: "round_robin",
  legs: 1,
  group_count: null,
  qualifiers_per_group: null,
  third_place_match: false,
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  tiebreakers: [
    "points",
    "wins",
    "goal_difference",
    "goals_for",
    "head_to_head",
    "fair_play",
    "draw",
  ],
  allow_draw: true,
  uses_extra_time: false,
  uses_penalties: true,
  wo_score_for: 3,
  wo_score_against: 0,
  minimum_rest_hours: 24,
  min_athletes_per_team: null,
  max_athletes_per_team: null,
  max_goalkeepers_per_team: null,
  max_staff_per_team: null,
  minimum_athlete_age: null,
  maximum_athlete_age: null,
  registration_starts_at: null,
  registration_ends_at: null,
  require_athlete_document: false,
  require_athlete_photo: false,
  require_shirt_number: true,
  allow_duplicate_shirt_numbers: false,
  allow_athlete_multiple_teams: false,
  allow_roster_changes_after_start: false,
  yellow_cards_for_suspension: 3,
  custom_rules: { text: "" },
};

export function CompetitionConfigurationPage({ championshipId }: { championshipId: string }) {
  const query = useCompetitionSettings(championshipId);
  const save = useSaveCompetitionSettings(championshipId);
  const publish = usePublishCompetition(championshipId);
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [customRules, setCustomRules] = useState("");

  useEffect(() => {
    if (!query.data) return;
    const row = query.data;
    setForm({
      ...DEFAULT_SETTINGS,
      ...row,
      competition_format: row.competition_format as CompetitionFormat,
      legs: row.legs as 1 | 2,
      tiebreakers: row.tiebreakers as Tiebreaker[],
      custom_rules: row.custom_rules,
    });
    const rules = row.custom_rules as { text?: string } | null;
    setCustomRules(rules?.text ?? "");
  }, [query.data]);

  if (query.isLoading) return <Skeleton className="h-[520px]" />;

  const number = (key: keyof CompetitionSettingsInput, value: string, nullable = false) =>
    setForm((current) => ({ ...current, [key]: value === "" && nullable ? null : Number(value) }));
  const toggle = (key: keyof CompetitionSettingsInput) =>
    setForm((current) => ({ ...current, [key]: !current[key] }));
  const moveTiebreaker = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.tiebreakers.length) return;
    const next = [...form.tiebreakers];
    [next[index], next[target]] = [next[target], next[index]];
    setForm((current) => ({ ...current, tiebreakers: next }));
  };

  const handleSave = async () => {
    let exceptionReason: string | undefined;
    try {
      await save.mutateAsync({ settings: { ...form, custom_rules: { text: customRules } } });
      toast.success("Regulamento salvo.");
    } catch (error) {
      if (String((error as { message?: string }).message).includes("locked_settings")) {
        exceptionReason =
          prompt("A competição já começou. Informe a justificativa da alteração excepcional:") ??
          undefined;
        if (!exceptionReason?.trim()) return;
        try {
          await save.mutateAsync({
            settings: { ...form, custom_rules: { text: customRules } },
            exceptionReason,
          });
          toast.success("Alteração excepcional salva e auditada.");
          return;
        } catch {
          /* handled below */
        }
      }
      toast.error("Não foi possível salvar o regulamento.");
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold">Configuração da competição</h2>
          <p className="text-xs text-muted-foreground">
            Regulamento esportivo, inscrições e critérios oficiais.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={save.isPending}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
          <Button
            onClick={async () => {
              if (!confirm("Publicar a competição após validar o checklist mínimo?")) return;
              try {
                await publish.mutateAsync();
                toast.success("Competição publicada.");
              } catch {
                toast.error("Checklist incompleto para publicação.");
              }
            }}
            disabled={publish.isPending}
          >
            <Send className="h-4 w-4" /> Publicar
          </Button>
        </div>
      </header>

      <Section title="Formato e disputa">
        <Field label="Formato">
          <Select
            value={form.competition_format}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, competition_format: value as CompetitionFormat }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Pontos corridos</SelectItem>
              <SelectItem value="groups">Grupos</SelectItem>
              <SelectItem value="knockout">Eliminatória</SelectItem>
              <SelectItem value="groups_knockout">Grupos + eliminatória</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Turnos">
          <Select
            value={String(form.legs)}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, legs: Number(value) as 1 | 2 }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Turno único</SelectItem>
              <SelectItem value="2">Ida e volta</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <NumberField
          label="Grupos"
          value={form.group_count}
          onChange={(value) => number("group_count", value, true)}
        />
        <NumberField
          label="Classificados por grupo"
          value={form.qualifiers_per_group}
          onChange={(value) => number("qualifiers_per_group", value, true)}
        />
        <Check
          label="Disputa de terceiro lugar"
          checked={form.third_place_match}
          onChange={() => toggle("third_place_match")}
        />
        <Check
          label="Permitir empate"
          checked={form.allow_draw}
          onChange={() => toggle("allow_draw")}
        />
        <Check
          label="Prorrogação"
          checked={form.uses_extra_time}
          onChange={() => toggle("uses_extra_time")}
        />
        <Check
          label="Pênaltis"
          checked={form.uses_penalties}
          onChange={() => toggle("uses_penalties")}
        />
      </Section>

      <Section title="Pontuação, WO e disciplina">
        <NumberField
          label="Pontos por vitória"
          value={form.points_win}
          onChange={(value) => number("points_win", value)}
        />
        <NumberField
          label="Pontos por empate"
          value={form.points_draw}
          onChange={(value) => number("points_draw", value)}
        />
        <NumberField
          label="Pontos por derrota"
          value={form.points_loss}
          onChange={(value) => number("points_loss", value)}
        />
        <NumberField
          label="WO vencedor"
          value={form.wo_score_for}
          onChange={(value) => number("wo_score_for", value)}
        />
        <NumberField
          label="WO perdedor"
          value={form.wo_score_against}
          onChange={(value) => number("wo_score_against", value)}
        />
        <NumberField
          label="Descanso mínimo (horas)"
          value={form.minimum_rest_hours}
          onChange={(value) => number("minimum_rest_hours", value)}
        />
        <NumberField
          label="Amarelos para suspensão"
          value={form.yellow_cards_for_suspension}
          onChange={(value) => number("yellow_cards_for_suspension", value)}
        />
        <div className="md:col-span-2">
          <Label>Ordem dos critérios de desempate</Label>
          <div className="mt-2 space-y-1">
            {form.tiebreakers.map((criterion, index) => (
              <div
                key={criterion}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs"
              >
                <span>
                  {index + 1}. {TIEBREAKER_LABELS[criterion]}
                </span>
                <span>
                  <Button variant="ghost" size="icon" onClick={() => moveTiebreaker(index, -1)}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveTiebreaker(index, 1)}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Elenco e inscrições">
        <NumberField
          label="Mínimo de atletas"
          value={form.min_athletes_per_team}
          onChange={(value) => number("min_athletes_per_team", value, true)}
        />
        <NumberField
          label="Máximo de atletas"
          value={form.max_athletes_per_team}
          onChange={(value) => number("max_athletes_per_team", value, true)}
        />
        <NumberField
          label="Máximo de goleiros"
          value={form.max_goalkeepers_per_team}
          onChange={(value) => number("max_goalkeepers_per_team", value, true)}
        />
        <NumberField
          label="Máximo de comissão"
          value={form.max_staff_per_team}
          onChange={(value) => number("max_staff_per_team", value, true)}
        />
        <NumberField
          label="Idade mínima"
          value={form.minimum_athlete_age}
          onChange={(value) => number("minimum_athlete_age", value, true)}
        />
        <NumberField
          label="Idade máxima"
          value={form.maximum_athlete_age}
          onChange={(value) => number("maximum_athlete_age", value, true)}
        />
        <Field label="Início das inscrições">
          <Input
            type="datetime-local"
            value={form.registration_starts_at?.slice(0, 16) ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                registration_starts_at: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              }))
            }
          />
        </Field>
        <Field label="Fim das inscrições">
          <Input
            type="datetime-local"
            value={form.registration_ends_at?.slice(0, 16) ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                registration_ends_at: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              }))
            }
          />
        </Field>
        <Check
          label="Exigir documento"
          checked={form.require_athlete_document}
          onChange={() => toggle("require_athlete_document")}
        />
        <Check
          label="Exigir foto"
          checked={form.require_athlete_photo}
          onChange={() => toggle("require_athlete_photo")}
        />
        <Check
          label="Exigir camisa"
          checked={form.require_shirt_number}
          onChange={() => toggle("require_shirt_number")}
        />
        <Check
          label="Permitir camisa duplicada"
          checked={form.allow_duplicate_shirt_numbers}
          onChange={() => toggle("allow_duplicate_shirt_numbers")}
        />
        <Check
          label="Atleta em múltiplas equipes"
          checked={form.allow_athlete_multiple_teams}
          onChange={() => toggle("allow_athlete_multiple_teams")}
        />
        <Check
          label="Alterar elenco após início"
          checked={form.allow_roster_changes_after_start}
          onChange={() => toggle("allow_roster_changes_after_start")}
        />
      </Section>

      <section className="card-arena p-4">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-amber-300" />
          <h3 className="font-display text-sm font-bold">Regras personalizadas</h3>
        </div>
        <Textarea
          className="mt-3 min-h-28"
          value={customRules}
          onChange={(event) => setCustomRules(event.target.value)}
          placeholder="Regras textuais complementares do regulamento..."
        />
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-arena p-4">
      <h3 className="font-display text-sm font-bold">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-neon" />
      {label}
    </label>
  );
}
