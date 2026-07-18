import { Building2, CreditCard, Globe2, Shield, Trophy, Users } from "lucide-react";
import type { NavItem } from "@/features/navigation/types";

/**
 * Itens do menu global do organizador.
 *
 * IMPORTANTE (plano seção 3.2): "Partidas", "Classificação", "Estatísticas",
 * "Súmula", "Arbitragem", "Financeiro", "Mídia" e "Patrocinadores" NÃO podem
 * aparecer aqui — são módulos do Championship Shell, não do Organizer Shell.
 * Adicionar qualquer um deles de volta a esta lista reintroduz a navegação
 * duplicada que o plano de reformulação elimina.
 *
 * `satisfies NavItem[]` (em vez de `: NavItem[]`) preserva o tipo literal de
 * `to`, necessário para o `<Link to="...">` do TanStack Router continuar
 * type-safe em `organizer-sidebar.tsx`.
 */
export const ORGANIZER_NAV = [
  { to: "/championships", label: "Meus campeonatos", icon: Trophy, available: true },
  { to: "/teams", label: "Equipes", icon: Shield, available: true },
  { to: "/athletes", label: "Atletas", icon: Users, available: true },
  { to: "/settings", label: "Organização e usuários", icon: Building2, available: true },
  { to: "/settings", label: "Assinatura e limites", icon: CreditCard, available: false },
  { to: "/settings", label: "Página do organizador", icon: Globe2, available: false },
] as const satisfies NavItem[];
