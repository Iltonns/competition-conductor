-- Run after 20260728150000_phase6_operational_observability.sql.

BEGIN;

DO $$
DECLARE
  function_name text;
BEGIN
  IF to_regclass('public.platform_operational_events') IS NULL THEN
    RAISE EXCEPTION 'platform_operational_events table is missing';
  END IF;
  IF has_table_privilege(
    'authenticated',
    'public.platform_operational_events',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'authenticated must not read operational events directly';
  END IF;

  FOREACH function_name IN ARRAY ARRAY[
    'record_my_client_error',
    'get_platform_operational_status'
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
    PERFORM public.get_platform_operational_status();
    RAISE EXCEPTION 'non-admin unexpectedly accessed operational status';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

SELECT set_config('request.jwt.claim.sub', '', true);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  BEGIN
    PERFORM public.record_my_client_error(
      'TypeError',
      '01234567',
      '/dashboard'
    );
    RAISE EXCEPTION 'anonymous caller unexpectedly recorded a client error';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

ROLLBACK;
