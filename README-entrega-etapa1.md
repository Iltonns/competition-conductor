# IS Arena — Etapa 1 do Plano de Reformulação (Fundação de Navegação)

Baseado em `PLANO_REFORMULACAO_FRONTEND_IS_ARENA.md`, aplicado sobre o repositório
`Iltonns/competition-conductor` (branch `main`). Estrutura real: React + TanStack
Router (file-based) + TanStack Query + Supabase + Tailwind v4 + shadcn/ui.

## Diagnóstico

O repositório já tinha exatamente o problema descrito na seção 2 do plano:

- `src/components/app-shell.tsx` renderizava o menu global (`AppShell`) em
  **toda** rota autenticada, inclusive dentro de `championships/$id/**`.
- `championships_.$id.tsx` (o layout do campeonato) renderizava, dentro do
  próprio conteúdo, um segundo menu (`ChampionshipSidebar`) — resultando em
  dois menus simultâneos sempre que um campeonato estava aberto.
- Não havia nenhuma separação entre Organizer Shell, Championship Shell e uma
  futura área de administração do sistema.

## Causa

O layout `_authenticated/route.tsx` aplicava um único shell (`AppShell`) a
toda a árvore de rotas autenticadas, sem distinguir "fora de um campeonato"
de "dentro de um campeonato".

## Solução (Etapa 1 do plano, seção 8)

1. **`_authenticated/route.tsx`** deixou de renderizar qualquer shell — agora
   só faz o guard de autenticação e provê o `ChampionshipProvider`.
2. Novo grupo de rotas **pathless `_authenticated/_organizer/`**, que aplica o
   novo `OrganizerShell` (menu só com o que existe fora de um campeonato:
   Meus campeonatos, Equipes, Atletas, Organização — nunca Partidas,
   Classificação, Estatísticas, Financeiro etc., conforme a seção 3.2).
3. **`championships_.$id.tsx`** (o cockpit) passou a renderizar o novo
   `ChampionshipShell`: cabeçalho persistente enxuto (voltar, nome/temporada/
   status, seletor de campeonato, indicador de publicação, "ver página
   pública") + o menu único do campeonato (`ChampionshipSidebar`, ampliado
   com os itens do plano: Configuração, Estrutura, Auditoria etc.).
4. O `ChampionshipSwitcher` novo só navega para outra URL — nunca escreve em
   um estado global de "campeonato ativo" (regra da seção 4 do plano).
5. Scaffold do **System Admin Shell** (`/system-admin`), isolado, com guard
   que chama `checkIsSystemAdmin()` e **nega acesso por padrão** (fail-closed)
   enquanto o backend não expuser a função `is_system_admin` (pré-requisito
   descrito na seção 3.6 do plano). Não inventa dados nem RPCs administrativas.

### Decisão importante: módulos ainda não migrados

`finance.tsx`, `matches.tsx`, `media.tsx`, `referees.tsx`, `sponsors.tsx`,
`standings.tsx` e `stats.tsx` **ainda não estão conectados ao
`championshipId`** no backend/rotas atuais (isso é a Etapa 4/5 do plano, que
depende do gate de backend na seção 5). Para não deixá-los sem nenhum shell
(o que pareceria quebrado), eles foram movidos para dentro de `_organizer/`
temporariamente — continuam fora do menu global (não foram adicionados ao
`ORGANIZER_NAV`), mas ainda renderizam com um layout coerente até serem
migrados para `/championships/$id/partidas`, `/classificacao` etc.

## Implementação — arquivos entregues

