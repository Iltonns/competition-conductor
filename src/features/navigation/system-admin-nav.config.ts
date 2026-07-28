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
 * Um item só pode ser marcado como disponível depois que rota, RPC específica,
 * autorização fail-closed e dados reais estiverem implementados.
 */
export const SYSTEM_ADMIN_NAV = [
  { to: "/system-admin", label: "Dashboard global", icon: LayoutDashboard, available: true },
  {
    to: "/system-admin/organizacoes",
    label: "Organizações e clientes",
    icon: Building2,
    available: true,
  },
  { to: "/system-admin/usuarios", label: "Usuários", icon: Users, available: true },
  {
    to: "/system-admin/campeonatos",
    label: "Campeonatos e conteúdo",
    icon: Trophy,
    available: true,
  },
  {
    to: "/system-admin/assinaturas",
    label: "Planos e assinaturas",
    icon: CreditCard,
    available: true,
  },
  { to: "/system-admin/suporte", label: "Modo suporte", icon: LifeBuoy, available: true },
  { to: "/system-admin/auditoria", label: "Auditoria", icon: History, available: true },
  {
    to: "/system-admin/configuracoes",
    label: "Configuração da plataforma",
    icon: Settings,
    available: false,
  },
] as const satisfies NavItem[];
