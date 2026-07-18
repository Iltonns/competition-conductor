# Relatório final — Fase 2

Data: 18/07/2026

## Resultado

A implementação local da Fase 2 entrega o motor da competição, incluindo regulamento versionado, publicação por checklist, fases, grupos, rodadas, geração reproduzível de confrontos, classificação configurável e avanço auditado.

As opções **Configuração da competição** e **Fases, grupos e rodadas** deixaram o estado “Em breve” no cockpit.

## Funcionalidades implementadas

### Regulamento

- Quatro formatos: pontos corridos, grupos, eliminatória e grupos + eliminatória.
- Turno único e ida/volta.
- Quantidade de grupos e classificados.
- Empate, prorrogação, pênaltis e terceiro lugar.
- Pontuação configurável por vitória, empate e derrota.
- Critérios de desempate ordenáveis.
- Placar de WO e descanso mínimo.
- Limites de atletas, goleiros e comissão.
- Janela de inscrição, idade mínima/máxima e requisitos de documento, foto e camisa.
- Mudanças de elenco após início, cartões para suspensão e regras textuais.
- Versionamento do regulamento e justificativa auditada para alterações excepcionais após o início.

### Publicação

- Novo estado `published`.
- Checklist de publicação exige regulamento, ao menos duas equipes e uma fase.
- Formatos com grupos exigem quantidade de grupos e classificados.
- Trigger impede publicação direta, inclusive por manipulação do formulário/API; somente a RPC de checklist publica.

### Fases e grupos

- Criação, edição, ordenação, ativação, finalização e arquivamento lógico.
- Sequência única e ciclo de status controlado.
- Fases com partidas iniciadas bloqueiam mudanças estruturais.
- Criação manual de grupos ou geração transacional pela quantidade configurada.
- Gerações recebem versão, entrada, resultado, hash e chave idempotente.
- Distribuição manual de equipes, sem duplicidade na mesma fase.
- Sorteio aleatório não foi exposto enquanto não houver regra reproduzível configurada.

### Rodadas e confrontos

- Algoritmo round-robin determinístico para quantidade par ou ímpar de equipes.
- Ida e volta com inversão de mando.
- Detecção de confronto duplicado e equipe repetida na rodada.
- Preview obrigatório antes da persistência.
- Validação do descanso mínimo no backend.
- Persistência transacional e idempotente de geração, rodadas e partidas.
- Índice usa o par não ordenado de equipes para impedir confronto duplicado mesmo com mando invertido indevido.
- Regeneração nunca remove partidas ou súmulas existentes.
- Ajustes posteriores de data, local ou estrutura da partida são auditados.

### Classificação

- Pontuação vem do regulamento do campeonato.
- Desempates respeitam a ordem configurada: pontos, vitórias, saldo, gols pró, confronto direto entre empatados, fair play e sorteio determinístico.
- Classificação separada por fase e grupo.
- Ajustes/punições exigem justificativa e são auditados.
- Estados `provisional` e `homologated` visíveis na interface.
- Homologação exige fase finalizada.

### Avanço

- Preview dos classificados por grupo.
- Origem, posição e seed persistidos.
- Confirmação transacional, idempotente e auditada.
- Fase eliminatória recebe chave inicial com pareamento high seed × low seed.
- Repetição divergente é bloqueada.
- Reabertura administrativa exige justificativa e é bloqueada se a fase seguinte já possuir partida ao vivo, finalizada ou súmula.

## Rotas entregues

- `/championships/$id/configuration`
- `/championships/$id/structure`
- `/championships/$id/structure/stages/$stageId`
- Classificação existente ampliada para filtros de fase e grupo.

## Segurança e multi-tenancy

- RPCs resolvem organização pelo campeonato e validam permissão administrativa no servidor.
- Relações de fase, grupo, equipe e campeonato são validadas antes da mutação.
- Mutação direta nas novas tabelas foi revogada de `authenticated`.
- `anon` não possui acesso às tabelas internas do motor.
- Tabelas usam RLS para leitura de membros.
- Publicação, alterações excepcionais, ajustes, homologação, gerações e avanço produzem auditoria.

## Testes adicionados

O arquivo `tests/unit/competition-engine.test.ts` cobre:

- round-robin de turno único;
- ida e volta;
- quantidade ímpar com folga;
- duplicidade de confronto/rodada;
- ordem configurável de desempates;
- WO para mandante e visitante;
- avanço reproduzível com origem e seed.

Também foi criado `supabase/tests/phase2_competition_engine_verification.sql` para verificar tabelas, RPCs, privilégios e índices após aplicar a migration.

## Validação executada

- TypeScript (`tsc --noEmit`): aprovado.
- ESLint: zero erros; permanecem 8 avisos preexistentes de Fast Refresh.
- `git diff --check`: aprovado; apenas avisos de normalização LF/CRLF.
- Rotas geradas pelo TanStack Router: confirmadas no `routeTree.gen.ts`.
- Revisão estática da migration: 18 funções e 21 blocos SQL delimitados corretamente.

## Gates bloqueados pelo ambiente

- Testes Vitest não executaram dentro do sandbox devido a `spawn EPERM` do Vite.
- A tentativa autorizada fora do sandbox foi recusada porque o ambiente atingiu o limite de uso da execução privilegiada.
- Build de produção também ficou bloqueado pelo mesmo `spawn EPERM`/módulo nativo do Tailwind no sandbox.
- E2E autenticado não foi executado.
- A migration não foi aplicada ao Supabase remoto e os testes RLS remotos não foram executados.

## Gate obrigatório antes da publicação

1. aplicar `20260718190000_phase2_competition_engine.sql` em homologação;
2. gerar novamente os tipos oficiais do Supabase;
3. executar `phase2_competition_engine_verification.sql`;
4. executar os testes unitários e o build fora do sandbox;
5. validar RLS com admin, viewer e usuário de outro tenant;
6. validar concorrência de duas gerações e duas confirmações de avanço;
7. executar E2E autenticado nos quatro formatos;
8. somente depois promover a migration para produção.

## Decisão da fase

Implementação local da Fase 2 concluída. A liberação remota permanece bloqueada pelos gates de banco, testes e build descritos acima. Nenhuma atividade da Fase 3 foi iniciada.
