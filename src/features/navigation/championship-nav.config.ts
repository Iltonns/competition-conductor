import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Flag,
  Globe2,
  Handshake,
  History,
  LayoutGrid,
  ListOrdered,
  Newspaper,
  Settings,
  Shield,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";
import type { NavItem } from "@/features/navigation/types";

/**
 * Menu único do Cockpit do Campeonato (plano seção 3.3).
 *
 * A ordem segue o plano; itens sem página implementada ficam com
 * `available: false` (badge "Em breve") em vez de serem omitidos, para
 * deixar claro o que ainda falta conectar ao backend (Etapa 4/5).
 *
 * Rotas usam o placeholder `$id`, resolvido em `ChampionshipSidebar` via
 * `params={{ id: championshipId }}` do TanStack Router.
 */
export const CHAMPIONSHIP_NAV = [
  { label: "Visão geral", icon: Trophy, to: "/championships/$id", available: true },
  {
    label: "Configuração da competição",
    icon: SlidersHorizontal,
    to: "/championships/$id/configuration",
    available: true,
  },
  { label: "Equipes", icon: Shield, to: "/championships/$id/teams", available: true },
  {
    label: "Inscrições e atletas",
    icon: Users,
    to: "/championships/$id/athletes",
    available: true,
  },
  {
    label: "Fases, grupos e rodadas",
    icon: LayoutGrid,
    to: "/championships/$id/structure",
    available: true,
  },
  { label: "Partidas", icon: CalendarDays, to: "/championships/$id/matches", available: true },
  {
    label: "Classificação",
    icon: ListOrdered,
    to: "/championships/$id/standings",
    available: true,
  },
  { label: "Súmulas", icon: ClipboardList, to: "/championships/$id/matches", available: true },
  { label: "Estatísticas", icon: BarChart3, to: "/championships/$id/stats", available: true },
  { label: "Arbitragem", icon: Flag, available: false },
  { label: "Financeiro", icon: CircleDollarSign, available: false },
  { label: "Notícias e mídia", icon: Newspaper, available: false },
  { label: "Patrocinadores", icon: Handshake, available: false },
  { label: "Página pública", icon: Globe2, available: false },
  { label: "Auditoria", icon: History, available: false },
  { label: "Configurações", icon: Settings, available: false },
] as const satisfies NavItem[];

/** Subconjunto usado nos atalhos horizontais do mobile (chips no topo do conteúdo). */
export const CHAMPIONSHIP_QUICK_NAV = [
  { label: "Visão geral", icon: Trophy, to: "/championships/$id", available: true },
  { label: "Equipes", icon: Shield, to: "/championships/$id/teams", available: true },
  {
    label: "Inscrições e atletas",
    icon: Users,
    to: "/championships/$id/athletes",
    available: true,
  },
  { label: "Partidas", icon: CalendarDays, to: "/championships/$id/matches", available: true },
  {
    label: "Classificação",
    icon: ListOrdered,
    to: "/championships/$id/standings",
    available: true,
  },
] as const satisfies NavItem[];
