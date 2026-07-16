import type { ReactNode } from "react";
import { AlertTriangle, Clock3, LockKeyhole, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IsArenaLogo } from "@/components/is-arena-logo";
import {
  TEAM_ACCESS_PERMISSION_KEYS,
  TEAM_ACCESS_PERMISSION_LABELS,
  type PublicTeamAccess,
  type TeamAccessState,
} from "../types/team-access.types";
import { TeamAccessStatusBadge } from "./TeamAccessStatusBadge";
import { TeamRegistrationPortal } from "./TeamRegistrationPortal";

export function PublicTeamAccessLayout({ access }: { access: PublicTeamAccess }) {
  if (access.state !== "valid") return <TeamAccessFailureState state={access.state} />;
  return <TeamRegistrationPortal access={access} />;
  /* Legacy access summary kept below as a reference for failure-state styling.
  const permissions = TEAM_ACCESS_PERMISSION_KEYS.filter((key) => access.permissions[key]);
  return (
    <PublicShell>
      <div className="text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-white/10 bg-black/25">
          {access.teamCrestUrl ? (
            <img
              src={access.teamCrestUrl}
              alt={`Escudo de ${access.teamName ?? "equipe"}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <ShieldCheck className="h-10 w-10 text-neon" />
          )}
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {access.championshipName}
        </p>
        <h1 className="mt-2 font-display text-2xl font-black tracking-tight sm:text-3xl">
          {access.teamName}
        </h1>
        <div className="mt-3">
          <TeamAccessStatusBadge state="active" />
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock3 className="h-4 w-4 text-neon" />
          <strong>Validade</strong>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {access.expiresAt
            ? new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(access.expiresAt))
            : "Não informada"}
        </p>
      </div>
      <div className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Permissões previstas
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {permissions.length ? (
            permissions.map((key) => (
              <span
                key={key}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px]"
              >
                {TEAM_ACCESS_PERMISSION_LABELS[key]}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Nenhuma permissão habilitada.</span>
          )}
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-sky-300/15 bg-sky-400/[0.05] p-3 text-xs text-sky-100">
        Por segurança, nunca compartilhe este acesso em grupos públicos. A IS Arena não solicitará
        sua senha por este link.
      </div>
      <Button className="mt-5 w-full" disabled>
        Continuar cadastro — disponível na próxima etapa
      </Button>
    </PublicShell>
  ); */
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <IsArenaLogo className="justify-center" size={38} />
        </div>
        <section className="card-arena p-5 sm:p-8">{children}</section>
        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          Acesso protegido · IS Arena
        </p>
      </div>
    </main>
  );
}

function TeamAccessFailureState({ state }: { state: TeamAccessState }) {
  const content: Record<string, { title: string; description: string; icon: ReactNode }> = {
    invalid: {
      title: "Acesso inválido",
      description:
        "Não foi possível validar este acesso. Solicite um novo link ao administrador do campeonato.",
      icon: <AlertTriangle className="h-10 w-10 text-red-300" />,
    },
    expired: {
      title: "Acesso expirado",
      description:
        "A validade deste acesso terminou. Solicite uma nova liberação ao administrador.",
      icon: <Clock3 className="h-10 w-10 text-amber-300" />,
    },
    blocked: {
      title: "Acesso bloqueado",
      description: "Este acesso está temporariamente bloqueado pelo administrador do campeonato.",
      icon: <LockKeyhole className="h-10 w-10 text-amber-300" />,
    },
    revoked: {
      title: "Acesso revogado",
      description: "Este link foi revogado definitivamente e não pode mais ser utilizado.",
      icon: <ShieldOff className="h-10 w-10 text-red-300" />,
    },
    replaced: {
      title: "Acesso substituído",
      description:
        "Um novo link foi gerado para esta equipe. Utilize somente o acesso mais recente.",
      icon: <ShieldOff className="h-10 w-10 text-red-300" />,
    },
    unavailable: {
      title: "Campeonato indisponível",
      description: "O acesso ao campeonato está temporariamente indisponível.",
      icon: <AlertTriangle className="h-10 w-10 text-amber-300" />,
    },
    access_limit: {
      title: "Limite de acessos atingido",
      description: "Solicite uma nova liberação ao administrador do campeonato.",
      icon: <LockKeyhole className="h-10 w-10 text-amber-300" />,
    },
    rate_limited: {
      title: "Muitas tentativas",
      description: "Aguarde alguns minutos antes de tentar novamente.",
      icon: <LockKeyhole className="h-10 w-10 text-amber-300" />,
    },
  };
  const selected = content[state] ?? content.invalid;
  return (
    <PublicShell>
      <div className="py-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-black/20">
          {selected.icon}
        </div>
        <h1 className="mt-5 font-display text-2xl font-black">{selected.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {selected.description}
        </p>
      </div>
    </PublicShell>
  );
}

export const InvalidTeamAccessState = () => <TeamAccessFailureState state="invalid" />;
export const ExpiredTeamAccessState = () => <TeamAccessFailureState state="expired" />;
export const BlockedTeamAccessState = () => <TeamAccessFailureState state="blocked" />;
