-- Run after 20260729030000_phase6_plan_catalog_administration.sql.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.get_system_admin_plan_catalog()') IS NULL
     OR to_regprocedure(
       'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)'
     ) IS NULL THEN
    RAISE EXCEPTION 'plan_catalog:required_rpc_missing';
  END IF;

  IF has_function_privilege('anon', 'public.get_system_admin_plan_catalog()', 'EXECUTE')
     OR has_function_privilege(
       'anon',
       'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'plan_catalog:anonymous_access_exposed';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.get_system_admin_plan_catalog()',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'plan_catalog:authenticated_rpc_unavailable';
  END IF;

  IF has_table_privilege('authenticated', 'public.saas_plan_versions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.saas_plan_versions', 'INSERT') THEN
    RAISE EXCEPTION 'plan_catalog:raw_table_write_exposed';
  END IF;

  IF pg_get_functiondef(
    'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)'::regprocedure
  ) NOT ILIKE '%assert_system_admin%'
     OR pg_get_functiondef(
       'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)'::regprocedure
     ) NOT ILIKE '%pg_advisory_xact_lock%'
     OR pg_get_functiondef(
       'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)'::regprocedure
     ) NOT ILIKE '%plan_version_published%' THEN
    RAISE EXCEPTION 'plan_catalog:security_or_audit_contract_missing';
  END IF;

  IF pg_get_functiondef(
    'public.publish_system_admin_plan_version(text,integer,text,text,integer,jsonb,text[],text)'::regprocedure
  ) ILIKE '%UPDATE public.organization_subscriptions%' THEN
    RAISE EXCEPTION 'plan_catalog:existing_subscriptions_must_be_preserved';
  END IF;
END;
$$;

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000099',
    'role', 'authenticated'
  )::text,
  true
);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  BEGIN
    PERFORM public.get_system_admin_plan_catalog();
    RAISE EXCEPTION 'plan_catalog:ordinary_user_was_not_blocked';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
ROLLBACK;
