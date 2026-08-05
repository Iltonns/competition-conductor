# P1 — Matriz de isolamento executada em produção

**Data:** 05/08/2026
**Commit:** `6de1fbd` + correções desta rodada
**Banco:** `lzjkvgvlfupklpmytvbr` (produção), via session pooler
**Executor:** `npm run test:rls` → [scripts/run-rls-matrix.mjs](../../scripts/run-rls-matrix.mjs)

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

**Nenhuma linha foi persistida em produção.**

## 2. Resultado

**25 de 29 passaram.** Logs brutos por script em `docs/closure/p1-matriz-rls/`
(ignorados pelo git por `*.log`).

### 2.1 Falhas

| Script | Erro | Natureza |
| --- | --- | --- |
| `2c_roster_rls_verification` | `championship_teams_status_check` violado por `status='active'` | **Defeito de produção** |
| `2a_rls_verification` | `permission denied for function delete_championship` (42501) | A investigar |
| `phase6_plan_change_preview` | `authorization_or_preservation_contract_missing` | A investigar |
| `phase6_plan_limits` | `The active starter plan or required limit keys are missing` | Lacuna de dados |

### 2.2 Corrigido nesta rodada

`phase3_complete_report_verification` falhava com `syntax error at or near "::"`.
A linha 40 usava `FROM pg_get_functiondef(...)::text definition` — uma expressão
com cast não é válida na cláusula `FROM`, que só aceita chamada de função ou
subconsulta. Reescrito como subconsulta; passou.

Este script **nunca havia passado**, em executor nenhum. É evidência direta de
que "executado manualmente uma vez" não é prova de nada.

---

## 3. Defeito confirmado: vocabulário duplo em `championship_teams.status`

Severidade **alta**. Encontrado pelo `2c_roster_rls_verification`.

O check constraint em produção aceita apenas:

```
draft, submitted, under_review, approved, rejected, cancelled, withdrawn
```

Mas outras partes do sistema usam um vocabulário diferente para a mesma coluna:

| Origem | Valor usado |
| --- | --- |
| `set_team_championship_archived` ([migration:344](../../supabase/migrations/20260715190000_teams_admin_foundation.sql)) | `UPDATE … SET status='archived'` |
| `phase1_atomic_matches_and_standings.sql:129,198` | `COALESCE(ct.status,'active') NOT IN ('archived','rejected')` |
| `secure_team_edit_links.sql:486,527` | `ct.status='archived'` |
| [athletes.ts:13](../../src/features/athletes/api/athletes.ts) | `.neq("status","archived")` |

### Consequências

1. **Arquivar uma equipe falha em produção.** `set_team_championship_archived`
   tenta gravar `'archived'`, valor que o constraint rejeita. A RPC aborta com
   violação de check.
2. **Filtros que excluem arquivados não excluem nada.** `.neq("status","archived")`
   nunca casa, porque nenhuma linha pode conter esse valor. Falha silenciosa.
3. O default `'active'` presumido por `COALESCE` também é inválido pelo constraint.

### Decisão necessária

Qual vocabulário é o correto? São caminhos diferentes:

- **Se o fluxo de inscrição manda** (`draft → submitted → approved`), então
  `set_team_championship_archived` e os filtros de `archived` precisam mudar,
  provavelmente usando a coluna `archived_at` que já existe na tabela.
- **Se o ciclo de vida manda** (`active/archived`), o constraint precisa ser
  ampliado por migration.

A primeira parece mais provável — `archived_at` já existe e a própria RPC a
preenche. Mas é decisão de produto, não de implementação, e por isso não foi
tomada aqui.

---

## 4. Falhas a investigar

**`2a_rls_verification` — permissão em `delete_championship`.** O erro 42501
ocorre dentro de um `PERFORM public.delete_championship(target_id)`. Precisa
determinar se o script está simulando um papel que legitimamente não deveria
executar a função (caso em que o teste é que está errado) ou se um `GRANT`
esperado sumiu de produção.

**`phase6_plan_change_preview`.** A asserção de contrato de autorização e
preservação de dados na mudança de plano não passa. Pertence ao escopo comercial
(P4 do PRD) e precisa ser lida junto com o spike InfinitePay.

**`phase6_plan_limits`.** Diz que não há plano `starter` ativo nem as chaves de
limite necessárias. Provavelmente lacuna de **dados**, não de schema: o catálogo
comercial nunca foi publicado em produção. Confirmar antes de tratar como
defeito.

---

## 5. Ferramenta

`npm run test:rls` executa a matriz inteira. Aceita filtro por nome:

```bash
npm run test:rls -- phase5
```

Conexão pela variável `SUPABASE_DB_URL`, lida do ambiente ou do `.env`, nunca
impressa. Usa o driver `pg` direto do Node — sem `psql` e sem Docker, para que a
verificação não dependa de daemon local. Sai com código não-zero se algo falhar,
então serve como job de CI sem adaptação.

---

## 6. Situação do gate G1

**Não aprovado.** O gate exige 29/29. Estão 25/29, com um defeito de severidade
alta confirmado em produção e três investigações abertas.
