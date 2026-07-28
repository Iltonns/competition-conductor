-- Run after 20260728090000_phase6_support_mode_foundation.sql.

BEGIN;

DO $$
DECLARE
  function_name text;
BEGIN
  IF to_regclass('public.support_sessions') IS NULL THEN
    RAISE EXCEPTION 'support_sessions table is missing';
  END IF;
  IF has_table_privilege('authenticated', 'public.support_sessions', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read support_sessions directly';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'support_sessions'
      AND indexname = 'support_sessions_one_active_per_admin'
  ) THEN
    RAISE EXCEPTION 'active support session uniqueness is missing';
  END IF;

  FOREACH function_name IN ARRAY ARRAY[
    'get_my_active_support_session',
    'start_support_session',
    'get_support_session_context',
    'end_support_session'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_proc procedure
      JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = 'public'
        AND procedure.proname = function_name
        AND procedure.prosecdef
    ) THEN
      RAISE EXCEPTION '% must be SECURITY DEFINER', function_name;
    END IF;
  END LOOP;
END;
$$;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  BEGIN
    PERFORM public.get_my_active_support_session();
    RAISE EXCEPTION 'non-admin unexpectedly accessed support mode';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

ROLLBACK;
