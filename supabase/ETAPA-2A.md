# Etapa 2A — validação e aplicação segura

## Estado desta entrega

A migration `20260715120000_repair_core_rls_and_championship_foundation.sql` foi criada, auditada contra o catálogo remoto fornecido pelo SQL Editor e **ainda não foi aplicada**. As consultas de integridade retornaram zero inconsistências. A migration foi reconciliada com as colunas, constraints, índices, policies, triggers e funções retornadas pela auditoria, incluindo `competition_stages.sequence`, a criação automática de `championship_settings` e a tabela remota `championship_teams`.

Ainda não há neste ambiente uma conexão PostgreSQL administrativa, Supabase CLI instalada ou Docker. Por isso, não foi possível executar a migration, os testes RLS, um `db diff` shadow ou a geração oficial dos tipos. `championship_teams` continua sendo uma estrutura existente somente no remoto e é tratada condicionalmente; suas dependências (`competition_groups`, entre outras) devem entrar em uma migration de baseline separada antes de exigir reprodução integral do banco do zero.

O arquivo `src/integrations/supabase/types.ts` foi sincronizado localmente com a migration para remover o cast inseguro e permitir validação TypeScript. Ele deve ser substituído pelo resultado oficial do gerador após a aplicação em um ambiente descartável e, novamente, após a aplicação remota.

## Ordem obrigatória antes de aplicar

1. Instale Docker Desktop e autentique a Supabase CLI.
2. Vincule o projeto, sem colocar senha ou token em arquivos versionados:

   ```powershell
   npx supabase login
   npx supabase link --project-ref lzjkvgvlfupklpmytvbr
   npx supabase migration list
   ```

3. Execute `verification/2a_remote_schema_audit.sql` no SQL Editor do Supabase ou por uma conexão `psql` administrativa. Salve o resultado fora do Git. Qualquer linha nas consultas finais de diagnóstico é bloqueante; não apague nem corrija registros automaticamente.
4. Compare o remoto com as migrations versionadas:

   ```powershell
   npx supabase db diff --linked --schema public
   npx supabase db push --linked --dry-run
   ```

   O `db diff` usa um banco shadow em container e, portanto, requer Docker. Revise todo o SQL exibido. Se o remoto contiver `championship_settings`, `championship_categories` ou `competition_stages`, reconcilie seus nomes/colunas/constraints antes de continuar; `CREATE TABLE IF NOT EXISTS` sozinho não reconcilia uma tabela incompatível.

5. Confirme que a migration não contém operações destrutivas:

   ```powershell
   rg -n "DROP TABLE|TRUNCATE|DROP COLUMN|ALTER COLUMN.*TYPE|DELETE FROM .* WHERE|DELETE FROM .*;$" supabase/migrations/20260715120000_repair_core_rls_and_championship_foundation.sql
   ```

   O único `DELETE FROM` esperado está dentro de `delete_championship`, protegido por lock, autorização e verificação atômica de vínculos.

6. Faça backup lógico antes do push:

   ```powershell
   New-Item -ItemType Directory -Force ..\competition-conductor-backups
   npx supabase db dump --linked --schema public -f ..\competition-conductor-backups\before-2a-schema.sql
   npx supabase db dump --linked --data-only --use-copy -f ..\competition-conductor-backups\before-2a-data.sql
   ```

7. Valide primeiro em um projeto/branch descartável. Depois aplique:

   ```powershell
   npx supabase db push --linked --dry-run
   npx supabase db push --linked
   npx supabase db lint --linked --schema public --level error
   ```

8. Execute os testes transacionais (eles terminam com `ROLLBACK`):

   ```powershell
   psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/2a_rls_verification.sql
   ```

9. Regere os tipos oficiais e confira o diff antes de substituir o arquivo versionado:

   ```powershell
   npx supabase gen types typescript --project-id lzjkvgvlfupklpmytvbr --schema public > src/integrations/supabase/types.ts
   npx prettier --write src/integrations/supabase/types.ts
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

10. Execute novamente `verification/2a_remote_schema_audit.sql` e compare com o resultado anterior. Confirme policies, grants, triggers, constraints e índices.

Referências oficiais: [Supabase CLI/database](https://supabase.com/docs/reference/cli/supabase-db) e [geração de tipos](https://supabase.com/docs/guides/api/rest/generating-types).

## Decisões de segurança

- `owner`, `admin` e o papel já existente `editor` podem escrever; `viewer` é somente leitura.
- `organization_id` é validado por associação/papel no insert e é imutável em updates.
- autoria é preenchida por triggers com `auth.uid()`; updates preservam `created_by`.
- exclusão direta de campeonato e partida não tem policy. A exclusão de campeonato usa RPC com `FOR UPDATE` e bloqueia equipes/partidas; arquivamento permanece disponível pelo status.
- as FKs históricas preexistentes (`matches -> championships ON DELETE CASCADE`, por exemplo) não foram reescritas sem inspeção remota. A ausência de DELETE direto impede que clientes administrativos acionem essa cascata; qualquer alteração física dessas FKs exige auditoria remota específica.
- configurações, categorias e fases usam FK composta `(championship_id, organization_id)`.
