-- Run after 20260728210000_phase6_commercial_plan_catalog.sql.
BEGIN;

DO $$
DECLARE
  expected record;
  actual record;
BEGIN
  FOR expected IN
    SELECT *
    FROM (VALUES
      ('small_championships', 2500, 300, 3),
      ('intermediate_championships', 3200, 600, 6),
      ('large_championships', 4000, 900, 12),
      ('professional_organizer', 5500, NULL::integer, NULL::integer)
    ) values_table(code, price, athlete_limit, sponsor_limit)
  LOOP
    SELECT
      plan.monthly_price_cents AS price,
      (plan.limits->>'athletes_per_championship')::integer AS athlete_limit,
      (plan.limits->>'sponsors_per_championship')::integer AS sponsor_limit,
      plan.modules
    INTO actual
    FROM public.saas_plan_versions plan
    WHERE plan.code = expected.code
      AND plan.status = 'active';

    IF NOT FOUND
       OR actual.price <> expected.price
       OR actual.athlete_limit IS DISTINCT FROM expected.athlete_limit
       OR actual.sponsor_limit IS DISTINCT FROM expected.sponsor_limit THEN
      RAISE EXCEPTION 'commercial_plan:invalid_catalog:%', expected.code;
    END IF;

    IF expected.code = 'professional_organizer'
       AND NOT (actual.modules @> ARRAY['html_embed', 'json_api']) THEN
      RAISE EXCEPTION 'commercial_plan:professional_modules_missing';
    END IF;

    IF expected.code <> 'professional_organizer'
       AND actual.modules && ARRAY['html_embed', 'json_api'] THEN
      RAISE EXCEPTION 'commercial_plan:premium_module_leak:%', expected.code;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.organization_subscriptions subscription
    JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
    WHERE plan.code = 'starter'
  ) THEN
    RAISE EXCEPTION 'commercial_plan:legacy_subscription_not_migrated';
  END IF;

  IF to_regprocedure('public.assert_championship_limit(uuid,text,bigint)') IS NULL
     OR to_regprocedure('public.list_available_plans()') IS NULL THEN
    RAISE EXCEPTION 'commercial_plan:required_rpc_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_championship_athlete_plan_limit'
      AND tgrelid = 'public.championship_team_athletes'::regclass
      AND NOT tgisinternal
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'enforce_championship_sponsor_plan_limit'
      AND tgrelid = 'public.sponsors'::regclass
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'commercial_plan:limit_trigger_missing';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'public.assert_championship_limit(uuid,text,bigint)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'commercial_plan:internal_assertion_exposed';
  END IF;

  IF NOT has_function_privilege(
    'anon',
    'public.list_available_plans()',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'commercial_plan:catalog_not_public';
  END IF;
END;
$$;

ROLLBACK;
