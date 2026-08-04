# PRD — Novo Visual do IS Arena (paleta azul/dourado, fundo branco)

## 1. Contexto
Mockup validado em `IS Arena - Novo Layout.dc.html`: nova estrutura de navegação (sidebar única por campeonato) e nova paleta visual — fundo branco, azul primário, dourado como acento de destaque/premium — substituindo o verde/dark do app atual. Referência estrutural: painéis de gestão de campeonatos amadores (sidebar lateral com ícones, cards de KPI, tabela de classificação por grupos, cards de ação em Times).

## 2. Objetivo
Implementar a nova hierarquia visual e de navegação em todo o produto, mantendo os dados e funcionalidades atuais — é uma troca de camada de apresentação, não de lógica de negócio.

## 3. Fora de escopo
- Autenticação, landing pública, portal `/c/$slug`.
- Módulos não cobertos no mockup (Financeiro, Notícias, Seleção da rodada) — recebem o padrão visual em fase futura.
- Mudança de schema/RLS no Supabase.

## 4. Novo sistema de cores
| Token | Valor (oklch) | Uso |
|---|---|---|
| `--primary` | `oklch(47% 0.17 258)` azul | Ações primárias, ícones ativos, header sidebar |
| `--primary-tint` | `oklch(94% 0.03 258)` | Fundo de item ativo, badges neutros |
| `--accent-gold` | `oklch(80% 0.13 85)` | Badges de destaque, plano gratuito, CTA secundário |
| `--accent-gold-dark` | `oklch(55% 0.13 75)` | Texto/botão sobre dourado |
| `--success` | `oklch(60% 0.15 150)` | Status ativo/regular, evento de gol |
| `--danger` | `oklch(58% 0.19 25)` | Ações destrutivas, ao vivo |
| `--surface` | `#ffffff` | Fundo geral |
| `--border` | `#e4e7ee` | Bordas de card |

Cores de equipe (avatares) usam matiz variado em oklch — não fixas à marca.

## 5. Nova arquitetura de navegação
- **Nível organizador** (`/dashboard`, sem campeonato selecionado): apenas header (logo, "Meus campeonatos", avatar) — sem sidebar. KPIs em cards + lista de campeonatos.
- **Nível campeonato**: sidebar fixa 250px, branca, com header (logo do campeonato + badge de plano) e nav vertical (Início, Classificação, Times, Atletas, Estatísticas, Site de divulgação, Arbitragem, Campos, Calendário, Configurações). Item ativo = fundo `--primary-tint` + texto azul.
- Mobile: sidebar vira drawer (`<Sheet>`), sem bottom-nav.

## 6. Mapeamento tela → arquivos

| Tela do mockup | Arquivo(s) a alterar | Mudança |
|---|---|---|
| Meus campeonatos | `organizer-shell.tsx`, `_organizer/championships.tsx` | Header simples + KPIs + lista de cards |
| Início do campeonato | `championship-shell.tsx`, `championships_.$id.index.tsx` | Banner, chips de status, ações Regras/Fases/+Categoria, preview de classificação |
| Classificação | `championships_.$id.standings.tsx`, `StandingsTable` | Cards de grupo com colunas densas + painel lateral de rodada/jogos |
| Times & Atletas | `_organizer/teams.index.tsx`, `_organizer/athletes.index.tsx` | Barra de permissões + toggle Times/Atletas |
| Configurações | `championships_.$id.settings.tsx` | Abas Informações gerais / Categorias / Tags |
| Súmula | `MatchReportPage` | Mantido do mockup anterior (paleta atualizada) |
| Tokens | `src/styles.css`, `theme.css` | Novo `--primary` azul, `--accent-gold`, remoção de glass/neon |

## 7. Fases de execução
1. **Tokens de cor e tipografia** (0.5 sprint) — atualizar `theme.css`, validar contraste.
2. **Shell único + sidebar contextual** (1–1.5 sprint) — sidebar por campeonato, header simplificado no nível organizador.
3. **Telas principais** (2 sprints) — Início, Classificação, Times & Atletas, reaproveitando hooks/queries existentes.
4. **Configurações** (0.5–1 sprint) — abas + formulário.
5. **Súmula mobile** (0.5 sprint) — aplicar paleta nova ao layout já aprovado.
6. **QA e regressão** (0.5 sprint) — mobile real, contraste, `tests/e2e`.

## 8. Riscos
- Trocar verde por azul/dourado pode exigir novo material de marca (logo, ícones do app) — validar com time de marketing antes do rollout.
- Consolidação de shells (organizador vs. campeonato) pode tocar rotas `_organizer` e `championships_.$id` — alinhar com o time de rotas antes da fase 2.

## 9. Referência
Mockup estático: `IS Arena - Novo Layout.dc.html` (6 telas: Meus campeonatos, Início, Classificação, Times & Atletas, Configurações, Súmula mobile).
