-- Fase 6 / F6-RF01: catalogo comercial aprovado, limites por campeonato
-- e leitura publica segura dos planos.

ALTER TABLE public.saas_plan_versions
  ADD COLUMN IF NOT EXISTS monthly_price_cents integer,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BRL';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saas_plan_versions_monthly_price_check'
  ) THEN
    ALTER TABLE public.saas_plan_versions
      ADD CONSTRAINT saas_plan_versions_monthly_price_check
      CHECK (monthly_price_cents IS NULL OR monthly_price_cents >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'saas_plan_versions_currency_check'
  ) THEN
    ALTER TABLE public.saas_plan_versions
      ADD CONSTRAINT saas_plan_versions_currency_check
      CHECK (currency ~ '^[A-Z]{3}$');
  END IF;
END;
$$;

INSERT INTO public.saas_plan_versions (
  code, version, name, description, status, limits, modules,
  monthly_price_cents, currency
)
VALUES
  (
    'small_championships',
    1,
    'Campeonatos Pequenos',
    'Para campeonatos com ate 300 atletas e 3 patrocinadores.',
    'active',
    jsonb_build_object(
      'organizations', NULL,
      'active_championships', NULL,
      'teams', NULL,
      'users', NULL,
      'storage_bytes', NULL,
      'athletes_per_championship', 300,
      'sponsors_per_championship', 3
    ),
    ARRAY[
      'competition', 'sports', 'publishing', 'finance', 'notifications',
      'ad_free', 'custom_url', 'digital_match_report', 'attachments',
      'high_resolution_media', 'report_printing'
    ],
    2500,
    'BRL'
  ),
  (
    'intermediate_championships',
    1,
    'Campeonatos Intermediários',
    'Para campeonatos com ate 600 atletas e 6 patrocinadores.',
    'active',
    jsonb_build_object(
      'organizations', NULL,
      'active_championships', NULL,
      'teams', NULL,
      'users', NULL,
      'storage_bytes', NULL,
      'athletes_per_championship', 600,
      'sponsors_per_championship', 6
    ),
    ARRAY[
      'competition', 'sports', 'publishing', 'finance', 'notifications',
      'ad_free', 'custom_url', 'digital_match_report', 'attachments',
      'high_resolution_media', 'report_printing'
    ],
    3200,
    'BRL'
  ),
  (
    'large_championships',
    1,
    'Campeonatos Grandes',
    'Para campeonatos com ate 900 atletas e 12 patrocinadores.',
    'active',
    jsonb_build_object(
      'organizations', NULL,
      'active_championships', NULL,
      'teams', NULL,
      'users', NULL,
      'storage_bytes', NULL,
      'athletes_per_championship', 900,
      'sponsors_per_championship', 12
    ),
    ARRAY[
      'competition', 'sports', 'publishing', 'finance', 'notifications',
      'ad_free', 'custom_url', 'digital_match_report', 'attachments',
      'high_resolution_media', 'report_printing'
    ],
    4000,
    'BRL'
  ),
  (
    'professional_organizer',
    1,
    'Organizador Profissional',
    'Atletas e patrocinadores ilimitados, incorporacao HTML e API JSON.',
    'active',
    jsonb_build_object(
      'organizations', NULL,
      'active_championships', NULL,
      'teams', NULL,
      'users', NULL,
      'storage_bytes', NULL,
      'athletes_per_championship', NULL,
      'sponsors_per_championship', NULL
    ),
    ARRAY[
      'competition', 'sports', 'publishing', 'finance', 'notifications',
      'ad_free', 'custom_url', 'digital_match_report', 'attachments',
      'high_resolution_media', 'report_printing', 'html_embed', 'json_api'
    ],
    5500,
    'BRL'
  )
ON CONFLICT (code, version) DO NOTHING;

UPDATE public.organization_subscriptions subscription
SET
  plan_version_id = commercial_plan.id,
  updated_at = now(),
  metadata = subscription.metadata || jsonb_build_object(
    'migrated_from_plan_code', legacy_plan.code,
    'migrated_at', now()
  )
FROM public.saas_plan_versions legacy_plan
CROSS JOIN public.saas_plan_versions commercial_plan
WHERE subscription.plan_version_id = legacy_plan.id
  AND legacy_plan.code = 'starter'
  AND commercial_plan.code = 'small_championships'
  AND commercial_plan.version = 1;

UPDATE public.saas_plan_versions
SET status = 'retired', retired_at = now(), updated_at = now()
WHERE code = 'starter'
  AND status = 'active';

