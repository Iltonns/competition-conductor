import { useState } from "react";
import {
  CalendarClock,
  History,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Settings2,
  ShieldOff,
  UnlockKeyhole,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamAccessStatus, useUnblockTeamAccess } from "../hooks/useTeamAccess";
import {
  TEAM_ACCESS_PERMISSION_KEYS,
  TEAM_ACCESS_PERMISSION_LABELS,
} from "../types/team-access.types";
import { GenerateTeamAccessDialog } from "./GenerateTeamAccessDialog";
import { TeamAccessHistory } from "./TeamAccessHistory";
import {
  BlockTeamAccessDialog,
  EditTeamAccessPermissionsDialog,
  ExtendAccessExpirationDialog,
  RevokeTeamAccessDialog,
} from "./TeamAccessActionDialogs";
import { TeamAccessStatusBadge } from "./TeamAccessStatusBadge";

function formatDate(value: string | null): string {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function TeamAccessPanel({
  championshipId,
  teamId,
}: {
  championshipId: string;
  teamId: string;
}) {
  const query = useTeamAccessStatus(championshipId, teamId);
  const unblock = useUnblockTeamAccess(championshipId, teamId);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  if (query.isLoading) return <Skeleton className="h-52 rounded-xl" />;
  if (query.error) {
    return (
      <section className="card-arena p-5" role="alert">
        <h2 className="font-display text-base font-bold">Acesso da equipe</h2>
        <p className="mt-2 text-xs text-red-200">Não foi possível consultar o acesso.</p>
        <Button className="mt-3" variant="outline" onClick={() => query.refetch()}>
          Tentar novamente
        </Button>
      </section>
    );
  }

  const link = query.data;
  if (!link) {
    return (
      <>
        <section className="card-arena p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-neon" />
                <h2 className="font-display text-base font-bold">Acesso da equipe</h2>
              </div>
              <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
                Gere um link individual para o dirigente acessar uma página inicial segura. O
                formulário completo será disponibilizado somente na próxima etapa.
              </p>
              <div className="mt-3">
                <TeamAccessStatusBadge state="not_generated" />
              </div>
            </div>
            <Button onClick={() => setGenerateOpen(true)}>
              <KeyRound className="h-4 w-4" /> Gerar acesso
            </Button>
          </div>
        </section>
        <GenerateTeamAccessDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          championshipId={championshipId}
          teamId={teamId}
          replacing={false}
        />
      </>
    );
  }

  const editable = link.effectiveStatus === "active" || link.effectiveStatus === "blocked";
  const activePermissions = TEAM_ACCESS_PERMISSION_KEYS.filter((key) => link.permissions[key]);
  const unblockAccess = async () => {
    try {
      await unblock.mutateAsync(link.id);
      toast.success("Acesso desbloqueado.");
    } catch {
      toast.error("Não foi possível desbloquear o acesso.");
    }
  };

  return (
    <>
      <section className="card-arena p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="h-5 w-5 text-neon" />
              <h2 className="font-display text-base font-bold">Acesso da equipe</h2>
              <TeamAccessStatusBadge state={link.effectiveStatus} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              O token completo não é armazenado e não pode ser recuperado. Prefixo de identificação:{" "}
              <span className="font-mono">{link.token_prefix ?? "—"}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {editable && (
              <Button size="sm" variant="outline" onClick={() => setExtendOpen(true)}>
                <CalendarClock className="h-4 w-4" /> Validade
              </Button>
            )}
            {editable && (
              <Button size="sm" variant="outline" onClick={() => setPermissionsOpen(true)}>
                <Settings2 className="h-4 w-4" /> Permissões
              </Button>
            )}
            {link.effectiveStatus === "active" && (
              <Button size="sm" variant="outline" onClick={() => setBlockOpen(true)}>
                <LockKeyhole className="h-4 w-4" /> Bloquear
              </Button>
            )}
            {link.effectiveStatus === "blocked" && (
              <Button
                size="sm"
                variant="outline"
                onClick={unblockAccess}
                disabled={unblock.isPending}
              >
                <UnlockKeyhole className="h-4 w-4" /> Desbloquear
              </Button>
            )}
            {editable && (
              <Button size="sm" variant="destructive" onClick={() => setRevokeOpen(true)}>
                <ShieldOff className="h-4 w-4" /> Revogar
              </Button>
            )}
            <Button size="sm" onClick={() => setGenerateOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Gerar novo
            </Button>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Criado em" value={formatDate(link.created_at)} />
          <Info label="Validade" value={formatDate(link.expires_at)} />
          <Info label="Último acesso" value={formatDate(link.last_accessed_at)} />
          <Info label="Quantidade de acessos" value={String(link.access_count)} />
          <Info label="Responsável" value={`Usuário ${link.created_by.slice(0, 8)}`} />
          {link.blocked_at && <Info label="Bloqueado em" value={formatDate(link.blocked_at)} />}
          {link.block_reason && <Info label="Motivo do bloqueio" value={link.block_reason} />}
          {link.revoked_at && <Info label="Revogado em" value={formatDate(link.revoked_at)} />}
          {link.revocation_reason && (
            <Info label="Motivo da revogação" value={link.revocation_reason} />
          )}
        </dl>

        <div className="mt-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Permissões configuradas
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {activePermissions.length ? (
              activePermissions.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px]"
                >
                  {TEAM_ACCESS_PERMISSION_LABELS[key]}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Nenhuma permissão habilitada.</span>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen((value) => !value)}>
            <History className="h-4 w-4" />{" "}
            {historyOpen ? "Ocultar histórico" : "Visualizar histórico"}
          </Button>
          <div className="mt-3">
            <TeamAccessHistory
              championshipId={championshipId}
              teamId={teamId}
              enabled={historyOpen}
            />
          </div>
        </div>
      </section>

      <GenerateTeamAccessDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        championshipId={championshipId}
        teamId={teamId}
        replacing
      />
      <BlockTeamAccessDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        championshipId={championshipId}
        teamId={teamId}
        linkId={link.id}
      />
      <RevokeTeamAccessDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        championshipId={championshipId}
        teamId={teamId}
        linkId={link.id}
      />
      <ExtendAccessExpirationDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        championshipId={championshipId}
        teamId={teamId}
        linkId={link.id}
        currentExpiration={link.expires_at}
      />
      <EditTeamAccessPermissionsDialog
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
        championshipId={championshipId}
        teamId={teamId}
        linkId={link.id}
        initialPermissions={link.permissions}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xs">{value}</dd>
    </div>
  );
}
