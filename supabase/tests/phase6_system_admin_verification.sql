-- Run after 20260728060000_phase6_system_admin_read_model.sql.

BEGIN;

DO $$
DECLARE
  function_name text;
BEGIN
  IF to_regclass('public.system_admins') IS NULL THEN
    RAISE EXCEPTION 'system_admins table is missing';
  END IF;
  IF to_regclass('public.admin_audit_logs') IS NULL THEN
    RAISE EXCEPTION 'admin_audit_logs table is missing';
  END IF;
  IF has_table_privilege('authenticated', 'public.system_admins', 'SELECT') THEN
    RAISE EXCEPTION 'authenticated must not read system_admins directly';
  END IF;
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
    FROM pg_trigger trigger
    WHERE trigger.tgrelid = 'public.system_admins'::regclass
      AND trigger.tgname = 'system_admins_audit_change'
      AND NOT trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'system admin assignment audit trigger is missing';
  END IF;
  IF has_function_privilege('anon', 'public.is_system_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute is_system_admin';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.is_system_admin()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authenticated must execute is_system_admin';
  END IF;

  FOREACH function_name IN ARRAY ARRAY[
    'get_system_admin_dashboard',
    'list_system_admin_organizations',
    'list_system_admin_users',
    'list_system_admin_championships',
    'list_system_admin_subscriptions'
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

  IF public.system_admin_page_size(NULL) <> 25
     OR public.system_admin_page_size(0) <> 1
     OR public.system_admin_page_size(500) <> 100 THEN
    RAISE EXCEPTION 'system admin page size bounds are invalid';
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
  IF public.is_system_admin() THEN
    RAISE EXCEPTION 'unknown authenticated user must not be a system admin';
  END IF;

  BEGIN
    PERFORM public.get_system_admin_dashboard();
    RAISE EXCEPTION 'non-admin unexpectedly accessed the system admin dashboard';
  EXCEPTION
    WHEN insufficient_privilege THEN
      NULL;
  END;
END;
$$;

RESET ROLE;

ROLLBACK;
