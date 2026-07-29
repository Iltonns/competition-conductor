-- Run after 20260729040000_phase6_plan_change_preview.sql.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.preview_organization_plan_change(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'plan_change_preview:rpc_missing';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.preview_organization_plan_change(uuid,uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.preview_organization_plan_change(uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'plan_change_preview:invalid_privileges';
  END IF;

  IF pg_get_functiondef(
    'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
  ) NOT ILIKE '%organization_effective_role%'
     OR pg_get_functiondef(
       'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
     ) NOT ILIKE '%data_preserved%'
     OR pg_get_functiondef(
       'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
     ) NOT ILIKE '%new_writes_only%' THEN
    RAISE EXCEPTION 'plan_change_preview:authorization_or_preservation_contract_missing';
  END IF;

  IF pg_get_functiondef(
    'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
  ) ILIKE '%UPDATE %'
     OR pg_get_functiondef(
       'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
     ) ILIKE '%DELETE %'
     OR pg_get_functiondef(
       'public.preview_organization_plan_change(uuid,uuid)'::regprocedure
     ) ILIKE '%INSERT %' THEN
    RAISE EXCEPTION 'plan_change_preview:read_only_contract_broken';
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
    PERFORM public.preview_organization_plan_change(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'plan_change_preview:ordinary_user_was_not_blocked';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
ROLLBACK;
