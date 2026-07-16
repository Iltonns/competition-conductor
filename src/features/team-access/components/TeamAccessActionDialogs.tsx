import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useBlockTeamAccess,
  useExtendTeamAccess,
  useRevokeTeamAccess,
  useUpdateTeamAccessPermissions,
} from "../hooks/useTeamAccess";
import type { TeamAccessPermissions } from "../types/team-access.types";
import { TeamAccessPermissionsForm } from "./TeamAccessPermissionsForm";

function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor={`${confirmLabel}-reason`}>Motivo</Label>
          <Textarea
            id={`${confirmLabel}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={pending || reason.trim().length < 3}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? "Processando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BlockTeamAccessDialog({
  open,
  onOpenChange,
  championshipId,
  teamId,
  linkId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipId: string;
  teamId: string;
  linkId: string;
}) {
  const mutation = useBlockTeamAccess(championshipId, teamId);
  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bloquear acesso temporariamente?"
      description="O link deixará de funcionar imediatamente, mas poderá ser desbloqueado."
      confirmLabel="Bloquear"
      pending={mutation.isPending}
      onConfirm={async (reason) => {
        try {
          await mutation.mutateAsync({ linkId, reason });
          toast.success("Acesso bloqueado.");
          onOpenChange(false);
        } catch {
          toast.error("Não foi possível bloquear o acesso.");
        }
      }}
    />
  );
}

export function RevokeTeamAccessDialog({
  open,
  onOpenChange,
  championshipId,
  teamId,
  linkId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipId: string;
  teamId: string;
  linkId: string;
}) {
  const mutation = useRevokeTeamAccess(championshipId, teamId);
  return (
    <ReasonDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revogar definitivamente?"
      description="Este token nunca voltará a funcionar. Para liberar o acesso será necessário gerar outro link."
      confirmLabel="Revogar"
      pending={mutation.isPending}
      onConfirm={async (reason) => {
        try {
          await mutation.mutateAsync({ linkId, reason });
          toast.success("Acesso revogado.");
          onOpenChange(false);
        } catch {
          toast.error("Não foi possível revogar o acesso.");
        }
      }}
    />
  );
}

export function ExtendAccessExpirationDialog({
  open,
  onOpenChange,
  championshipId,
  teamId,
  linkId,
  currentExpiration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipId: string;
  teamId: string;
  linkId: string;
  currentExpiration: string;
}) {
  const mutation = useExtendTeamAccess(championshipId, teamId);
  const [date, setDate] = useState("");
  useEffect(() => {
    if (open) setDate(new Date(currentExpiration).toISOString().slice(0, 16));
  }, [open, currentExpiration]);
  const submit = async () => {
    const expiresAt = date ? new Date(date).toISOString() : "";
    if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
      toast.error("Escolha uma data futura.");
      return;
    }
    try {
      await mutation.mutateAsync({ linkId, expiresAt });
      toast.success("Validade atualizada.");
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível alterar a validade.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar validade</DialogTitle>
          <DialogDescription>
            O limite máximo permitido é de 90 dias a partir de agora.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="extend-team-access">Nova validade</Label>
          <Input
            id="extend-team-access"
            type="datetime-local"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar validade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTeamAccessPermissionsDialog({
  open,
  onOpenChange,
  championshipId,
  teamId,
  linkId,
  initialPermissions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipId: string;
  teamId: string;
  linkId: string;
  initialPermissions: TeamAccessPermissions;
}) {
  const mutation = useUpdateTeamAccessPermissions(championshipId, teamId);
  const [permissions, setPermissions] = useState(initialPermissions);
  useEffect(() => {
    if (open) setPermissions(initialPermissions);
  }, [open, initialPermissions]);
  const submit = async () => {
    try {
      await mutation.mutateAsync({ linkId, permissions });
      toast.success("Permissões atualizadas.");
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível atualizar as permissões.");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar permissões</DialogTitle>
          <DialogDescription>
            Ausência de permissão nunca é interpretada como acesso total.
          </DialogDescription>
        </DialogHeader>
        <TeamAccessPermissionsForm
          value={permissions}
          onChange={setPermissions}
          disabled={mutation.isPending}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar permissões"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
