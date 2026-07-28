-- Execute apos 20260728010000_phase6_plan_limits_foundation.sql em homologacao.
BEGIN;

DO $$
DECLARE
  missing text[];
  sample_organization_id uuid;
  sample_plan_id uuid;
  sample_team_count bigint;
  limit_blocked boolean := false;
BEGIN
  IF to_regclass('public.saas_plan_versions') IS NULL
     OR to_regclass('public.organization_subscriptions') IS NULL THEN
    RAISE EXCEPTION 'Phase 6 plan/subscription tables are missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('plan_limit_snapshot(bigint,bigint)'),
    ('organization_resource_usage(uuid,text)'),
    ('assert_organization_limit(uuid,text,bigint)'),
    ('get_organization_subscription_context(uuid)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing Phase 6 functions: %', missing;
  END IF;

  IF has_table_privilege('authenticated', 'public.saas_plan_versions', 'SELECT')
     OR has_table_privilege('authenticated', 'public.saas_plan_versions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.organization_subscriptions', 'SELECT')
     OR has_table_privilege('authenticated', 'public.organization_subscriptions', 'UPDATE') THEN
    RAISE EXCEPTION 'Plan or subscription direct privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.assert_organization_limit(uuid,text,bigint)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.organization_resource_usage(uuid,text)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.get_organization_subscription_context(uuid)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Internal limit functions are exposed to client roles';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.get_organization_subscription_context(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Owner subscription context is not available to authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organizations organization
    LEFT JOIN public.organization_subscriptions subscription
      ON subscription.organization_id = organization.id
    WHERE subscription.id IS NULL
  ) THEN
    RAISE EXCEPTION 'At least one organization was not provisioned with a subscription';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_subscriptions subscription
    LEFT JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
    WHERE plan.id IS NULL
  ) THEN
    RAISE EXCEPTION 'At least one subscription references a missing plan';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.saas_plan_versions plan
    WHERE plan.code = 'starter'
      AND plan.status = 'active'
      AND plan.limits ?& ARRAY[
        'organizations',
        'active_championships',
        'teams',
        'users',
        'storage_bytes'
      ]
  ) THEN
    RAISE EXCEPTION 'The active starter plan or required limit keys are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'saas_plan_versions'
      AND indexname = 'saas_plan_versions_one_active_code'
  ) THEN
    RAISE EXCEPTION 'Active plan version uniqueness index is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'provision_organization_subscription' AND NOT tgisinternal
  )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'enforce_active_championship_limit' AND NOT tgisinternal
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'enforce_active_team_limit' AND NOT tgisinternal
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'enforce_organization_member_limit' AND NOT tgisinternal
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'enforce_organization_invitation_limit' AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION 'Required subscription provisioning/limit triggers are missing';
  END IF;

  IF (public.plan_limit_snapshot(8, 10)->>'state') <> 'warning'
     OR (public.plan_limit_snapshot(10, 10)->>'state') <> 'blocked'
     OR (public.plan_limit_snapshot(100, NULL)->>'state') <> 'unlimited' THEN
    RAISE EXCEPTION 'Limit warning/block state calculation is invalid';
  END IF;

  SELECT organization.id, subscription.plan_version_id
  INTO sample_organization_id, sample_plan_id
  FROM public.organizations organization
  JOIN public.organization_subscriptions subscription
    ON subscription.organization_id = organization.id
  WHERE subscription.status <> 'suspended'
  LIMIT 1;

  IF sample_organization_id IS NOT NULL THEN
    sample_team_count := public.organization_resource_usage(
      sample_organization_id,
      'teams'
    );
    UPDATE public.saas_plan_versions
    SET limits = jsonb_set(limits, '{teams}', to_jsonb(sample_team_count), true)
    WHERE id = sample_plan_id;

    BEGIN
      PERFORM public.assert_organization_limit(sample_organization_id, 'teams', 1);
    EXCEPTION
      WHEN SQLSTATE 'P0001' THEN
        limit_blocked := SQLERRM = 'subscription:limit_exceeded';
    END;

    IF NOT limit_blocked THEN
      RAISE EXCEPTION 'Backend team limit did not block the next resource';
    END IF;
  END IF;
END
$$;

ROLLBACK;
