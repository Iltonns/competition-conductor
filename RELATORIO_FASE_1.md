# Relatório final — Fase 1

Data: 18/07/2026

## Resultado

A implementação local da Fase 1 conecta Partidas, Súmulas, Classificação e Estatísticas ao cockpit contextual do campeonato. A URL passa a ser a fonte de verdade do `championshipId`, as mutações críticas foram movidas para RPCs transacionais e a classificação deixou de ser calculada como estado canônico no navegador.

## Entregas

- Rotas contextuais para lista de partidas, detalhe, súmula, classificação e estatísticas.
- Rotas antigas de organizador redirecionadas para a seleção de campeonatos.
- Itens Partidas, Classificação, Súmulas e Estatísticas habilitados no menu lateral, atalhos responsivos e navegação inferior.
- Criação, edição, reagendamento, adiamento, cancelamento, exclusão condicionada e ciclo agendada → ao vivo → finalizada.
- Filtros de partida por status, data, equipe e rodada.
- Registro e remoção lógica de eventos por RPC atômica e idempotente.
- Placar recalculado a partir dos eventos válidos, incluindo gol contra e gol de pênalti.
- Validação no banco de organização, campeonato, equipes distintas, atleta/equipe da partida e minuto do evento.
- Reabertura de partida finalizada restrita a administrador e registrada em `audit_logs`.
- Classificação persistida e recalculada somente com partidas finalizadas, na regra 3/1/0.
- Estatísticas reais, sem dados demonstrativos, ignorando eventos removidos e sem atribuir gol contra ao artilheiro.
- Privilégios de mutação direta removidos de `matches`, `match_events`, `standings` e `audit_logs`; alterações passam pelas RPCs autorizadas.

## Validação executada

- ESLint: aprovado, zero erros; permanecem 8 avisos preexistentes de Fast Refresh.
- TypeScript: aprovado com `tsc --noEmit`.
- Testes unitários: 26 aprovados em 4 arquivos.
- Cobertura: 94,11% statements; 88,52% branches; 100% functions; 97,77% lines.
- Build de produção: aprovado fora do sandbox após o erro ambiental `spawn EPERM` do Windows/OneDrive.
- E2E público: 2 aprovados.
- E2E autenticado: preparado para também validar as novas rotas, mas ignorado porque a conta segura de teste não está configurada.
- `git diff --check`: aprovado; apenas avisos de normalização LF/CRLF.

## Gate de banco ainda necessário

A migration `20260718160000_phase1_atomic_matches_and_standings.sql` foi criada, mas não foi aplicada ao projeto Supabase remoto nesta execução. O ambiente continua sem sessão segura da CLI/conta autenticada para executar migração e testes RLS remotos.

Antes de liberar a Fase 1 em produção:

1. aplicar a migration no ambiente de homologação;
2. gerar novamente `src/integrations/supabase/types.ts` pela CLI oficial;
3. executar `supabase/tests/phase1_matches_atomic_verification.sql`;
4. executar testes autenticados com perfis admin e viewer, em dois tenants;
5. validar concorrência com dois registros simultâneos de gol e repetição da mesma chave idempotente;
6. executar o E2E completo com uma conta e campeonato exclusivos de teste.

## Riscos residuais

- Sem a migration remota, a interface nova não deve ser publicada: as RPCs ainda não existirão no backend remoto.
- A tipagem das novas RPCs está isolada por um adaptador local até a geração oficial após a migration.
- A validação visual autenticada em desktop e mobile depende da conta segura de teste.

## Decisão de fase

Código da Fase 1 concluído localmente e validado nos gates disponíveis. Liberação remota bloqueada exclusivamente pelos gates de Supabase e E2E autenticado acima. Nenhuma atividade da Fase 2 foi iniciada.
