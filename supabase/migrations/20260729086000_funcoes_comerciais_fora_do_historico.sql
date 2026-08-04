-- Funções que existem em produção mas não são criadas por nenhuma migration.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): terceiro tipo de drift
-- encontrado, além das 14 tabelas e das 54 colunas fora do controle de versão.
-- Sem estas definições, os triggers e policies restaurados pela baseline não
-- podem ser criados em um banco vazio.
--
-- Aplicado no fim da cadeia: dependem de organization_subscriptions e do catálogo comercial.
--
-- Funções: change_organization_member_role_manager_checked_source, get_organization_subscription_context_owner_checked_source, prepare_subscription_checkout_owner_checked_source, preview_organization_plan_change_owner_checked_source, remove_organization_member_manager_checked_source.

CREATE OR REPLACE FUNCTION "public"."change_organization_member_role_manager_checked_source"("p_organization_id" "uuid", "p_user_id" "uuid", "p_new_role" "public"."app_role", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  actor_role public.app_role;
  old_role public.app_role;
  owner_count integer;
BEGIN
  actor_role := public.organization_effective_role(p_organization_id, auth.uid());
  old_role := public.organization_effective_role(p_organization_id, p_user_id);
  IF old_role IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:member_not_found';
  END IF;
  IF length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:reason_required';
  END IF;
  IF actor_role = 'admin'
     AND (old_role IN ('owner', 'admin') OR p_new_role IN ('owner', 'admin')) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:privilege_escalation';
  END IF;
  IF actor_role <> 'owner' AND actor_role <> 'admin' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  IF p_new_role = 'owner' AND actor_role <> 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:privilege_escalation';
  END IF;
  IF old_role = 'owner' AND p_new_role <> 'owner' THEN
    SELECT count(DISTINCT user_id) INTO owner_count
    FROM public.user_roles
    WHERE organization_id = p_organization_id AND role = 'owner';
    IF owner_count <= 1 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:last_owner';
    END IF;
  END IF;

  DELETE FROM public.user_roles
  WHERE organization_id = p_organization_id AND user_id = p_user_id;
  INSERT INTO public.user_roles (organization_id, user_id, role)
    VALUES (p_organization_id, p_user_id, p_new_role);
  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization_member', p_user_id, 'role_changed',
    jsonb_build_object('role', old_role), jsonb_build_object('role', p_new_role),
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_organization_subscription_context_owner_checked_source"("p_organization_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  result jsonb;
  plan_limits jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'subscription:authentication_required';
  END IF;
  IF public.organization_effective_role(p_organization_id, auth.uid()) <> 'owner' THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'subscription:owner_required';
  END IF;

  SELECT plan.limits INTO plan_limits
  FROM public.organization_subscriptions subscription
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE subscription.organization_id = p_organization_id;

  IF plan_limits IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'subscription:not_found';
  END IF;

  SELECT jsonb_build_object(
    'organization', jsonb_build_object(
      'id', organization.id,
      'name', organization.name
    ),
    'subscription', jsonb_build_object(
      'id', subscription.id,
      'status', subscription.status,
      'trial_ends_at', subscription.trial_ends_at,
      'current_period_starts_at', subscription.current_period_starts_at,
      'current_period_ends_at', subscription.current_period_ends_at,
      'provider_connected', subscription.provider IS NOT NULL
    ),
    'plan', jsonb_build_object(
      'id', plan.id,
      'code', plan.code,
      'version', plan.version,
      'name', plan.name,
      'description', plan.description,
      'modules', to_jsonb(plan.modules)
    ),
    'usage', jsonb_build_object(
      'organizations', public.plan_limit_snapshot(
        public.organization_resource_usage(p_organization_id, 'organizations'),
        NULLIF(plan_limits->>'organizations', '')::bigint
      ),
      'active_championships', public.plan_limit_snapshot(
        public.organization_resource_usage(p_organization_id, 'active_championships'),
        NULLIF(plan_limits->>'active_championships', '')::bigint
      ),
      'teams', public.plan_limit_snapshot(
        public.organization_resource_usage(p_organization_id, 'teams'),
        NULLIF(plan_limits->>'teams', '')::bigint
      ),
      'users', public.plan_limit_snapshot(
        public.organization_resource_usage(p_organization_id, 'users'),
        NULLIF(plan_limits->>'users', '')::bigint
      ),
      'storage_bytes', public.plan_limit_snapshot(
        public.organization_resource_usage(p_organization_id, 'storage_bytes'),
        NULLIF(plan_limits->>'storage_bytes', '')::bigint
      )
    )
  )
  INTO result
  FROM public.organizations organization
  JOIN public.organization_subscriptions subscription
    ON subscription.organization_id = organization.id
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE organization.id = p_organization_id;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."prepare_subscription_checkout_owner_checked_source"("p_organization_id" "uuid", "p_plan_version_id" "uuid", "p_client_request_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  selected_plan public.saas_plan_versions%ROWTYPE;
  checkout_order public.billing_checkout_orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'billing:authentication_required';
  END IF;
  IF public.organization_effective_role(p_organization_id, auth.uid()) <> 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'billing:owner_required';
  END IF;

  SELECT * INTO selected_plan
  FROM public.saas_plan_versions
  WHERE id = p_plan_version_id
    AND status = 'active'
    AND effective_from <= now()
    AND monthly_price_cents > 0;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'billing:plan_not_available';
  END IF;

  INSERT INTO public.billing_checkout_orders(
    organization_id, plan_version_id, order_nsu, client_request_id,
    amount_cents, currency, created_by
  )
  VALUES (
    p_organization_id,
    selected_plan.id,
    gen_random_uuid()::text,
    p_client_request_id,
    selected_plan.monthly_price_cents,
    selected_plan.currency,
    auth.uid()
  )
  ON CONFLICT (organization_id, client_request_id) DO UPDATE
    SET organization_id = EXCLUDED.organization_id
  RETURNING * INTO checkout_order;

  IF checkout_order.plan_version_id <> selected_plan.id THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'billing:idempotency_conflict';
  END IF;

  RETURN jsonb_build_object(
    'id', checkout_order.id,
    'order_nsu', checkout_order.order_nsu,
    'amount_cents', checkout_order.amount_cents,
    'currency', checkout_order.currency,
    'description', selected_plan.name || ' - mensalidade',
    'checkout_url', checkout_order.checkout_url,
    'status', checkout_order.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."preview_organization_plan_change_owner_checked_source"("p_organization_id" "uuid", "p_target_plan_version_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
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

CREATE OR REPLACE FUNCTION "public"."remove_organization_member_manager_checked_source"("p_organization_id" "uuid", "p_user_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  actor_role public.app_role;
  target_role public.app_role;
  owner_count integer;
BEGIN
  actor_role := public.organization_effective_role(p_organization_id, auth.uid());
  target_role := public.organization_effective_role(p_organization_id, p_user_id);
  IF target_role IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:member_not_found';
  END IF;
  IF actor_role <> 'owner' AND actor_role <> 'admin' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  IF actor_role = 'admin' AND target_role IN ('owner', 'admin') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:privilege_escalation';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:self_removal_not_allowed';
  END IF;
  IF length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:reason_required';
  END IF;
  IF target_role = 'owner' THEN
    SELECT count(DISTINCT user_id) INTO owner_count
    FROM public.user_roles
    WHERE organization_id = p_organization_id AND role = 'owner';
    IF owner_count <= 1 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:last_owner';
    END IF;
  END IF;

  DELETE FROM public.user_roles
  WHERE organization_id = p_organization_id AND user_id = p_user_id;
  DELETE FROM public.organization_members
  WHERE organization_id = p_organization_id AND user_id = p_user_id;
  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization_member', p_user_id, 'removed',
    jsonb_build_object('role', target_role),
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;
