-- Fase 6 / F6-RF01 e F6-RF02: previa autoritativa de renovacao,
-- upgrade e downgrade antes do checkout.

CREATE OR REPLACE FUNCTION public.preview_organization_plan_change(
  p_organization_id uuid,
  p_target_plan_version_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_plan public.saas_plan_versions%ROWTYPE;
  target_plan public.saas_plan_versions%ROWTYPE;
  resource_key text;
  resource_used bigint;
  current_limit bigint;
  target_limit bigint;
  resource_impacts jsonb := '[]'::jsonb;
  lost_modules text[];
  has_restrictions boolean := false;
  athlete_limit bigint;
  sponsor_limit bigint;
  athlete_championships_over_limit bigint := 0;
  sponsor_championships_over_limit bigint := 0;
  max_athletes_in_championship bigint := 0;
  max_sponsors_in_championship bigint := 0;
  change_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'subscription:authentication_required';
  END IF;
  IF public.organization_effective_role(p_organization_id, auth.uid()) <> 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'subscription:owner_required';
  END IF;

  SELECT plan.*
  INTO current_plan
  FROM public.organization_subscriptions subscription
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE subscription.organization_id = p_organization_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription:not_provisioned';
  END IF;

  SELECT *
  INTO target_plan
  FROM public.saas_plan_versions plan
  WHERE plan.id = p_target_plan_version_id
    AND plan.status = 'active'
    AND plan.effective_from <= now()
    AND plan.monthly_price_cents > 0;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'subscription:target_plan_unavailable';
  END IF;

  SELECT COALESCE(array_agg(module_name ORDER BY module_name), ARRAY[]::text[])
  INTO lost_modules
  FROM unnest(current_plan.modules) module_name
  WHERE NOT (module_name = ANY(target_plan.modules));

  has_restrictions := cardinality(lost_modules) > 0;

  FOREACH resource_key IN ARRAY ARRAY[
    'organizations',
    'active_championships',
    'teams',
    'users',
    'storage_bytes'
  ] LOOP
    resource_used := public.organization_resource_usage(p_organization_id, resource_key);
    current_limit := NULLIF(current_plan.limits->>resource_key, '')::bigint;
    target_limit := NULLIF(target_plan.limits->>resource_key, '')::bigint;

    resource_impacts := resource_impacts || jsonb_build_array(
      jsonb_build_object(
        'resource', resource_key,
        'used', resource_used,
        'current_limit', current_limit,
        'target_limit', target_limit,
        'limit_reduced',
          target_limit IS NOT NULL
          AND (current_limit IS NULL OR target_limit < current_limit),
        'exceeds_target', target_limit IS NOT NULL AND resource_used > target_limit
      )
    );

    IF target_limit IS NOT NULL
       AND (
         current_limit IS NULL
         OR target_limit < current_limit
         OR resource_used > target_limit
       ) THEN
      has_restrictions := true;
    END IF;
  END LOOP;

  athlete_limit := NULLIF(
    target_plan.limits->>'athletes_per_championship',
    ''
  )::bigint;
  sponsor_limit := NULLIF(
    target_plan.limits->>'sponsors_per_championship',
    ''
  )::bigint;

  SELECT
    COALESCE(max(usage_count), 0),
    count(*) FILTER (WHERE athlete_limit IS NOT NULL AND usage_count > athlete_limit)
  INTO max_athletes_in_championship, athlete_championships_over_limit
  FROM (
    SELECT
      championship.id,
      count(DISTINCT registration.athlete_id) FILTER (WHERE registration.active) AS usage_count
    FROM public.championships championship
    LEFT JOIN public.championship_team_athletes registration
      ON registration.championship_id = championship.id
    WHERE championship.organization_id = p_organization_id
    GROUP BY championship.id
  ) championship_usage;

  SELECT
    COALESCE(max(usage_count), 0),
    count(*) FILTER (WHERE sponsor_limit IS NOT NULL AND usage_count > sponsor_limit)
  INTO max_sponsors_in_championship, sponsor_championships_over_limit
  FROM (
    SELECT
      championship.id,
      count(sponsor.id) FILTER (WHERE sponsor.status <> 'archived') AS usage_count
    FROM public.championships championship
    LEFT JOIN public.sponsors sponsor ON sponsor.championship_id = championship.id
    WHERE championship.organization_id = p_organization_id
    GROUP BY championship.id
  ) championship_usage;

  IF (
    athlete_limit IS NOT NULL
    AND (
      NULLIF(current_plan.limits->>'athletes_per_championship', '')::bigint IS NULL
      OR athlete_limit
        < NULLIF(current_plan.limits->>'athletes_per_championship', '')::bigint
      OR athlete_championships_over_limit > 0
    )
  ) OR (
    sponsor_limit IS NOT NULL
    AND (
      NULLIF(current_plan.limits->>'sponsors_per_championship', '')::bigint IS NULL
      OR sponsor_limit
        < NULLIF(current_plan.limits->>'sponsors_per_championship', '')::bigint
      OR sponsor_championships_over_limit > 0
    )
  ) THEN
    has_restrictions := true;
  END IF;

  change_type := CASE
    WHEN current_plan.id = target_plan.id THEN 'renewal'
    WHEN has_restrictions THEN 'downgrade'
    ELSE 'upgrade'
  END;

  RETURN jsonb_build_object(
    'change_type', change_type,
    'has_restrictions', has_restrictions,
    'data_preserved', true,
    'enforcement', 'new_writes_only',
    'current_plan', jsonb_build_object(
      'id', current_plan.id,
      'code', current_plan.code,
      'version', current_plan.version,
      'name', current_plan.name,
      'monthly_price_cents', current_plan.monthly_price_cents
    ),
    'target_plan', jsonb_build_object(
      'id', target_plan.id,
      'code', target_plan.code,
      'version', target_plan.version,
      'name', target_plan.name,
      'monthly_price_cents', target_plan.monthly_price_cents
    ),
    'lost_modules', to_jsonb(lost_modules),
    'resource_impacts', resource_impacts,
    'championship_impacts', jsonb_build_object(
      'athletes_per_championship_limit', athlete_limit,
      'sponsors_per_championship_limit', sponsor_limit,
      'championships_over_athlete_limit', athlete_championships_over_limit,
      'championships_over_sponsor_limit', sponsor_championships_over_limit,
      'max_athletes_in_championship', max_athletes_in_championship,
      'max_sponsors_in_championship', max_sponsors_in_championship
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_organization_plan_change(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_organization_plan_change(uuid, uuid)
  TO authenticated;
