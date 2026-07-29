import { type FormEvent, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useReferee, useRefereeActions } from "../hooks/useSportsOperations";

const ROLE_OPTIONS = [
  { value: "main", label: "Árbitro principal" },
  { value: "assistant", label: "Assistente" },
  { value: "fourth", label: "Quarto árbitro" },
  { value: "table", label: "Mesário" },
] as const;

export function RefereeDetailPage({
  championshipId,
  refereeId,
}: {
  championshipId: string;
  refereeId: string;
}) {
  const referee = useReferee(championshipId, refereeId);
  const actions = useRefereeActions(championshipId);
  const [fullName, setFullName] = useState("");
  const [defaultRole, setDefaultRole] = useState("main");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [defaultFee, setDefaultFee] = useState("0");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!referee.data) return;
    setFullName(referee.data.full_name);
    setDefaultRole(referee.data.default_role);
    setEmail(referee.data.email ?? "");
    setPhone(referee.data.phone ?? "");
    setDocumentNumber(referee.data.document_number ?? "");
    setDefaultFee(String(referee.data.default_fee));
    setStatus(referee.data.status);
  }, [referee.data]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = fullName.trim();
    const fee = Number(defaultFee);

    if (!normalizedName) {
      toast.error("Informe o nome do árbitro.");
      return;
    }
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("Informe um valor previsto válido.");
      return;
    }

    try {
      await actions.save.mutateAsync({
        id: refereeId,
        payload: {
          full_name: normalizedName,
          default_role: defaultRole,
          email: email.trim(),
          phone: phone.trim(),
          document_number: documentNumber.trim(),
          default_fee: fee,
          status,
        },
      });
      toast.success("Cadastro do árbitro atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o árbitro.");
    }
  }

  if (referee.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (referee.error || !referee.data) {
    return (
      <EmptyState
        variant="error"
        title="Árbitro não encontrado"
        description="O cadastro não existe neste campeonato ou seu usuário não possui permissão administrativa."
        action={
          <Button variant="outline" asChild>
            <Link to="/championships/$id/referees" params={{ id: championshipId }}>
              Voltar para Arbitragem
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Button variant="ghost" asChild>
        <Link to="/championships/$id/referees" params={{ id: championshipId }}>
          <ArrowLeft className="h-4 w-4" /> Voltar para Arbitragem
        </Link>
      </Button>

      <header>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-neon">
          <ShieldCheck className="h-3.5 w-3.5" /> Acesso administrativo
        </p>
        <h2 className="font-display text-xl font-extrabold">Detalhes do árbitro</h2>
        <p className="text-xs text-muted-foreground">
          Contatos, documento e valor padrão ficam restritos à gestão do campeonato.
        </p>
      </header>

      <form className="card-arena space-y-5 p-4 sm:p-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="referee-full-name">Nome completo</Label>
            <Input
              id="referee-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={160}
              required
            />
          </div>

          <div>
            <Label htmlFor="referee-default-role">Função padrão</Label>
            <select
              id="referee-default-role"
              className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#1c2733]"
              value={defaultRole}
              onChange={(event) => setDefaultRole(event.target.value)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="referee-status">Status</Label>
            <select
              id="referee-status"
              className="mt-1 h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#1c2733]"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div>
            <Label htmlFor="referee-email">E-mail</Label>
            <Input
              id="referee-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
            />
          </div>

          <div>
            <Label htmlFor="referee-phone">Telefone</Label>
            <Input
              id="referee-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
            />
          </div>

          <div>
            <Label htmlFor="referee-document">Documento</Label>
            <Input
              id="referee-document"
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
              maxLength={80}
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Dado pessoal disponível somente nesta área administrativa.
            </p>
          </div>

          <div>
            <Label htmlFor="referee-default-fee">Valor previsto padrão</Label>
            <Input
              id="referee-default-fee"
              type="number"
              min={0}
              step="0.01"
              value={defaultFee}
              onChange={(event) => setDefaultFee(event.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-4">
          <Button type="submit" disabled={actions.save.isPending}>
            <Save className="h-4 w-4" />
            {actions.save.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
