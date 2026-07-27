-- Run after 20260727200000_phase5_championship_operational_settings.sql in staging.
BEGIN;

DO $$
DECLARE
  missing text[];
BEGIN
  IF to_regclass('public.championship_operational_settings') IS NULL THEN
    RAISE EXCEPTION 'championship_operational_settings is missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('can_manage_championship_settings(uuid)'),
    ('can_permanently_delete_championship(uuid)'),
    ('championship_dependency_summary(uuid,uuid)'),
    ('championship_dependency_total(jsonb)'),
    ('assert_championship_settings_manager(uuid,boolean)'),
    ('get_championship_operational_settings(uuid)'),
    ('save_championship_operational_settings(uuid,jsonb,text,text,jsonb,text[])'),
    ('archive_championship(uuid,text,text)'),
    ('delete_championship_permanently(uuid,text,text)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing Phase 5 settings functions: %', missing;
  END IF;

  IF has_table_privilege('anon', 'public.championship_operational_settings', 'SELECT')
     OR has_table_privilege('authenticated', 'public.championship_operational_settings', 'INSERT')
     OR has_table_privilege('authenticated', 'public.championship_operational_settings', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.championship_operational_settings', 'DELETE') THEN
    RAISE EXCEPTION 'Operational settings table privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.get_championship_operational_settings(uuid)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.save_championship_operational_settings(uuid,jsonb,text,text,jsonb,text[])',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.archive_championship(uuid,text,text)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.delete_championship_permanently(uuid,text,text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Anonymous settings RPC access is broader than expected';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.delete_championship(uuid)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Legacy championship deletion is still executable';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'championship_operational_settings'
      AND policyname = 'championship_operational_settings_owner_admin_select'
  ) THEN
    RAISE EXCEPTION 'Owner/admin operational settings policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'championships'
      AND policyname = 'championships_admin_update'
      AND qual LIKE '%can_manage_championship_settings%'
  ) THEN
    RAISE EXCEPTION 'Championship administrative update policy was not hardened';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'championships'
      AND cmd IN ('ALL', 'UPDATE')
      AND policyname <> 'championships_admin_update'
  ) THEN
    RAISE EXCEPTION 'An additional championship update policy bypasses the hardened policy';
  END IF;

  IF public.championship_dependency_total(
       '{"matches":2,"teams":1,"content":3}'::jsonb
     ) <> 6 THEN
    RAISE EXCEPTION 'Championship dependency total is invalid';
  END IF;

  IF public.audit_module_name('championship_operational_settings') <> 'governance' THEN
    RAISE EXCEPTION 'Operational settings audit module mapping is invalid';
  END IF;
END
$$;

ROLLBACK;
