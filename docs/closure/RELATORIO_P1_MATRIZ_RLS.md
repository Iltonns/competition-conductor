# P1 — Matriz de isolamento executada em produção

**Data:** 06/08/2026 (primeira execução em 05/08/2026)
**Banco:** `lzjkvgvlfupklpmytvbr` (produção), via session pooler
**Executor:** `npm run test:rls` → [scripts/run-rls-matrix.mjs](../../scripts/run-rls-matrix.mjs)

**Resultado: 29/29. Gate G1 aprovado.**

---

## 1. Auditoria de segurança (entrega 1)

Antes de qualquer execução, os 29 scripts foram classificados por critério
explícito. O runner repete essa auditoria a cada execução e **aborta** se algum
arquivo deixar de respeitá-la.

| Classificação | Qtd | Critério |
| --- | ---: | --- |
| Transacional seguro | 27 | último statement de controle é `ROLLBACK`, zero `COMMIT` |
| Somente leitura | 2 | nenhuma escrita; só asserções sobre catálogo |

`phase1_matches_atomic_verification` e `phase2_competition_engine_verification`
são os dois somente leitura. O único `COMMIT` do conjunto é a cláusula
`ON COMMIT DROP` de tabela temporária em `phase6_subscription_lifecycle`.

**Resíduo conferido por consulta após a execução final:** zero. `auth.users` com
domínio `@example.invalid`, organizações, campeonatos, equipes e atletas de
fixture: nenhuma linha. `championship_teams` continua com 0 linhas em produção.

## 2. Execução (entrega 2)

| Rodada | Resultado |
| --- | --- |
| 05/08 — primeira execução real dos 29 | 25/29 |
| 06/08 — depois de corrigir os 3 testes desatualizados e aplicar 4 migrations | 28/29, depois 28/29, depois **29/29** |

As três rodadas de 06/08 não foram repetição: cada correção destravou o script
para ir mais longe e revelar o defeito seguinte. Está registrado na seção 4.

Logs brutos por script em `docs/closure/p1-matriz-rls/` (ignorados pelo git por
`*.log`, anexados no CI como artefato `matriz-rls`).

## 3. Três das quatro falhas eram teste desatualizado, não defeito

A matriz nunca havia sido reexecutada depois das migrations que mudaram os
contratos que ela verifica. Três dos quatro vermelhos de 05/08 eram scripts
asserindo um contrato que uma migration posterior revogou **de propósito**.

| Script | O que asseria | O que mudou |
| --- | --- | --- |
| `2a_rls_verification` | que `authenticated` executa `delete_championship` | `20260727200000` revogou a exclusão legada e a substituiu por `delete_championship_permanently`, que exige confirmação digitada e justificativa. O `42501` era o comportamento correto |
| `phase6_plan_change_preview` | que o corpo de `preview_organization_plan_change` contém `data_preserved`/`new_writes_only` | `20260729050000` partiu a RPC em invólucro + `_owner_checked_source`. O contrato de preservação mudou de função, e o invólucro ganhou `assert_organization_owner` |
| `phase6_plan_limits` | que existe plano `starter` ativo | `20260728210000` aposentou o `starter` e passou a provisionar `small_championships` |

Os três foram corrigidos para verificar o contrato **vigente**, não para
silenciar. `2a` agora exige as duas coisas: que a exclusão legada continue
inalcançável **e** que a vigente recuse campeonato com dependência (`55000`).
`phase6_plan_change_preview` verifica o par inteiro — autorização no invólucro,
preservação e somente-leitura no source, e que o source siga revogado de `anon`
e de `authenticated`. `phase6_plan_limits` verifica o plano padrão atual, exige
que **todo** plano ativo carregue as cinco chaves de limite (chave ausente vira
`NULL`, que o motor lê como ilimitado — desligaria o limite em silêncio) e que o
legado continue aposentado e sem assinatura apontando para ele.

## 4. Quatro defeitos reais, corrigidos por migration

### 4.1 Vocabulário duplo em `championship_teams.status` — alto

Encontrado por `2c_roster_rls_verification`. O check constraint em produção
aceita apenas o vocabulário de inscrição:

```
draft, submitted, under_review, approved, rejected, cancelled, withdrawn
```

Mas sete pontos do sistema usavam `'archived'` na mesma coluna. Consequência
dupla, silenciosa nos dois sentidos:

1. `set_team_championship_archived` gravava `'archived'`, valor que o constraint
   rejeita — **arquivar equipe falhava sempre em produção**;
2. os seis leitores que filtravam `status <> 'archived'` nunca casavam nada —
   **o filtro que deveria excluir equipes arquivadas não excluía nenhuma**.

**Decisão do responsável pelo produto:** o vocabulário de inscrição manda.
`status` descreve só o ciclo de inscrição; arquivamento passa a ser `archived_at`,
coluna que já existia e que a própria RPC já preenchia. Uma equipe aprovada e
arquivada continua registrada como aprovada, em vez de perder a aprovação.

Migration [`20260806120000`](../../supabase/migrations/20260806120000_championship_teams_arquivamento_por_archived_at.sql):
`set_team_championship_archived`, `phase1_team_in_championship`,
`publish_competition`, `recalculate_standings`, `generate_team_edit_link`,
`consume_team_edit_token`, `get_team_edit_session`. Cliente:
[athletes.ts](../../src/features/athletes/api/athletes.ts).

A mesma migration versiona o constraint e o default `'draft'`, que **nenhuma
migration do repositório criava**: a de `20260715190000` usa
`IF NOT EXISTS (... conname ...)` e foi pulada porque o constraint já existia com
outra definição. Um banco vazio construído pelo repositório divergia de produção.

