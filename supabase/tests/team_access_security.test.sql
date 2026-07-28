-- Verificacao transacional da seguranca dos links de edicao de equipe.
-- Nao depende de pgTAP para poder ser executada no SQL Editor e via psql.
BEGIN;

DO $$
DECLARE
  table_name text;
  access_state text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'team_edit_links',
    'team_edit_link_events',
    'team_edit_link_sessions',
    'team_access_rate_limits',
    'team_access_security_events'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NULL THEN
      RAISE EXCEPTION 'team_access:missing_table:%', table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class relation
      WHERE relation.oid = to_regclass('public.' || table_name)
        AND relation.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'team_access:rls_disabled:%', table_name;
    END IF;
  END LOOP;

  IF has_table_privilege('anon', 'public.team_edit_links', 'SELECT')
     OR has_table_privilege('anon', 'public.team_edit_links', 'INSERT')
     OR has_table_privilege('anon', 'public.team_edit_links', 'UPDATE')
     OR has_table_privilege('anon', 'public.team_edit_links', 'DELETE') THEN
    RAISE EXCEPTION 'team_access:anon_direct_table_access';
  END IF;

  IF has_column_privilege(
    'authenticated',
    'public.team_edit_links',
    'token_hash',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'team_access:authenticated_reads_token_hash';
  END IF;

  IF NOT has_function_privilege(
    'service_role',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'team_access:service_role_cannot_consume_token';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.consume_team_edit_token(text,text,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'team_access:public_can_consume_token_directly';
  END IF;

  IF NOT public.team_edit_permissions_are_valid(
    '{"edit_team_details": true, "remove_athletes": false}'::jsonb
  ) THEN
    RAISE EXCEPTION 'team_access:valid_permissions_rejected';
  END IF;

  IF public.team_edit_permissions_are_valid('{"unknown": true}'::jsonb)
     OR public.team_edit_permissions_are_valid(
       '{"edit_team_details": "yes"}'::jsonb
     ) THEN
    RAISE EXCEPTION 'team_access:invalid_permissions_accepted';
  END IF;

  SELECT result.access_state
  INTO access_state
  FROM public.consume_team_edit_token('short', 'short', 'short') result;

  IF access_state IS DISTINCT FROM 'invalid' THEN
    RAISE EXCEPTION 'team_access:invalid_input_leaked_state:%', access_state;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'team_edit_links'
      AND indexname = 'team_edit_links_token_hash_idx'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ) THEN
    RAISE EXCEPTION 'team_access:token_hash_unique_index_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'team_edit_links'
      AND indexname = 'team_edit_links_one_current_idx'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ) THEN
    RAISE EXCEPTION 'team_access:current_link_unique_index_missing';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.get_team_edit_session(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'team_access:anon_reads_session_directly';
  END IF;
END;
$$;

ROLLBACK;
