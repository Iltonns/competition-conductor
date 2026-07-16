BEGIN;

SELECT plan(25);

SELECT has_table('public', 'team_edit_links', 'team_edit_links existe');
SELECT has_table('public', 'team_edit_link_events', 'eventos de auditoria existem');
SELECT has_table('public', 'team_edit_link_sessions', 'sessoes temporarias existem');
SELECT has_table('public', 'team_access_rate_limits', 'rate limiting existe');
SELECT has_table('public', 'team_access_security_events', 'eventos de seguranca existem');

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.team_edit_links'::regclass),
  true,
  'RLS ativo em team_edit_links'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.team_edit_link_events'::regclass),
  true,
  'RLS ativo em team_edit_link_events'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.team_edit_link_sessions'::regclass),
  true,
  'RLS ativo em sessoes'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.team_access_rate_limits'::regclass),
  true,
  'RLS ativo em rate limits'
);
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.team_access_security_events'::regclass),
  true,
  'RLS ativo em eventos de seguranca'
);

SELECT is(
  has_table_privilege('anon', 'public.team_edit_links', 'SELECT'),
  false,
  'anon nao le links diretamente'
);
SELECT is(
  has_table_privilege('anon', 'public.team_edit_links', 'INSERT'),
  false,
  'anon nao cria links diretamente'
);
SELECT is(
  has_table_privilege('anon', 'public.team_edit_links', 'UPDATE'),
  false,
  'anon nao altera links diretamente'
);
SELECT is(
  has_table_privilege('anon', 'public.team_edit_links', 'DELETE'),
  false,
  'anon nao apaga links diretamente'
);
SELECT is(
  has_column_privilege('authenticated', 'public.team_edit_links', 'token_hash', 'SELECT'),
  false,
  'authenticated nao consulta token_hash'
);

SELECT is(
  has_function_privilege(
    'service_role',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ),
  true,
  'service_role pode trocar token por sessao'
);
SELECT is(
  has_function_privilege(
    'anon',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ),
  false,
  'anon nao executa troca diretamente'
);
SELECT is(
  has_function_privilege(
    'authenticated',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ),
  false,
  'authenticated nao executa troca publica diretamente'
);

SELECT is(
  public.team_edit_permissions_are_valid(
    '{"edit_team_details": true, "remove_athletes": false}'::jsonb
  ),
  true,
  'permissoes booleanas conhecidas sao aceitas'
);
SELECT is(
  public.team_edit_permissions_are_valid('{"unknown": true}'::jsonb),
  false,
  'chaves desconhecidas sao rejeitadas'
);
SELECT is(
  public.team_edit_permissions_are_valid('{"edit_team_details": "yes"}'::jsonb),
  false,
  'valores nao booleanos sao rejeitados'
);

SELECT is(
  (
    SELECT access_state
    FROM public.consume_team_edit_token('short', 'short', 'short')
  ),
  'invalid',
  'entrada com formato invalido retorna estado generico'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'team_edit_links'
      AND indexname = 'team_edit_links_token_hash_idx'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'token_hash possui indice unico'
);
SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'team_edit_links'
      AND indexname = 'team_edit_links_one_current_idx'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'somente um link corrente por participacao'
);
SELECT is(
  has_function_privilege(
    'anon',
    'public.get_team_edit_session(text)',
    'EXECUTE'
  ),
  false,
  'anon nao consulta sessao diretamente'
);

SELECT * FROM finish();
ROLLBACK;
