import type { LucideIcon } from "lucide-react";

/**
 * Formato único de item de menu para os três shells do app (Organizer,
 * Championship/Cockpit e System Admin).
 *
 * Por que um tipo compartilhado: antes cada sidebar declarava seu próprio
 * array `as const` com a mesma forma (label/icon/to/available) e reimplementava
 * o mesmo bloco de JSX para o estado "disponível" vs "em breve". Centralizar
 * o *tipo* aqui, mantendo os *dados* em `*-nav.config.ts` por shell, permite:
 *
 * - trocar `available: false` -> `true` num único lugar quando um módulo for
 *   conectado ao backend (Etapa 4/5 do plano de reformulação);
 * - no futuro, filtrar esses arrays por permissão/feature flag com uma única
 *   função genérica (`filterAvailable`, abaixo) em vez de duplicar a lógica
 *   em cada sidebar.
 *
 * Os arrays de cada shell continuam sendo declarados com `satisfies NavItem[]`
 * (não como `NavItem[]` direto) para preservar o tipo literal das rotas —
 * isso é o que mantém o autocomplete e a checagem de tipo do `<Link to="...">`
 * do TanStack Router funcionando nas sidebars.
 */
export interface NavItem {
  label: string;
  icon: LucideIcon;
  /**
   * Rota estática (ex.: "/championships") ou com placeholder de campeonato
   * (ex.: "/championships/$id/teams"). Obrigatório quando `available: true`;
   * omitido quando o módulo ainda não tem página.
   */
  to?: string;
  /** `false` = item aparece desabilitado com badge "Em breve". */
  available: boolean;
}

/** Só os itens já conectados a uma rota real — útil para atalhos/menus reduzidos. */
export function availableNavItems<T extends NavItem>(items: readonly T[]): T[] {
  return items.filter((item) => item.available);
}
