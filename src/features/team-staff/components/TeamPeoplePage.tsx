import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as unknown as SupabaseClient;
type Person = {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  is_primary?: boolean;
};

export function TeamPeoplePage({
  championshipId,
  teamId,
  kind,
}: {
  championshipId: string;
  teamId: string;
  kind: "staff" | "responsibles";
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    role: kind === "staff" ? "coach" : "manager",
    phone: "",
    email: "",
    is_primary: false,
  });
  const query = useQuery({
    queryKey: ["team-people", kind, championshipId, teamId],
    queryFn: async () => {
      const { data: link, error: linkError } = await db
        .from("championship_teams")
        .select("id")
        .eq("championship_id", championshipId)
        .eq("team_id", teamId)
        .single();
      if (linkError) throw linkError;
      if (kind === "responsibles") {
        const { data, error } = await db
          .from("team_responsibles")
          .select("id,full_name,role,phone,email,is_primary")
          .eq("team_id", teamId)
          .is("archived_at", null)
          .order("is_primary", { ascending: false });
        if (error) throw error;
        return data as Person[];
      }
      const { data, error } = await db
        .from("championship_team_staff")
        .select("team_staff!inner(id,full_name,role,phone,email)")
        .eq("championship_team_id", link.id)
        .eq("active", true);
      if (error) throw error;
      return (data ?? []).map((r) => r.team_staff as unknown as Person);
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (form.full_name.trim().length < 3) throw new Error("Informe o nome completo.");
      const rpc = kind === "staff" ? "add_team_staff_for_championship" : "add_team_responsible";
      const args =
        kind === "staff"
          ? {
              p_championship_id: championshipId,
              p_team_id: teamId,
              p_full_name: form.full_name,
              p_role: form.role,
              p_phone: form.phone || null,
              p_email: form.email || null,
            }
          : {
              p_championship_id: championshipId,
              p_team_id: teamId,
              p_full_name: form.full_name,
              p_role: form.role,
              p_phone: form.phone || null,
              p_email: form.email || null,
              p_is_primary: form.is_primary,
            };
      const { error } = await db.rpc(rpc, args);
      if (error) throw error;
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["team-people", kind, championshipId, teamId] });
      setOpen(false);
      setForm({ ...form, full_name: "", phone: "", email: "" });
      toast.success("Cadastro salvo.");
    },
  });
  if (query.isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-48" />
      </div>
    );
  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-xl font-black">
            {kind === "staff" ? "Comissão técnica" : "Dirigentes e responsáveis"}
          </h1>
          <p className="text-xs text-muted-foreground">Cadastros administrativos desta equipe.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </header>
      {open && (
        <form
          className="card-arena grid gap-3 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Input
            placeholder="Nome completo"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Input
            placeholder="Função"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          />
          <Input
            placeholder="Telefone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {kind === "responsibles" && (
            <label className="text-sm">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
              />{" "}
              Responsável principal
            </label>
          )}
          <Button disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}
      {query.error ? (
        <section className="card-arena p-6 text-center" role="alert">
          <p>Não foi possível carregar.</p>
          <Button className="mt-3" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </section>
      ) : query.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {query.data.map((p) => (
            <article key={p.id} className="card-arena flex gap-3 p-4">
              <UserRound className="h-8 w-8 text-neon" />
              <div>
                <strong className="text-sm">{p.full_name}</strong>
                <p className="text-xs text-muted-foreground">
                  {p.role}
                  {p.is_primary ? " · Principal" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.phone || p.email || "Contato não informado"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="card-arena p-8 text-center">
          <UserRound className="mx-auto h-8 w-8 text-neon" />
          <p className="mt-3 text-sm">Nenhum cadastro nesta área.</p>
        </section>
      )}
    </div>
  );
}
