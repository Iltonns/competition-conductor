# PRD — Reformulação de Layout do IS Arena

## 1. Contexto
O app atual (`organizer-shell.tsx` + `championship-shell.tsx`, sidebar colapsável + bottom-nav mobile + header com tabs) foi avaliado como visualmente datado, com hierarquia confusa e navegação duplicada. Este PRD implementa o novo layout validado no mockup `IS Arena - Novo Layout.dc.html` (referência de estrutura: Copa Fácil — sidebar única por contexto, densidade de informação alta e simples).

## 2. Objetivo
Substituir a navegação e os componentes visuais das telas principais, **mantendo a identidade de marca** (verde `#0e7c66`, logo IS Arena, fontes Sora/Manrope, tokens de `theme.css`). Não é uma reescrita de dados/lógica — é uma camada de apresentação nova sobre os mesmos dados e rotas.

## 3. Fora de escopo
- Autenticação (`/auth`, `/reset-password`), landing page, portal público (`/c/$slug`).
- Módulos não cobertos pelo mockup: Financeiro, Mídia, Patrocinadores, Arbitragem (recebem o mesmo padrão visual em fase futura, sem mudança estrutural nesta rodada).
- Alterações de schema/RLS no Supabase.

## 4. Nova arquitetura de navegação
Uma única sidebar lateral fixa (260px, fundo `--primary`), que troca de **conteúdo conforme o contexto** — nunca duas navegações simultâneas:

| Contexto | Quando aparece | Itens |
|---|---|---|
| Organizador | Fora de um campeonato específico | Meus campeonatos, Equipes, Atletas, Página do organizador, Assinatura, Configurações |
| Campeonato | Dentro de `/championships/$id/**` | Início, Partidas & Classificação, Súmula, Configurações |

Mobile: mesma sidebar em `<Sheet>` (drawer), sem bottom-nav separada — elimina a navegação dupla (sidebar + bottom-nav + header tabs) do shell atual.

`Configurações` (por campeonato) passa a ser uma página cheia (sem sidebar), com botão de voltar no topo — não mais abas horizontais dentro do conteúdo.

## 5. Mapeamento tela → componentes existentes

| Tela do mockup | Arquivo(s) a alterar | Mudança |
|---|---|---|
| Meus campeonatos | `organizer-shell.tsx`, `organizer-sidebar.tsx`, `_organizer/championships.tsx` | Sidebar simplificada (remover glass/blur/neon), lista de campeonatos como linhas clicáveis |
| Início (campeonato) | `championship-shell.tsx`, `championships_.$id.index.tsx` | Novo header com hero/banner + chips de info + Sobre, mantendo KPIs/próximas partidas/artilharia existentes |
| Partidas & Classificação | `championships_.$id.standings.tsx`, `championships_.$id.matches.tsx`, `StandingsPage`, `StandingsTable` | Tabela por grupo (grid denso) + painel lateral "Jogos" com filtros |
| Equipes & Atletas | `_organizer/teams.index.tsx`, `_organizer/athletes.index.tsx`, `GlobalDirectoryPages` | Toggle Equipes/Atletas em vez de rotas separadas na sidebar |
| Súmula digital | `MatchReportPage`, `championships_.$id.matches.$matchId.report.tsx` | Layout mobile: ações grandes (Gol/Cartão/Substituição) + lista única de eventos |
| Configurações | `_organizer/settings.tsx` e subpáginas, `championships_.$id.settings.tsx`, `championships_.$id.configuration.tsx` | Página cheia com seções agrupadas (Dados básicos, Campeonato, Divulgação, Esporte) e links "Editar" |
| Design tokens | `src/styles.css`, `src/styles/theme.css` | Remover `card-arena`/`glass-panel`/glow neon; cards brancos com borda simples; tipografia mínima 13px (hoje há textos de 7–9px) |

## 6. Plano de execução por fases

**Fase 1 — Fundação visual (1 sprint)**
- Ajustar `styles.css`: remover glassmorphism/neon-glow, cards brancos (`--card: #ffffff`), escala tipográfica mínima 13px, remover uppercase micro-texto.
- Critério de aceite: nenhuma tela quebra visualmente; Lighthouse/contraste OK.

**Fase 2 — Shell único (1–1.5 sprint)**
- Unificar `OrganizerShell`/`ChampionshipShell` num único `AppShell` com sidebar contextual (props: `variant: 'organizer' | 'championship'`).
- Remover `MobileBottomNav`; sidebar vira `<Sheet>` no mobile.
- Critério de aceite: nenhuma rota renderiza duas navegações ao mesmo tempo.

**Fase 3 — Telas principais (2 sprints)**
- Reconstruir Início, Partidas & Classificação, Equipes & Atletas conforme mockup, reaproveitando hooks/queries existentes (`useMatch`, `fetchDashboardData`, `StandingsTable` etc.) — só a apresentação muda.
- Critério de aceite: paridade funcional com o app atual (mesmos dados, mesmas ações).

**Fase 4 — Súmula mobile (0.5–1 sprint)**
- Redesenhar `MatchReportPage` com os 3 botões grandes + lista de eventos única.
- Critério de aceite: registrar gol/cartão/substituição em ≤2 toques.

**Fase 5 — Configurações (1 sprint)**
- Página cheia por campeonato com seções agrupadas; settings do organizador seguem o mesmo padrão de seção+"Editar".
- Critério de aceite: todos os campos hoje existentes em `OrganizationSettingsPage`/`championship settings` continuam editáveis.

**Fase 6 — Polimento e regressão (0.5 sprint)**
- Teste em mobile real, checagem de acessibilidade (contraste, tamanho de toque ≥44px), atualizar `tests/e2e`.

## 7. Riscos
- Remover `MobileBottomNav` muda hábito de navegação mobile — validar com usuários antes do rollout total (feature flag sugerido).
- Consolidar dois shells em um pode exigir refatorar `useChampionshipContext`/rotas `_organizer` vs `championships_.$id` — planejar com o time de rotas antes da Fase 2.

## 8. Referência
Mockup estático: `IS Arena - Novo Layout.dc.html` (6 telas: Meus campeonatos, Início, Partidas & Classificação, Equipes & Atletas, Súmula digital, Configurações).