CREATE OR REPLACE FUNCTION public.tg_provision_organization_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_plan_id uuid;
BEGIN
  SELECT plan.id INTO selected_plan_id
  FROM public.saas_plan_versions plan
  WHERE plan.code = 'small_championships'
    AND plan.status = 'active'
  ORDER BY plan.version DESC
  LIMIT 1;

  IF selected_plan_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:active_default_plan_missing';
  END IF;

  INSERT INTO public.organization_subscriptions (
    organization_id, plan_version_id, status, current_period_ends_at,
    metadata, created_by, updated_by
  )
  VALUES (
    NEW.id, selected_plan_id, 'active', NEW.plan_expires_at,
    jsonb_build_object('provisioned_from_legacy_plan', NEW.plan),
    NEW.created_by, NEW.updated_by
  )
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.championship_resource_usage(
  p_championship_id uuid,
  p_resource text
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result bigint;
BEGIN
  CASE p_resource
    WHEN 'athletes_per_championship' THEN
      SELECT count(DISTINCT registration.athlete_id)
      INTO result
      FROM public.championship_team_athletes registration
      WHERE registration.championship_id = p_championship_id
        AND registration.active;
    WHEN 'sponsors_per_championship' THEN
      SELECT count(*)
      INTO result
      FROM public.sponsors sponsor
      WHERE sponsor.championship_id = p_championship_id
        AND sponsor.status <> 'archived';
    ELSE
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'subscription:unknown_championship_resource';
  END CASE;
  RETURN COALESCE(result, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_championship_limit(
  p_championship_id uuid,
  p_resource text,
  p_increment bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  configured_limit bigint;
  current_usage bigint;
  organization_id uuid;
  subscription_status text;
BEGIN
  IF p_increment < 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription:invalid_increment';
  END IF;

  SELECT championship.organization_id
  INTO organization_id
  FROM public.championships championship
  WHERE championship.id = p_championship_id;

  IF organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship:not_found';
  END IF;

  -- Serializa contagem e insercao por campeonato para impedir estouro concorrente.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('championship-plan-limit:' || p_championship_id::text, 0)
  );

  SELECT
    subscription.status,
    NULLIF(plan.limits->>p_resource, '')::bigint
  INTO subscription_status, configured_limit
  FROM public.organization_subscriptions subscription
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE subscription.organization_id = organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'subscription:not_provisioned';
  END IF;
  IF subscription_status = 'suspended' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'subscription:suspended';
  END IF;
  IF configured_limit IS NULL THEN
    RETURN;
  END IF;

  current_usage := public.championship_resource_usage(p_championship_id, p_resource);
  IF current_usage + p_increment > configured_limit THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:limit_exceeded',
      DETAIL = format(
        'resource=%s;used=%s;limit=%s;increment=%s',
        p_resource, current_usage, configured_limit, p_increment
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_championship_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  increment_value bigint := 1;
BEGIN
  IF TG_TABLE_NAME = 'championship_team_athletes' THEN
    IF NOT NEW.active OR (TG_OP = 'UPDATE' AND OLD.active) THEN
      RETURN NEW;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.championship_team_athletes registration
      WHERE registration.championship_id = NEW.championship_id
        AND registration.athlete_id = NEW.athlete_id
        AND registration.active
        AND (TG_OP = 'INSERT' OR registration.id <> NEW.id)
    ) THEN
      increment_value := 0;
    END IF;
    PERFORM public.assert_championship_limit(
      NEW.championship_id, 'athletes_per_championship', increment_value
    );
  ELSIF TG_TABLE_NAME = 'sponsors' THEN
    IF NEW.status = 'archived'
       OR (TG_OP = 'UPDATE' AND OLD.status <> 'archived') THEN
      RETURN NEW;
    END IF;
    PERFORM public.assert_championship_limit(
      NEW.championship_id, 'sponsors_per_championship', 1
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_championship_athlete_plan_limit
  ON public.championship_team_athletes;
CREATE TRIGGER enforce_championship_athlete_plan_limit
  BEFORE INSERT OR UPDATE OF active ON public.championship_team_athletes
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_championship_plan_limit();

DROP TRIGGER IF EXISTS enforce_championship_sponsor_plan_limit
  ON public.sponsors;
CREATE TRIGGER enforce_championship_sponsor_plan_limit
  BEFORE INSERT OR UPDATE OF status ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_championship_plan_limit();

CREATE OR REPLACE FUNCTION public.list_available_plans()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
        'modules', to_jsonb(plan.modules)
      )
      ORDER BY plan.monthly_price_cents, plan.name
    ),
    '[]'::jsonb
  )
  FROM public.saas_plan_versions plan
  WHERE plan.status = 'active'
    AND plan.effective_from <= now();
$$;

REVOKE ALL ON FUNCTION public.championship_resource_usage(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_championship_limit(uuid, text, bigint)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_enforce_championship_plan_limit()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_available_plans() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_available_plans() TO anon, authenticated;
