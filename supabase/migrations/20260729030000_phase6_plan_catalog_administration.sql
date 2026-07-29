-- Fase 6 / F6-RF01 e F6-RF04: publicacao administrativa auditada
-- de novas versoes dos planos comerciais.

CREATE OR REPLACE FUNCTION public.get_system_admin_plan_catalog()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', plan.id,
        'code', plan.code,
        'version', plan.version,
        'name', plan.name,
        'description', plan.description,
        'monthly_price_cents', plan.monthly_price_cents,
        'currency', plan.currency,
        'limits', plan.limits,
        'modules', to_jsonb(plan.modules),
        'effective_from', plan.effective_from,
        'subscriptions_count', (
          SELECT count(*)
          FROM public.organization_subscriptions subscription
          JOIN public.saas_plan_versions subscribed_plan
            ON subscribed_plan.id = subscription.plan_version_id
          WHERE subscribed_plan.code = plan.code
        )
      )
      ORDER BY plan.monthly_price_cents, plan.name
    ),
    '[]'::jsonb
  )
  INTO result
  FROM public.saas_plan_versions plan
  WHERE plan.status = 'active'
    AND plan.effective_from <= now();

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_system_admin_plan_version(
  p_code text,
  p_expected_active_version integer,
  p_name text,
  p_description text,
  p_monthly_price_cents integer,
  p_limits jsonb,
  p_modules text[],
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_plan public.saas_plan_versions%ROWTYPE;
  published_plan public.saas_plan_versions%ROWTYPE;
  next_version integer;
  normalized_modules text[];
  limit_key text;
  allowed_limits constant text[] := ARRAY[
    'organizations',
    'active_championships',
    'teams',
    'users',
    'storage_bytes',
    'athletes_per_championship',
    'sponsors_per_championship'
  ];
  allowed_modules constant text[] := ARRAY[
    'competition',
    'sports',
    'publishing',
    'finance',
    'notifications',
    'ad_free',
    'custom_url',
    'digital_match_report',
    'attachments',
    'high_resolution_media',
    'report_printing',
    'html_embed',
    'json_api'
  ];
BEGIN
  PERFORM public.assert_system_admin();

  IF length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:reason_required';
  END IF;
  IF COALESCE(p_code, '') !~ '^[a-z][a-z0-9_-]{1,49}$'
     OR p_expected_active_version IS NULL
     OR p_expected_active_version < 1
     OR length(btrim(COALESCE(p_name, ''))) NOT BETWEEN 3 AND 120
     OR length(COALESCE(p_description, '')) > 500 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:invalid_identity';
  END IF;
  IF p_monthly_price_cents IS NULL OR p_monthly_price_cents <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:invalid_price';
  END IF;
  IF jsonb_typeof(p_limits) <> 'object'
     OR (SELECT count(*) FROM jsonb_object_keys(p_limits)) <> cardinality(allowed_limits)
     OR EXISTS (
       SELECT 1
       FROM jsonb_object_keys(p_limits) key
       WHERE NOT (key = ANY(allowed_limits))
     )
     OR EXISTS (
       SELECT 1
       FROM unnest(allowed_limits) expected_key
       WHERE NOT (p_limits ? expected_key)
     ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:invalid_limits';
  END IF;

  FOREACH limit_key IN ARRAY allowed_limits LOOP
    IF p_limits->limit_key <> 'null'::jsonb AND (
      jsonb_typeof(p_limits->limit_key) <> 'number'
      OR (p_limits->>limit_key)::numeric < 0
      OR trunc((p_limits->>limit_key)::numeric) <> (p_limits->>limit_key)::numeric
      OR (p_limits->>limit_key)::numeric > 9223372036854775807
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:invalid_limit_value';
    END IF;
  END LOOP;

  SELECT array_agg(DISTINCT module_name ORDER BY module_name)
  INTO normalized_modules
  FROM unnest(COALESCE(p_modules, ARRAY[]::text[])) module_name;

  IF normalized_modules IS NULL
     OR NOT normalized_modules @> ARRAY[
       'competition', 'sports', 'publishing', 'finance', 'notifications'
     ]
     OR EXISTS (
       SELECT 1
       FROM unnest(normalized_modules) module_name
       WHERE module_name IS NULL
         OR NOT (module_name = ANY(allowed_modules))
     ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'plan_catalog:invalid_modules';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('saas-plan:' || p_code, 0));

  SELECT *
  INTO current_plan
  FROM public.saas_plan_versions plan
  WHERE plan.code = p_code
    AND plan.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'plan_catalog:active_plan_not_found';
  END IF;
  IF current_plan.version <> p_expected_active_version THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'plan_catalog:version_conflict';
  END IF;

  SELECT COALESCE(max(plan.version), 0) + 1
  INTO next_version
  FROM public.saas_plan_versions plan
  WHERE plan.code = p_code;

  UPDATE public.saas_plan_versions
  SET
    status = 'retired',
    retired_at = now(),
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = current_plan.id;

  INSERT INTO public.saas_plan_versions (
    code,
    version,
    name,
    description,
    status,
    limits,
    modules,
    effective_from,
    monthly_price_cents,
    currency,
    created_by,
    updated_by
  )
  VALUES (
    p_code,
    next_version,
    btrim(p_name),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    'active',
    p_limits,
    normalized_modules,
    now(),
    p_monthly_price_cents,
    'BRL',
    auth.uid(),
    auth.uid()
  )
  RETURNING * INTO published_plan;

  INSERT INTO public.admin_audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    reason,
    old_data,
    new_data,
    context
  )
  VALUES (
    auth.uid(),
    'plan_version_published',
    'saas_plan_version',
    published_plan.id::text,
    btrim(p_reason),
    jsonb_build_object(
      'id', current_plan.id,
      'code', current_plan.code,
      'version', current_plan.version,
      'name', current_plan.name,
      'description', current_plan.description,
      'monthly_price_cents', current_plan.monthly_price_cents,
      'currency', current_plan.currency,
      'limits', current_plan.limits,
      'modules', to_jsonb(current_plan.modules),
      'status', current_plan.status
    ),
    jsonb_build_object(
      'id', published_plan.id,
      'code', published_plan.code,
      'version', published_plan.version,
      'name', published_plan.name,
      'description', published_plan.description,
      'monthly_price_cents', published_plan.monthly_price_cents,
      'currency', published_plan.currency,
      'limits', published_plan.limits,
      'modules', to_jsonb(published_plan.modules),
      'status', published_plan.status
    ),
    jsonb_build_object(
      'source', 'system_admin_plan_catalog',
      'subscriptions_migrated', false
    )
  );

  RETURN jsonb_build_object(
    'id', published_plan.id,
    'code', published_plan.code,
    'version', published_plan.version,
    'effective_from', published_plan.effective_from
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_system_admin_plan_catalog()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_system_admin_plan_catalog()
  TO authenticated;

REVOKE ALL ON FUNCTION public.publish_system_admin_plan_version(
  text, integer, text, text, integer, jsonb, text[], text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_system_admin_plan_version(
  text, integer, text, text, integer, jsonb, text[], text
) TO authenticated;
