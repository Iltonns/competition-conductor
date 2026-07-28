-- Run after 20260728120000_phase6_admin_audit_directory.sql.

BEGIN;

DO $$
BEGIN
  IF has_table_privilege('authenticated', 'public.admin_audit_logs', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read admin_audit_logs directly';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger trigger
    WHERE trigger.tgrelid = 'public.admin_audit_logs'::regclass
      AND trigger.tgname = 'admin_audit_logs_immutable'
      AND NOT trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'admin audit immutability trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'admin_audit_logs'
      AND indexname = 'admin_audit_logs_action_occurred_idx'
  ) THEN
    RAISE EXCEPTION 'admin audit action index is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'public'
      AND procedure.proname = 'get_system_admin_audit_logs'
      AND procedure.prosecdef
  ) THEN
    RAISE EXCEPTION 'admin audit RPC must be SECURITY DEFINER';
  END IF;
END;
$$;

DO $$
DECLARE
  sanitized jsonb;
BEGIN
  sanitized := public.sanitize_admin_audit_json(
    '{"safe":"visible","password":"plain","nested":{"access_token":"secret"}}'::jsonb
  );

  IF sanitized->>'safe' <> 'visible'
    OR sanitized->>'password' <> '[REDACTED]'
    OR sanitized->'nested'->>'access_token' <> '[REDACTED]'
  THEN
    RAISE EXCEPTION 'admin audit recursive sanitization failed';
  END IF;
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
    PERFORM public.get_system_admin_audit_logs();
    RAISE EXCEPTION 'non-admin unexpectedly accessed administrative audit';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

ROLLBACK;
