# IS Arena — Plano de Implementação

Projeto enorme (24 módulos, ~26 tabelas, CRUDs completos, página pública, súmula digital, financeiro). Não cabe em um único turno. Vou entregar em fases funcionais — cada fase termina com algo utilizável e conectado ao Supabase antes de avançar.

## Stack
React 19 + TanStack Start + TypeScript + Tailwind v4 + Lovable Cloud (Supabase: Auth, Postgres, Storage, RLS).

## Fase 1 — Fundação (esta entrega)
Objetivo: base visual + auth + estrutura multi-organizador funcionando.

1. **Design system** em `src/styles.css`
   - Tema escuro: fundo `#05070d`, superfície `#0b1220`, cards grafite-azul, verde neon `#c6ff2e` como accent.
   - Tokens semânticos (background, card, primary, accent, success, warning, danger, info), gradientes sutis, sombras, radius, tipografia (display + sans moderna via `<link>` no `__root`).
   - Variantes shadcn (button hero/neon, card premium, kpi, match).
2. **Logo IS Arena** (SVG inline) — símbolo "IS" futurista verde neon/branco. Usado em sidebar, header mobile, splash, página pública.
3. **Lovable Cloud** habilitado + migrations com TODAS as 26 tabelas, enums, RLS por `organization_id`, trigger de profile, `has_role`, GRANTS corretos.
4. **Auth**: `/auth` (email/senha + Google), `/reset-password`, layout `_authenticated` gate.
5. **Shell**: Sidebar desktop fixa com todos os itens + rodapé (plano/perfil); bottom-nav mobile com FAB verde central; header responsivo.
6. **Dashboard** com dados demo (KPIs, próximo jogo cinematográfico, classificação, artilharia, gráfico de desempenho recharts).
7. **Splash** e **página pública** (`/c/$slug`) base — banner, patrocinadores, próximos jogos, classificação, artilharia.

## Fase 2 — CRUDs núcleo (próximo turno)
Campeonatos, Equipes, Atletas, Partidas — todos com create/edit/delete, upload de escudo/foto no Supabase Storage, validação Zod, toasts, skeletons, confirm dialogs.

## Fase 3 — Competição
Súmula digital mobile-first (eventos ao vivo, gol/cartão/subst.), tela de partida com abas, classificação automática (view SQL), estatísticas (artilharia/assistências/cartões).

## Fase 4 — Módulos complementares
Financeiro (dashboard + transações + gráficos), Notícias (CRUD + destaque), Mídia/Galeria, Arbitragem, Patrocinadores, Configurações, Página pública completa.

## Fase 5 — Polimento
Responsividade fina, empty/loading states em todos os componentes, tooltips, animações discretas (framer-motion), auditoria RLS, seed de demonstração (Copa da Baixada 2026 + 8 equipes + 5 jogadores).

## Detalhes técnicos
- **RLS**: toda tabela admin filtra por `organization_id IN (select organization_id from organization_members where user_id = auth.uid())`. Página pública lê via server function com publishable key + policy `TO anon` restrita a campeonatos marcados `is_public=true`.
- **Roles**: enum `app_role` (owner/admin/editor/viewer) em `user_roles` separada — nunca no profile.
- **Storage buckets**: `logos`, `crests`, `athletes`, `news`, `gallery`.
- **Rotas**: `_authenticated/` para admin; `/c/$slug` público SSR com `head()` OG dinâmico.
- **Data**: TanStack Query + `ensureQueryData` + `useSuspenseQuery`.

## Confirmações antes de começar
1. **Escopo Fase 1**: OK começar com fundação + auth + dashboard + shell + splash + página pública base? (Resto vem em turnos seguintes.)
2. **Autenticação**: Email/senha + Google (padrão Cloud)? Ou só email?
3. **Perfis de usuário**: além de nome/avatar/organização, algum campo extra?

Se aprovar sem responder 2/3, sigo com email+Google e profile mínimo (display_name, avatar_url, organization atual).