O descarte de `'rejected'` foi preservado como estava. Se `cancelled` e
`withdrawn` também devem sair dessas contagens, é mudança de regra de negócio e
fica como pergunta em aberto — não entrou junto com a correção do defeito.

### 4.2 `assert_championship_limit` ambígua — crítico

Só apareceu depois de 4.1, quando `2c` passou a montar a fixture com o
vocabulário correto e conseguiu chegar a inscrever um atleta:

```
ERRO: column reference "organization_id" is ambiguous (42702)
  assert_championship_limit  <- tg_enforce_championship_plan_limit
  <- INSERT INTO championship_team_athletes <- register_athlete_for_championship
```

A função declara uma variável plpgsql chamada `organization_id`, nome que também
é coluna de `organization_subscriptions`. Em
`WHERE subscription.organization_id = organization_id` o Postgres não decide e
aborta. Não é caso de borda: o erro ocorre em toda execução que chega ali, então
**inscrever atleta em campeonato falhava sempre em produção**, pelo gatilho de
limite de plano. Idem para o gatilho de patrocinadores.

`CREATE FUNCTION` não analisa corpo plpgsql, então a migration original aplicou
limpa e o defeito ficou invisível até existir um teste que inscrevesse um atleta
de verdade. Uma varredura das 171 funções plpgsql do schema encontrou este como
o único caso do padrão.

Migration [`20260806130000`](../../supabase/migrations/20260806130000_assert_championship_limit_ambiguidade.sql).

### 4.3 Equipe arquivada no portal público — médio

Encontrado pela guarda de regressão que 4.1 adicionou a `2c`, e **não** pela
varredura manual: a linha é longa e ficou truncada na leitura inicial.

`get_public_championship_portal` listava equipes com
`ct.status NOT IN ('archived','rejected')`. Mesmo filtro morto de 4.1, com um
agravante: vazava para página aberta, sem autenticação. Equipe arquivada
continuava aparecendo no portal público do campeonato.

Migration [`20260806140000`](../../supabase/migrations/20260806140000_portal_publico_equipes_arquivadas.sql).

### 4.4 Labels de enum fora do controle de versão — baixo

`public.championship_status` tem oito labels em produção; o repositório cria
cinco. `registration_open`, `preparing` e `suspended` existiam só lá.

Importa porque `consume_team_edit_token` e `get_team_edit_session` comparam
`championships.status IN ('suspended','archived')`. Num banco vazio construído
pelo repositório a cadeia aplicaria sem erro — corpo plpgsql não é analisado na
criação — e as duas funções quebrariam na primeira chamada com
`invalid input value for enum championship_status: "suspended"`. Fica fora de
qualquer auditoria de schema, porque o catálogo não acusa divergência dentro de
corpo de função.

Migration [`20260806110000`](../../supabase/migrations/20260806110000_championship_status_labels_faltantes.sql),
com `BEFORE 'published'` para reproduzir a ordem de produção.

### 4.5 Corrigido na rodada anterior

`phase3_complete_report_verification` falhava com `syntax error at or near "::"`.
A linha 40 usava `FROM pg_get_functiondef(...)::text definition` — expressão com
cast não é válida na cláusula `FROM`. Reescrito como subconsulta. Este script
**nunca havia passado**, em executor nenhum.

## 5. Guardas de regressão adicionadas

Corrigir o defeito não impede que ele volte. `2c_roster_rls_verification` ganhou:

1. exercício real de `set_team_championship_archived` nos dois sentidos,
   exigindo que `archived_at` mude e que `status` **não** mude;
2. varredura do catálogo: nenhuma função pode voltar a comparar
   `ct.status`/`v_link.status`/`v_participation.status` com `'archived'`;
3. asserção de que `set_team_championship_archived` não volte a gravar o valor.

Foi a guarda 2 que encontrou o defeito 4.3, minutos depois de ser escrita.

## 6. Job de CI (entrega 4)

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), job `rls-matrix`.
Roda a matriz inteira a cada push na `main` e em cada PR do próprio repositório.

- **PR de fork não roda.** Sem o secret a matriz passaria em verde sem ter
  verificado nada, que é pior do que não rodar. O job é pulado explicitamente.
- **Secret ausente falha o job**, em vez de pular em silêncio.
- **`concurrency` serializa** as execuções: duas concorrentes disputariam os
  mesmos advisory locks por campeonato dentro dos scripts de limite de plano.
- **Saídas anexadas** como artefato `matriz-rls`, inclusive quando falha.

Configuração pendente do lado do GitHub: cadastrar o secret `SUPABASE_DB_URL`
com a connection string do pooler. Enquanto não existir, o job falha — de
propósito.

## 7. Entrega 5

`phase3_referee_privacy_verification.sql` já está em `supabase/tests/` e o runner
não tem lista fixa: executa tudo que casa `*.sql` no diretório. Está entre os 29
e passa.

## 8. Ferramenta

`npm run test:rls` executa a matriz inteira. Aceita filtro por nome:

```bash
npm run test:rls -- phase5
```

Conexão pela variável `SUPABASE_DB_URL`, lida do ambiente ou do `.env`, nunca
impressa. Usa o driver `pg` direto do Node — sem `psql` e sem Docker, para que a
verificação não dependa de daemon local. Sai com código não-zero se algo falhar.

## 9. O que esta fase demonstrou sobre o resto do plano

Os 29 scripts existiam há semanas e passavam a impressão de cobertura. Executá-los
uma vez encontrou quatro defeitos, um deles crítico e um deles exposto em página
pública, além de um script que nunca havia passado em executor nenhum. Nenhum
seria encontrado por revisão de código ou por auditoria de catálogo: os quatro
vivem dentro de corpo de função plpgsql, que o Postgres não analisa na criação e
que `supabase db diff` não compara semanticamente.

Vale para as fases seguintes: teste não executado não é evidência.
