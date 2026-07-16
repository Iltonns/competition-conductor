import { useEffect, useState } from "react";
import { Check, Copy, Link2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useGenerateTeamAccess } from "../hooks/useTeamAccess";
import {
  DEFAULT_TEAM_ACCESS_PERMISSIONS,
  type GeneratedTeamAccess,
  type TeamAccessPermissions,
} from "../types/team-access.types";
import { TeamAccessPermissionsForm } from "./TeamAccessPermissionsForm";

function expirationFromDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1_000).toISOString();
}

export function GenerateTeamAccessDialog({
  open,
  onOpenChange,
  championshipId,
  teamId,
  replacing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipId: string;
  teamId: string;
  replacing: boolean;
}) {
  const mutation = useGenerateTeamAccess(championshipId, teamId);
  const [validity, setValidity] = useState("7");
  const [customDate, setCustomDate] = useState("");
  const [permissions, setPermissions] = useState<TeamAccessPermissions>({
    ...DEFAULT_TEAM_ACCESS_PERMISSIONS,
  });
  const [adminNote, setAdminNote] = useState("");
  const [generated, setGenerated] = useState<GeneratedTeamAccess | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValidity("7");
    setCustomDate("");
    setPermissions({ ...DEFAULT_TEAM_ACCESS_PERMISSIONS });
    setAdminNote("");
    setGenerated(null);
    setCopied(false);
  }, [open]);

  const close = () => {
    setGenerated(null);
    setCopied(false);
    mutation.reset();
    onOpenChange(false);
  };

  const generate = async () => {
    const expiresAt =
      validity === "custom"
        ? customDate
          ? new Date(customDate).toISOString()
          : null
        : expirationFromDays(Number(validity));
    if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
      toast.error("Escolha uma validade futura.");
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        expiresAt,
        permissions,
        adminNote: adminNote.trim() || null,
      });
      setGenerated(result);
      toast.success("Acesso gerado com segurança.");
    } catch {
      toast.error("Não foi possível gerar o acesso. Verifique a configuração do domínio.");
    }
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated.url);
    setCopied(true);
    toast.success("Link copiado.");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[96vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{replacing ? "Gerar novo acesso" : "Gerar acesso da equipe"}</DialogTitle>
          <DialogDescription>
            {replacing
              ? "O link atual será invalidado atomicamente quando o novo for criado."
              : "Defina a validade e as permissões que serão usadas no portal da equipe."}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-neon/25 bg-neon/[0.06] p-4">
              <div className="flex items-center gap-2 text-neon">
                <ShieldCheck className="h-5 w-5" />
                <strong className="text-sm">Link criado</strong>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Este link será mostrado somente agora. Caso seja perdido, gere um novo link.
              </p>
            </div>
            <div>
              <Label htmlFor="generated-team-access">URL segura</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="generated-team-access"
                  readOnly
                  value={generated.url}
                  className="font-mono text-xs"
                />
                <Button type="button" onClick={copy} aria-label="Copiar link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">Copiar</span>
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={close}>Fechar e apagar da tela</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Validade</Label>
                <Select value={validity} onValueChange={setValidity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">24 horas</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="custom">Data personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {validity === "custom" && (
                <div>
                  <Label htmlFor="custom-expiration">Expira em</Label>
                  <Input
                    id="custom-expiration"
                    type="datetime-local"
                    value={customDate}
                    onChange={(event) => setCustomDate(event.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permissões futuras do portal
              </h3>
              <TeamAccessPermissionsForm value={permissions} onChange={setPermissions} />
            </div>
            <div>
              <Label htmlFor="team-access-note">Observação administrativa opcional</Label>
              <Textarea
                id="team-access-note"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                maxLength={500}
                placeholder="Contexto interno, sem dados sensíveis"
                className="mt-1"
              />
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0" />O token não poderá ser recuperado depois
              que este modal for fechado.
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button onClick={generate} disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Gerando..."
                  : replacing
                    ? "Invalidar e gerar novo"
                    : "Gerar acesso"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
