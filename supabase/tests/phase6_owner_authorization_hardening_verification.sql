-- Run after 20260729050000_phase6_owner_authorization_hardening.sql.
BEGIN;

DO $$
DECLARE
  function_signature text;
BEGIN
  IF to_regprocedure('public.assert_organization_owner(uuid)') IS NULL THEN
    RAISE EXCEPTION 'owner_hardening:assertion_missing';
  END IF;

  IF pg_get_functiondef(
    'public.assert_organization_owner(uuid)'::regprocedure
  ) NOT ILIKE '%IS DISTINCT FROM%owner%' THEN
    RAISE EXCEPTION 'owner_hardening:null_safe_check_missing';
  END IF;

  IF pg_get_functiondef(
    'public.can_manage_organization(uuid)'::regprocedure
  ) NOT ILIKE '%COALESCE%' THEN
    RAISE EXCEPTION 'owner_hardening:manager_check_can_return_null';
  END IF;

  FOREACH function_signature IN ARRAY ARRAY[
    'get_organization_subscription_context(uuid)',
    'prepare_subscription_checkout(uuid,uuid,uuid)',
    'preview_organization_plan_change(uuid,uuid)'
  ] LOOP
    IF to_regprocedure('public.' || function_signature) IS NULL THEN
      RAISE EXCEPTION 'owner_hardening:public_wrapper_missing:%', function_signature;
    END IF;

    IF pg_get_functiondef(
      to_regprocedure('public.' || function_signature)
    ) NOT ILIKE '%assert_organization_owner%' THEN
      RAISE EXCEPTION 'owner_hardening:wrapper_not_protected:%', function_signature;
    END IF;
  END LOOP;

  IF has_function_privilege(
    'authenticated',
    'public.get_organization_subscription_context_owner_checked_source(uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.prepare_subscription_checkout_owner_checked_source(uuid,uuid,uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.preview_organization_plan_change_owner_checked_source(uuid,uuid)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.change_organization_member_role_manager_checked_source(uuid,uuid,public.app_role,text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.remove_organization_member_manager_checked_source(uuid,uuid,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'owner_hardening:internal_source_exposed';
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
    RAISE EXCEPTION 'owner_hardening:preview_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.get_organization_subscription_context(
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'owner_hardening:context_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.prepare_subscription_checkout(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'owner_hardening:checkout_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.change_organization_member_role(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'viewer',
      'Verificacao de bloqueio para usuario sem vinculo.'
    );
    RAISE EXCEPTION 'owner_hardening:role_change_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.remove_organization_member(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'Verificacao de bloqueio para usuario sem vinculo.'
    );
    RAISE EXCEPTION 'owner_hardening:member_removal_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
ROLLBACK;
