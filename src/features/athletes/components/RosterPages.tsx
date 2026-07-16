import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { athleteSchema } from "../schemas/athlete.schema";
import { useRegisterAthlete, useRoster, useRosterAthlete } from "../hooks/useRoster";

export function RosterPage({ championshipId, teamId }: { championshipId: string; teamId: string }) {
  const query = useRoster(championshipId, teamId);
  if (query.isLoading)
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  if (query.error)
    return (
      <State
        title="Não foi possível carregar o elenco"
        action={<Button onClick={() => query.refetch()}>Tentar novamente</Button>}
      />
    );
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-black">Elenco</h1>
          <p className="text-xs text-muted-foreground">Atletas inscritos nesta participação.</p>
        </div>
        <Button asChild>
          <Link
            to="/championships/$id/teams/$teamId/athletes/new"
            params={{ id: championshipId, teamId }}
          >
            <Plus className="h-4 w-4" />
            Atleta
          </Link>
        </Button>
      </header>
      {query.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((a) => (
            <Link
              key={a.id}
              to="/championships/$id/teams/$teamId/athletes/$athleteId"
              params={{ id: championshipId, teamId, athleteId: a.athlete_id }}
              className="card-arena flex items-center gap-3 p-4 hover:border-neon/30"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon">
                {a.shirt_number ?? <UserRound className="h-5 w-5" />}
              </span>
              <div>
                <strong className="text-sm">{a.full_name}</strong>
                <p className="text-xs text-muted-foreground">
                  {a.position || "Posição não informada"} · {a.registration_status}
                </p>
              </div>
              {a.is_captain && <Shield className="ml-auto h-4 w-4 text-neon" />}
            </Link>
          ))}
        </div>
      ) : (
        <State
          title="Nenhum atleta inscrito"
          action={
            <Button asChild>
              <Link
                to="/championships/$id/teams/$teamId/athletes/new"
                params={{ id: championshipId, teamId }}
              >
                Cadastrar primeiro atleta
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

export function NewAthletePage({
  championshipId,
  teamId,
}: {
  championshipId: string;
  teamId: string;
}) {
  const navigate = useNavigate();
  const mutation = useRegisterAthlete(championshipId, teamId);
  const [values, setValues] = useState({
    full_name: "",
    birth_date: "",
    document_type: "cpf",
    document_number: "",
    shirt_number: "",
    position: "",
    is_goalkeeper: false,
    is_captain: false,
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = athleteSchema.safeParse({
      ...values,
      shirt_number: values.shirt_number ? Number(values.shirt_number) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Atleta inscrito com segurança.");
      await navigate({
        to: "/championships/$id/teams/$teamId/roster",
        params: { id: championshipId, teamId },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar.");
    }
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" asChild>
        <Link to="/championships/$id/teams/$teamId/roster" params={{ id: championshipId, teamId }}>
          <ArrowLeft className="h-4 w-4" />
          Elenco
        </Link>
      </Button>
      <section className="card-arena grid gap-4 p-5 sm:grid-cols-2">
        <h1 className="font-display text-xl font-black sm:col-span-2">Novo atleta</h1>
        <Field label="Nome completo">
          <Input
            value={values.full_name}
            onChange={(e) => setValues({ ...values, full_name: e.target.value })}
            required
          />
        </Field>
        <Field label="Nascimento">
          <Input
            type="date"
            value={values.birth_date}
            onChange={(e) => setValues({ ...values, birth_date: e.target.value })}
          />
        </Field>
        <Field label="Documento">
          <Input
            value={values.document_number}
            onChange={(e) => setValues({ ...values, document_number: e.target.value })}
            autoComplete="off"
          />
        </Field>
        <Field label="Camisa">
          <Input
            type="number"
            value={values.shirt_number}
            onChange={(e) => setValues({ ...values, shirt_number: e.target.value })}
          />
        </Field>
        <Field label="Posição">
          <Input
            value={values.position}
            onChange={(e) => setValues({ ...values, position: e.target.value })}
          />
        </Field>
        <div className="flex gap-4 self-end text-sm">
          <label>
            <input
              type="checkbox"
              checked={values.is_goalkeeper}
              onChange={(e) => setValues({ ...values, is_goalkeeper: e.target.checked })}
            />{" "}
            Goleiro
          </label>
          <label>
            <input
              type="checkbox"
              checked={values.is_captain}
              onChange={(e) => setValues({ ...values, is_captain: e.target.checked })}
            />{" "}
            Capitão
          </label>
        </div>
        <Button className="sm:col-span-2" disabled={mutation.isPending}>
          {mutation.isPending ? "Cadastrando..." : "Cadastrar e inscrever"}
        </Button>
      </section>
    </form>
  );
}

export function AthleteDetailPage({
  championshipId,
  teamId,
  athleteId,
}: {
  championshipId: string;
  teamId: string;
  athleteId: string;
}) {
  const q = useRosterAthlete(championshipId, teamId, athleteId);
  if (q.isLoading) return <Skeleton className="h-56 rounded-xl" />;
  if (!q.data) return <State title="Atleta não encontrado nesta equipe" />;
  const a = q.data;
  return (
    <div className="space-y-4">
      <Button variant="ghost" asChild>
        <Link to="/championships/$id/teams/$teamId/roster" params={{ id: championshipId, teamId }}>
          <ArrowLeft className="h-4 w-4" />
          Elenco
        </Link>
      </Button>
      <section className="card-arena p-6">
        <h1 className="font-display text-xl font-black">{a.full_name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Camisa {a.shirt_number ?? "—"} · {a.position || "Sem posição"}
        </p>
        <p className="mt-4 text-xs">
          Status: {a.registration_status}
          {a.is_captain ? " · Capitão" : ""}
          {a.is_goalkeeper ? " · Goleiro" : ""}
        </p>
      </section>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs">
      <span>{label}</span>
      {children}
    </label>
  );
}
function State({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <section className="card-arena grid min-h-52 place-items-center p-6 text-center">
      <div>
        <UserRound className="mx-auto h-8 w-8 text-neon" />
        <h2 className="mt-3 font-bold">{title}</h2>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </section>
  );
}
