# Fase 0 — Segurança, qualidade e baseline

## Estado

A fundação local da Fase 0 foi implementada. O gate remoto continua condicionado a
uma sessão administrativa da Supabase CLI e a uma conexão PostgreSQL descartável.
Nenhum token, senha ou URL de banco deve ser enviado por chat ou salvo no repositório.

## Alterações locais

- `.env` removido do índice Git e coberto pelo `.gitignore`.
- `.env.example` sem valores criado para documentar variáveis públicas e server-only.
- `supabase/config.toml` alinhado ao projeto já vinculado e usado pela aplicação.
- erros de lint corrigidos, incluindo o adapter tipado do guard System Admin.
- Vitest, cobertura, Playwright e Wrangler adicionados ao ambiente de desenvolvimento.
- CI criado para segurança de ambiente, lint, tipos, cobertura, build e smoke E2E.
- matriz RLS da Etapa 2C adicionada e agregador PowerShell criado.

## Observação sobre credenciais

O `.env` local continha somente nomes de URL, project ID, JWKS e publishable key;
nenhuma variável com nome de service role, secret ou password foi encontrada. A
publishable key é destinada ao cliente. Isso não prova que o histórico completo
nunca conteve outro segredo: qualquer ocorrência histórica deve ser auditada pelo
responsável do projeto e rotacionada no painel, sem reescrever o histórico publicado
que está integrado ao Lovable.

## Validação remota obrigatória

Execute localmente uma autenticação interativa da CLI. Não copie o token para
arquivos ou mensagens:

```powershell
npx supabase login
npx supabase link --project-ref lzjkvgvlfupklpmytvbr
npx supabase migration list --linked
npx supabase db lint --linked --schema public --level error
npx supabase db diff --linked --schema public
npx supabase db push --linked --dry-run
```

Revise integralmente o diff e o dry-run. Não aplique SQL destrutivo automaticamente.

## Tipos oficiais

Gere primeiro em arquivo temporário e compare antes de substituir:

```powershell
npx supabase gen types typescript --linked --schema public | Out-File -Encoding utf8 "$env:TEMP\is-arena-types.ts"
git diff --no-index -- src/integrations/supabase/types.ts "$env:TEMP\is-arena-types.ts"
```

Somente depois da revisão, substitua os tipos versionados e execute novamente
TypeScript, lint, testes e build.

## Matriz SQL/RLS

Use um banco descartável com todas as migrations aplicadas. Defina a conexão apenas
na sessão local e execute:

```powershell
$env:SUPABASE_DB_URL = "<defina localmente>"
powershell -ExecutionPolicy Bypass -File scripts/verify-phase0-supabase.ps1
Remove-Item Env:SUPABASE_DB_URL
```

O agregador executa:

1. fundação de campeonatos e isolamento de papéis/tenants;
2. administração de equipes;
3. elenco, comissão e responsáveis;
4. segurança dos links de edição de equipe.

Todos os testes transacionais terminam em `ROLLBACK`.

## Gates locais

```powershell
npm run verify:phase0
```

Para executar o E2E autenticado de leitura, forneça uma conta exclusiva de
homologação através de `E2E_USER_EMAIL` e `E2E_USER_PASSWORD` no ambiente seguro.
O teste é ignorado quando essas variáveis não existem e nenhuma credencial é salva.

## Critério de encerramento remoto

A Fase 0 só deve receber status de produção aprovada depois que:

- migrations locais e remotas estiverem reconciliadas;
- tipos oficiais estiverem regenerados;
- `db lint` estiver verde;
- todos os testes SQL/RLS passarem em ambiente descartável;
- o E2E autenticado passar com uma conta de homologação;
- qualquer segredo historicamente exposto tiver sido rotacionado.