```
src/components/layouts/
  organizer-shell.tsx          → Organizer Shell (cabeçalho + sidebar + mobile nav)
  organizer-sidebar.tsx        → Menu global do organizador
  championship-shell.tsx       → Championship Shell ("Cockpit")
  championship-header.tsx      → Cabeçalho persistente do cockpit
  championship-switcher.tsx    → Seletor de campeonato (só navega, não muta estado)
  mobile-bottom-nav.tsx        → Navegação inferior mobile, reutilizada pelos dois shells
  system-admin/
    system-admin-shell.tsx     → Shell isolado da administração do sistema
    system-admin-sidebar.tsx   → Menu do painel administrativo

src/lib/system-admin.ts        → checkIsSystemAdmin() (fail-closed até o backend expor a RPC)

src/features/championships/components/ChampionshipSidebar.tsx  → menu do cockpit ampliado

src/routes/
  _authenticated/route.tsx                    → guard, sem shell
  _authenticated/_organizer/route.tsx          → aplica o OrganizerShell (novo)
  _authenticated/_organizer/*.tsx              → dashboard, championships, teams, athletes,
                                                   settings, finance, matches, media,
                                                   referees, sponsors, standings, stats
                                                   (movidos de _authenticated/*.tsx)
  _authenticated/championships_.$id.tsx        → cockpit, agora usando ChampionshipShell
  _authenticated/championships_.$id.index.tsx  → recebeu a capa/hero (antes no layout)
  system-admin/route.tsx                       → guard + SystemAdminShell (novo)
  system-admin/index.tsx                       → dashboard placeholder (novo)

src/components/app-shell.tsx    → REMOVIDO (substituído pelos shells acima)
```

Dois formatos de entrega, equivalentes:

- **`etapa1-fundacao-navegacao.patch`** — `git diff` completo (com detecção de
  rename), para aplicar com `git apply etapa1-fundacao-navegacao.patch` na
  raiz do repositório.
- **`is-arena-etapa1-frontend.zip`** — árvore `src/` completa já com as
  alterações, para quem preferir copiar por cima manualmente.

`routeTree.gen.ts` **não foi incluído nem editado** — é gerado pelo
`@tanstack/router-plugin`. Depois de aplicar as mudanças, rode `bun dev`
(ou `npm run dev` / `vite build`) para que ele seja regenerado a partir da
nova árvore de arquivos.

## Impacto

- Nenhuma rota (URL) mudou — só a composição de layout. Todos os `<Link to="...">`
  existentes no restante do código continuam válidos.
- `championships_.$id.index.tsx` ganhou a seção de capa que antes vivia no
  layout; o restante do conteúdo (cards de resumo, "sobre o campeonato") não
  foi alterado.
- Nenhuma lógica de dados, hook ou chamada Supabase foi tocada.

## Validação

1. `git apply etapa1-fundacao-navegacao.patch` (ou extrair o zip por cima do `src/`).
2. `bun install` (ou `npm install`) se ainda não tiver `node_modules`.
3. `bun dev` — confirmar que o `routeTree.gen.ts` foi regenerado sem erros.
4. `bun run lint` e checagem de tipos (`tsc --noEmit` se configurado) — não
   deve haver erro de import quebrado.
5. Checklist manual:
   - Fora de um campeonato (`/championships`, `/teams`, `/athletes`): aparece
     **só** o menu do organizador.
   - Dentro de um campeonato (`/championships/:id`, `/teams`, `/athletes`
     daquele campeonato): aparece **só** o menu do cockpit — sem o menu do
     organizador atrás.
   - Trocar de campeonato pelo seletor navega para a URL certa e não deixa
     dado do campeonato anterior na tela.
   - `/system-admin` redireciona para `/championships` para qualquer usuário
     comum (a RPC `is_system_admin` ainda não existe no backend).

## Riscos remanescentes

- **Não executei `bun install`/`bun dev`/typecheck** neste ambiente (sandbox
  sem as dependências do projeto) — a revisão foi manual, linha a linha,
  contra os tipos, hooks e componentes reais do repositório. Rodar o build
  antes de mesclar é obrigatório.
- Os 7 módulos "transitórios" (`finance`, `matches`, `media`, `referees`,
  `sponsors`, `standings`, `stats`) continuam sem `championshipId` real —
  isso só se resolve na Etapa 4/5 do próprio plano, junto com o backend.
- O System Admin Shell é só o esqueleto visual + guard fail-closed; nenhuma
  tela de organizações/usuários/planos foi implementada — depende do gate de
  backend descrito na seção 3.6 do plano ("Requisitos de backend do painel
  administrativo").
- Não toquei em `routeTree.gen.ts`; se o projeto não regenerá-lo
  automaticamente no seu ambiente, rode a CLI do `@tanstack/router-plugin`
  manualmente.
