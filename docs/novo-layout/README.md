# Novo Layout — pacote de design

Documentação de referência para a reformulação de layout do IS Arena. Este diretório contém **apenas material de design** (PRDs, mockup estático e capturas de referência). Nenhum código da aplicação é alterado por ele.

## Conteúdo

| Arquivo / pasta | O que é |
|---|---|
| [`PRD_NOVO_LAYOUT_UI.md`](PRD_NOVO_LAYOUT_UI.md) | PRD da **estrutura de navegação** — shell único, sidebar contextual, fim do bottom-nav, mapeamento tela → arquivo, 6 fases de execução. Mantém a identidade verde atual. |
| [`PRD_NOVO_VISUAL_AZUL_DOURADO.md`](PRD_NOVO_VISUAL_AZUL_DOURADO.md) | PRD do **novo sistema visual** — fundo branco, `--primary` azul, `--accent-gold`, tabela de tokens em oklch. Mesma arquitetura de navegação do PRD acima. |
| [`ORIGEM_DO_MOCKUP.md`](ORIGEM_DO_MOCKUP.md) | Nota de origem: o que foi lido do app atual para gerar o mockup e qual tela do mockup corresponde a quais arquivos-fonte. |
| [`mockup/`](mockup/) | Mockup estático navegável (`IS Arena - Novo Layout.dc.html` + `support.js`). Abrir o `.html` direto no navegador; alterna entre as 6 telas pela barra superior. |
| [`referencias/`](referencias/) | Capturas de tela dos produtos usados como referência visual — Copa Fácil e iFut. Ver [`referencias/README.md`](referencias/README.md). |

## Decisão pendente antes de codar

Os dois PRDs **concordam na navegação** e **divergem na paleta**:

- `PRD_NOVO_LAYOUT_UI.md` §2 — manter a identidade de marca atual (verde `#0e7c66`).
- `PRD_NOVO_VISUAL_AZUL_DOURADO.md` §4 — trocar `--primary` para azul `oklch(47% 0.17 258)` com dourado como acento.

O mockup em `mockup/` está renderizado na paleta **azul/dourado**. É preciso escolher uma das duas antes da fase de tokens, porque as duas mexem nos mesmos arquivos (`src/styles.css`, `src/styles/theme.css`). O risco de marca já está registrado em `PRD_NOVO_VISUAL_AZUL_DOURADO.md` §8 (logo e ícones do app precisariam ser refeitos).

Fora a paleta, o resto é compatível: as fases 2–6 dos dois documentos descrevem a mesma sequência (shell único → telas principais → configurações → súmula → QA).

## Arquivos do app que os PRDs pretendem tocar

Confirmados como existentes no repo nesta branch:

- `src/components/layouts/organizer-shell.tsx`, `organizer-sidebar.tsx`, `championship-shell.tsx`, `championship-header.tsx`, `mobile-bottom-nav.tsx`
- `src/styles/theme.css`, `src/styles.css`
- rotas em `src/routes/_authenticated/` (`_organizer/*`, `championships_.$id.*`)
