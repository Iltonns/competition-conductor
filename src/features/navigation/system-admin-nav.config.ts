import {
  Building2,
  CreditCard,
  History,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import type { NavItem } from "@/features/navigation/types";

/**
 * Menu do painel do administrador do sistema (plano seção 3.6 e 4).
 * Nunca compartilha rota, layout ou papel com `organization_members` —
 * ver `src/lib/system-admin.ts` para a checagem de autorização.
 *
 * Todos os itens estão marcados `available: true` porque as rotas existem
 * (mesmo que a página em si ainda seja um placeholder aguardando o gate de
 * backend da seção 3.6 — "Requisitos de backend do painel administrativo").
 */
export const SYSTEM_ADMIN_NAV = [
  { to: "/system-admin", label: "Dashboard global", icon: LayoutDashboard, available: true },
  {
    to: "/system-admin/organizacoes",
    label: "Organizações e clientes",
    icon: Building2,
    available: false,
  },
  { to: "/system-admin/usuarios", label: "Usuários", icon: Users, available: false },
  {
    to: "/system-admin/campeonatos",
    label: "Campeonatos e conteúdo",
    icon: Trophy,
    available: false,
  },
  {
    to: "/system-admin/assinaturas",
    label: "Planos e assinaturas",
    icon: CreditCard,
    available: false,
  },
  { to: "/system-admin/suporte", label: "Modo suporte", icon: LifeBuoy, available: false },
  { to: "/system-admin/auditoria", label: "Auditoria", icon: History, available: false },
  {
    to: "/system-admin/configuracoes",
    label: "Configuração da plataforma",
    icon: Settings,
    available: false,
  },
] as const satisfies NavItem[];
