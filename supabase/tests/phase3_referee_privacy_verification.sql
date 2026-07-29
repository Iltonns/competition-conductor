-- Run after 20260729080000_phase3_referee_privacy_and_detail.sql.
BEGIN;

DO $$
DECLARE
  safe_column text;
  sensitive_column text;
BEGIN
  IF to_regprocedure(
    'public.get_referee_management_detail(uuid,uuid)'
  ) IS NULL THEN
    RAISE EXCEPTION 'referee_privacy:detail_rpc_missing';
  END IF;

  IF has_table_privilege(
    'authenticated',
    'public.referees',
    'SELECT'
  ) OR has_table_privilege(
    'anon',
    'public.referees',
    'SELECT'
  ) THEN
    RAISE EXCEPTION 'referee_privacy:table_select_still_granted';
  END IF;

  FOREACH safe_column IN ARRAY ARRAY[
    'id',
    'organization_id',
    'full_name',
    'default_role',
    'photo_url',
    'status'
  ] LOOP
    IF NOT has_column_privilege(
      'authenticated',
      'public.referees',
      safe_column,
      'SELECT'
    ) THEN
      RAISE EXCEPTION 'referee_privacy:safe_column_not_readable:%', safe_column;
    END IF;
  END LOOP;

  FOREACH sensitive_column IN ARRAY ARRAY[
    'document_number',
    'email',
    'phone',
    'default_fee',
    'availability',
    'metadata'
  ] LOOP
    IF has_column_privilege(
      'authenticated',
      'public.referees',
      sensitive_column,
      'SELECT'
    ) THEN
      RAISE EXCEPTION 'referee_privacy:sensitive_column_exposed:%', sensitive_column;
    END IF;
  END LOOP;

  IF has_function_privilege(
    'anon',
    'public.get_referee_management_detail(uuid,uuid)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'authenticated',
    'public.get_referee_management_detail(uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'referee_privacy:invalid_rpc_privileges';
  END IF;

  IF pg_get_functiondef(
    'public.get_referee_management_detail(uuid,uuid)'::regprocedure
  ) NOT ILIKE '%phase2_championship_org%' THEN
    RAISE EXCEPTION 'referee_privacy:management_guard_missing';
  END IF;
END;
$$;

DO $$
DECLARE
  fixture_organization_id uuid;
  fixture_championship_id uuid;
  fixture_referee_id uuid;
BEGIN
  INSERT INTO public.organizations (
    name,
    slug
  )
  VALUES (
    'Verificacao de privacidade da arbitragem',
    'phase3-referee-privacy-' || left(gen_random_uuid()::text, 8)
  )
  RETURNING id INTO fixture_organization_id;

  INSERT INTO public.championships (
    organization_id,
    name,
    slug,
    status
  )
  VALUES (
    fixture_organization_id,
    'Campeonato descartavel da verificacao',
    'phase3-referee-privacy-' || left(gen_random_uuid()::text, 8),
    'draft'
  )
  RETURNING id INTO fixture_championship_id;

  INSERT INTO public.referees (
    organization_id,
    full_name,
    email,
    phone,
    document_number
  )
  VALUES (
    fixture_organization_id,
    'Arbitro descartavel da verificacao',
    'private@example.invalid',
    '+5500000000000',
    'DOCUMENTO-PRIVADO'
  )
  RETURNING id INTO fixture_referee_id;

  PERFORM set_config(
    'app_test.referee_privacy_championship_id',
    fixture_championship_id::text,
    true
  );
  PERFORM set_config(
    'app_test.referee_privacy_referee_id',
    fixture_referee_id::text,
    true
  );
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
    PERFORM public.get_referee_management_detail(
      current_setting('app_test.referee_privacy_championship_id')::uuid,
      current_setting('app_test.referee_privacy_referee_id')::uuid
    );
    RAISE EXCEPTION 'referee_privacy:detail_fail_open';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
SELECT true AS phase3_referee_privacy_verified;
ROLLBACK;
