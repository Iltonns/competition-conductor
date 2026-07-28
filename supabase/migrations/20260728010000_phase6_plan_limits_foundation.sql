-- Fase 6 / E6.1: catalogo versionado de planos, assinatura canonica,
-- medicao autoritativa e pontos de bloqueio no backend.
--
-- Os limites do plano inicial ficam NULL (ilimitados) de proposito: precos e
-- limites comerciais ainda sao uma decisao pendente no PRD. A estrutura e os
-- bloqueios ficam ativos assim que um valor for configurado no catalogo.

CREATE TABLE IF NOT EXISTS public.saas_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version integer NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  modules text[] NOT NULL DEFAULT ARRAY[]::text[],
  effective_from timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT saas_plan_versions_code_check
    CHECK (code ~ '^[a-z][a-z0-9_-]{1,49}$'),
  CONSTRAINT saas_plan_versions_version_check CHECK (version > 0),
  CONSTRAINT saas_plan_versions_status_check
    CHECK (status IN ('draft', 'active', 'retired')),
  CONSTRAINT saas_plan_versions_limits_object_check
    CHECK (jsonb_typeof(limits) = 'object'),
  CONSTRAINT saas_plan_versions_retirement_check
    CHECK (
      (status = 'retired' AND retired_at IS NOT NULL)
      OR (status <> 'retired' AND retired_at IS NULL)
    ),
  UNIQUE (code, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS saas_plan_versions_one_active_code
  ON public.saas_plan_versions (code)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS saas_plan_versions_status_effective_idx
  ON public.saas_plan_versions (status, effective_from DESC);

DROP TRIGGER IF EXISTS saas_plan_versions_updated_at ON public.saas_plan_versions;
CREATE TRIGGER saas_plan_versions_updated_at
  BEFORE UPDATE ON public.saas_plan_versions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.saas_plan_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saas_plan_versions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.saas_plan_versions TO service_role;

INSERT INTO public.saas_plan_versions (
  code,
  version,
  name,
  description,
  status,
  limits,
  modules
)
VALUES (
  'starter',
  1,
  'Starter',
  'Plano inicial migrado do cadastro legado. Limites comerciais aguardam definicao.',
  'active',
  jsonb_build_object(
    'organizations', NULL,
    'active_championships', NULL,
    'teams', NULL,
    'users', NULL,
    'storage_bytes', NULL
  ),
  ARRAY['competition', 'sports', 'publishing', 'finance', 'notifications']
)
ON CONFLICT (code, version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_version_id uuid NOT NULL
    REFERENCES public.saas_plan_versions(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz NOT NULL DEFAULT now(),
  current_period_ends_at timestamptz,
  cancelled_at timestamptz,
  suspended_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT organization_subscriptions_status_check
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
  CONSTRAINT organization_subscriptions_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT organization_subscriptions_trial_check
    CHECK (status <> 'trial' OR trial_ends_at IS NOT NULL),
  CONSTRAINT organization_subscriptions_cancelled_check
    CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL),
  CONSTRAINT organization_subscriptions_suspended_check
    CHECK (status <> 'suspended' OR suspended_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_subscriptions_provider_subscription_key
  ON public.organization_subscriptions (provider, provider_subscription_id)
  WHERE provider IS NOT NULL AND provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS organization_subscriptions_plan_status_idx
  ON public.organization_subscriptions (plan_version_id, status);

DROP TRIGGER IF EXISTS organization_subscriptions_updated_at
  ON public.organization_subscriptions;
CREATE TRIGGER organization_subscriptions_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_subscriptions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.organization_subscriptions TO service_role;

INSERT INTO public.organization_subscriptions (
  organization_id,
  plan_version_id,
  status,
  current_period_ends_at,
  metadata,
  created_by,
  updated_by
)
SELECT
  organization.id,
  plan.id,
  'active',
  organization.plan_expires_at,
  jsonb_build_object('migrated_from_legacy_plan', organization.plan),
  organization.created_by,
  organization.updated_by
FROM public.organizations organization
CROSS JOIN LATERAL (
  SELECT version.id
  FROM public.saas_plan_versions version
  WHERE version.code = CASE
    WHEN organization.plan = 'starter' THEN organization.plan
    ELSE 'starter'
  END
    AND version.status = 'active'
  ORDER BY version.version DESC
  LIMIT 1
) plan
ON CONFLICT (organization_id) DO NOTHING;

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
  WHERE plan.code = CASE WHEN NEW.plan = 'starter' THEN NEW.plan ELSE 'starter' END
    AND plan.status = 'active'
  ORDER BY plan.version DESC
  LIMIT 1;

  IF selected_plan_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:active_starter_plan_missing';
  END IF;

  INSERT INTO public.organization_subscriptions (
    organization_id,
    plan_version_id,
    status,
    current_period_ends_at,
    metadata,
    created_by,
    updated_by
  )
  VALUES (
    NEW.id,
    selected_plan_id,
    'active',
    NEW.plan_expires_at,
    jsonb_build_object('migrated_from_legacy_plan', NEW.plan),
    NEW.created_by,
    NEW.updated_by
  )
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provision_organization_subscription ON public.organizations;
CREATE TRIGGER provision_organization_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.tg_provision_organization_subscription();

CREATE OR REPLACE FUNCTION public.plan_limit_snapshot(
  p_used bigint,
  p_limit bigint
)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'used', p_used,
    'limit', p_limit,
    'percentage', CASE
      WHEN p_limit IS NULL THEN NULL
      WHEN p_limit = 0 AND p_used = 0 THEN 0
      WHEN p_limit = 0 THEN 100
      ELSE LEAST(100, round((p_used::numeric / p_limit::numeric) * 100, 2))
    END,
    'state', CASE
      WHEN p_limit IS NULL THEN 'unlimited'
      WHEN p_used >= p_limit THEN 'blocked'
      WHEN p_limit > 0 AND p_used::numeric / p_limit::numeric >= 0.8 THEN 'warning'
      ELSE 'ok'
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.organization_resource_usage(
  p_organization_id uuid,
  p_resource text
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  result bigint := 0;
BEGIN
  CASE p_resource
    WHEN 'organizations' THEN
      SELECT count(*) INTO result
      FROM public.organizations organization
      WHERE public.organization_effective_role(organization.id, auth.uid()) = 'owner';
    WHEN 'active_championships' THEN
      SELECT count(*) INTO result
      FROM public.championships championship
      WHERE championship.organization_id = p_organization_id
        AND championship.status::text IN ('active', 'published');
    WHEN 'teams' THEN
      SELECT count(*) INTO result
      FROM public.teams team
      WHERE team.organization_id = p_organization_id
        AND team.status = 'active';
    WHEN 'users' THEN
      SELECT
        (SELECT count(*)
         FROM public.organization_members member
         WHERE member.organization_id = p_organization_id)
        +
        (SELECT count(*)
         FROM public.organization_invitations invitation
         WHERE invitation.organization_id = p_organization_id
           AND invitation.status = 'pending'
           AND invitation.expires_at > now())
      INTO result;
    WHEN 'storage_bytes' THEN
      SELECT COALESCE(sum((object.metadata->>'size')::bigint), 0)
      INTO result
      FROM storage.objects object
      WHERE object.metadata->>'size' ~ '^[0-9]+$'
        AND (
          (
            object.bucket_id IN (
              'championship-media',
              'match-report-attachments',
              'financial-attachments'
            )
            AND (storage.foldername(object.name))[1] = p_organization_id::text
          )
          OR (
            object.bucket_id = 'team-media'
            AND EXISTS (
              SELECT 1
              FROM public.teams team
              WHERE team.organization_id = p_organization_id
                AND (
                  strpos(COALESCE(team.crest_url, ''), '/' || object.name) > 0
                  OR strpos(COALESCE(team.cover_url, ''), '/' || object.name) > 0
                )
            )
          )
        );
    ELSE
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'subscription:unknown_resource';
  END CASE;
  RETURN COALESCE(result, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_organization_limit(
  p_organization_id uuid,
  p_resource text,
  p_increment bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  subscription_status text;
  plan_limits jsonb;
  configured_limit bigint;
  current_usage bigint;
BEGIN
  IF p_increment < 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription:invalid_increment';
  END IF;

  SELECT subscription.status, plan.limits
  INTO subscription_status, plan_limits
  FROM public.organization_subscriptions subscription
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE subscription.organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:not_provisioned';
  END IF;
  IF subscription_status = 'suspended' THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'subscription:suspended';
  END IF;
  IF NOT (plan_limits ? p_resource) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription:unknown_resource';
  END IF;

  configured_limit := NULLIF(plan_limits->>p_resource, '')::bigint;
  IF configured_limit IS NULL THEN
    RETURN;
  END IF;

  current_usage := public.organization_resource_usage(
    p_organization_id,
    p_resource
  );
  IF current_usage + p_increment > configured_limit THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:limit_exceeded',
      DETAIL = format(
        'resource=%s;used=%s;limit=%s;increment=%s',
        p_resource,
        current_usage,
        configured_limit,
        p_increment
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_enforce_organization_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  increment_value bigint := 1;
  member_email text;
BEGIN
  IF TG_TABLE_NAME = 'championships' THEN
    IF NEW.status::text NOT IN ('active', 'published')
       OR (
         TG_OP = 'UPDATE'
         AND OLD.status::text IN ('active', 'published')
       ) THEN
      RETURN NEW;
    END IF;
    PERFORM public.assert_organization_limit(
      NEW.organization_id,
      'active_championships',
      1
    );
  ELSIF TG_TABLE_NAME = 'teams' THEN
    IF NEW.status <> 'active'
       OR (TG_OP = 'UPDATE' AND OLD.status = 'active') THEN
      RETURN NEW;
    END IF;
    PERFORM public.assert_organization_limit(NEW.organization_id, 'teams', 1);
  ELSIF TG_TABLE_NAME = 'organization_invitations' THEN
    IF NEW.status <> 'pending'
       OR (TG_OP = 'UPDATE' AND OLD.status = 'pending') THEN
      RETURN NEW;
    END IF;
    PERFORM public.assert_organization_limit(NEW.organization_id, 'users', 1);
  ELSIF TG_TABLE_NAME = 'organization_members' THEN
    SELECT lower(profile.email) INTO member_email
    FROM public.profiles profile
    WHERE profile.id = NEW.user_id;

    IF member_email IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.organization_invitations invitation
      WHERE invitation.organization_id = NEW.organization_id
        AND lower(invitation.email) = member_email
        AND invitation.status = 'pending'
        AND invitation.expires_at > now()
    ) THEN
      increment_value := 0;
    END IF;
    PERFORM public.assert_organization_limit(
      NEW.organization_id,
      'users',
      increment_value
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_active_championship_limit ON public.championships;
CREATE TRIGGER enforce_active_championship_limit
  BEFORE INSERT OR UPDATE OF status ON public.championships
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_organization_limit();

DROP TRIGGER IF EXISTS enforce_active_team_limit ON public.teams;
CREATE TRIGGER enforce_active_team_limit
  BEFORE INSERT OR UPDATE OF status ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_organization_limit();

DROP TRIGGER IF EXISTS enforce_organization_member_limit
  ON public.organization_members;
CREATE TRIGGER enforce_organization_member_limit
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_organization_limit();

DROP TRIGGER IF EXISTS enforce_organization_invitation_limit
  ON public.organization_invitations;
CREATE TRIGGER enforce_organization_invitation_limit
  BEFORE INSERT OR UPDATE OF status ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_organization_limit();

CREATE OR REPLACE FUNCTION public.get_organization_subscription_context(
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
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

REVOKE ALL ON FUNCTION public.tg_provision_organization_subscription()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.plan_limit_snapshot(bigint, bigint)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.organization_resource_usage(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_organization_limit(uuid, text, bigint)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_enforce_organization_limit()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_organization_subscription_context(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_subscription_context(uuid)
  TO authenticated;

