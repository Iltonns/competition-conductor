-- Phase 6 / F6-RF04: fail-closed System Admin and read-only operational views.

CREATE TABLE IF NOT EXISTS public.system_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revoked_reason text,
  CONSTRAINT system_admins_reason_check CHECK (length(btrim(reason)) BETWEEN 10 AND 500),
  CONSTRAINT system_admins_revocation_check CHECK (
    (
      is_active
      AND revoked_at IS NULL
      AND revoked_by IS NULL
      AND revoked_reason IS NULL
    )
    OR
    (
      NOT is_active
      AND revoked_at IS NOT NULL
      AND revoked_by IS NOT NULL
      AND revoked_reason IS NOT NULL
      AND length(btrim(revoked_reason)) BETWEEN 10 AND 500
    )
  )
);

ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_admins FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.system_admins TO service_role;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  reason text,
  old_data jsonb,
  new_data jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_logs_action_check
    CHECK (length(action) BETWEEN 3 AND 100),
  CONSTRAINT admin_audit_logs_target_type_check
    CHECK (length(target_type) BETWEEN 3 AND 100),
  CONSTRAINT admin_audit_logs_reason_check
    CHECK (reason IS NULL OR length(btrim(reason)) BETWEEN 10 AND 1000),
  CONSTRAINT admin_audit_logs_context_object_check
    CHECK (jsonb_typeof(context) = 'object')
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_occurred_idx
  ON public.admin_audit_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_occurred_idx
  ON public.admin_audit_logs (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_target_idx
  ON public.admin_audit_logs (target_type, target_id, occurred_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit_logs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.tg_admin_audit_logs_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '42501',
    MESSAGE = 'admin_audit:immutable';
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_logs_immutable
  ON public.admin_audit_logs;
CREATE TRIGGER admin_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_admin_audit_logs_immutable();

CREATE OR REPLACE FUNCTION public.tg_audit_system_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  audit_action text;
  audit_actor uuid;
  audit_reason text;
  audit_old_data jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    audit_action := 'system_admin_granted';
    audit_actor := COALESCE(auth.uid(), NEW.created_by);
    audit_reason := NEW.reason;
    audit_old_data := NULL;
  ELSE
    audit_action := CASE
      WHEN OLD.is_active AND NOT NEW.is_active THEN 'system_admin_revoked'
      ELSE 'system_admin_updated'
    END;
    audit_actor := COALESCE(
      auth.uid(),
      CASE
        WHEN OLD.is_active AND NOT NEW.is_active THEN NEW.revoked_by
        ELSE NEW.created_by
      END
    );
    audit_reason := CASE
      WHEN OLD.is_active AND NOT NEW.is_active THEN NEW.revoked_reason
      ELSE NEW.reason
    END;
    audit_old_data := to_jsonb(OLD);
  END IF;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_type, target_id, reason,
    old_data, new_data, context
  ) VALUES (
    audit_actor,
    audit_action,
    'system_admin',
    NEW.user_id::text,
    audit_reason,
    audit_old_data,
    to_jsonb(NEW),
    jsonb_build_object('source', 'system_admins_trigger')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS system_admins_audit_change ON public.system_admins;
CREATE TRIGGER system_admins_audit_change
  AFTER INSERT OR UPDATE ON public.system_admins
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_system_admin_change();

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.system_admins administrator
      WHERE administrator.user_id = auth.uid()
        AND administrator.is_active
        AND administrator.revoked_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.assert_system_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.is_system_admin() THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'system_admin:forbidden';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.system_admin_page_size(p_limit integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.system_admin_search(p_search text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
DECLARE
  result text := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
  IF result IS NOT NULL AND length(result) > 100 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'system_admin:search_too_long';
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_system_admin_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  SELECT jsonb_build_object(
    'metrics', jsonb_build_object(
      'organizations', (SELECT count(*) FROM public.organizations),
      'users', (SELECT count(*) FROM public.profiles),
      'championships', (SELECT count(*) FROM public.championships),
      'active_subscriptions', (
        SELECT count(*)
        FROM public.organization_subscriptions subscription
        WHERE subscription.status IN ('trial', 'active')
      ),
      'storage_bytes', (
        SELECT COALESCE(sum((object.metadata->>'size')::bigint), 0)
        FROM storage.objects object
        WHERE object.metadata->>'size' ~ '^[0-9]+$'
      )
    ),
    'subscription_statuses', COALESCE((
      SELECT jsonb_object_agg(status_count.status, status_count.amount)
      FROM (
        SELECT subscription.status, count(*) AS amount
        FROM public.organization_subscriptions subscription
        GROUP BY subscription.status
      ) status_count
    ), '{}'::jsonb),
    'alerts', jsonb_build_object(
      'past_due_subscriptions', (
        SELECT count(*)
        FROM public.organization_subscriptions subscription
        WHERE subscription.status = 'past_due'
      ),
      'suspended_subscriptions', (
        SELECT count(*)
        FROM public.organization_subscriptions subscription
        WHERE subscription.status = 'suspended'
      ),
      'organizations_without_subscription', (
        SELECT count(*)
        FROM public.organizations organization
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.organization_subscriptions subscription
          WHERE subscription.organization_id = organization.id
        )
      )
    ),
    'generated_at', now()
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_system_admin_organizations(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  search_term text := public.system_admin_search(p_search);
  page_size integer := public.system_admin_page_size(p_limit);
  page_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  WITH filtered AS (
    SELECT organization.*
    FROM public.organizations organization
    WHERE search_term IS NULL
       OR organization.name ILIKE '%' || search_term || '%'
       OR COALESCE(organization.slug, '') ILIKE '%' || search_term || '%'
  ),
  page AS (
    SELECT organization.*
    FROM filtered organization
    ORDER BY organization.created_at DESC, organization.id
    LIMIT page_size OFFSET page_offset
  )
  SELECT jsonb_build_object(
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', organization.id,
        'name', organization.name,
        'slug', organization.slug,
        'created_at', organization.created_at,
        'members_count', (
          SELECT count(*) FROM public.organization_members member
          WHERE member.organization_id = organization.id
        ),
        'championships_count', (
          SELECT count(*) FROM public.championships championship
          WHERE championship.organization_id = organization.id
        ),
        'subscription_status', subscription.status,
        'plan_code', plan.code,
        'plan_name', plan.name
      ) ORDER BY organization.created_at DESC, organization.id)
      FROM page organization
      LEFT JOIN public.organization_subscriptions subscription
        ON subscription.organization_id = organization.id
      LEFT JOIN public.saas_plan_versions plan
        ON plan.id = subscription.plan_version_id
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'limit', page_size,
    'offset', page_offset
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_system_admin_users(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  search_term text := public.system_admin_search(p_search);
  page_size integer := public.system_admin_page_size(p_limit);
  page_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  WITH filtered AS (
    SELECT profile.*
    FROM public.profiles profile
    WHERE search_term IS NULL
       OR COALESCE(profile.display_name, '') ILIKE '%' || search_term || '%'
       OR COALESCE(profile.email, '') ILIKE '%' || search_term || '%'
  ),
  page AS (
    SELECT profile.*
    FROM filtered profile
    ORDER BY profile.created_at DESC, profile.id
    LIMIT page_size OFFSET page_offset
  )
  SELECT jsonb_build_object(
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', profile.id,
        'display_name', profile.display_name,
        'email', profile.email,
        'created_at', profile.created_at,
        'organizations_count', (
          SELECT count(DISTINCT member.organization_id)
          FROM public.organization_members member
          WHERE member.user_id = profile.id
        ),
        'is_system_admin', EXISTS (
          SELECT 1 FROM public.system_admins administrator
          WHERE administrator.user_id = profile.id
            AND administrator.is_active
            AND administrator.revoked_at IS NULL
        )
      ) ORDER BY profile.created_at DESC, profile.id)
      FROM page profile
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'limit', page_size,
    'offset', page_offset
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_system_admin_championships(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  search_term text := public.system_admin_search(p_search);
  page_size integer := public.system_admin_page_size(p_limit);
  page_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  WITH filtered AS (
    SELECT championship.*, organization.name AS organization_name
    FROM public.championships championship
    JOIN public.organizations organization
      ON organization.id = championship.organization_id
    WHERE search_term IS NULL
       OR championship.name ILIKE '%' || search_term || '%'
       OR championship.slug ILIKE '%' || search_term || '%'
       OR organization.name ILIKE '%' || search_term || '%'
  ),
  page AS (
    SELECT championship.*
    FROM filtered championship
    ORDER BY championship.created_at DESC, championship.id
    LIMIT page_size OFFSET page_offset
  )
  SELECT jsonb_build_object(
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', championship.id,
        'name', championship.name,
        'slug', championship.slug,
        'organization_id', championship.organization_id,
        'organization_name', championship.organization_name,
        'status', championship.status,
        'is_public', championship.is_public,
        'created_at', championship.created_at
      ) ORDER BY championship.created_at DESC, championship.id)
      FROM page championship
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'limit', page_size,
    'offset', page_offset
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_system_admin_subscriptions(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  search_term text := public.system_admin_search(p_search);
  page_size integer := public.system_admin_page_size(p_limit);
  page_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  WITH filtered AS (
    SELECT
      subscription.*,
      organization.name AS organization_name,
      plan.code AS plan_code,
      plan.name AS plan_name,
      plan.version AS plan_version
    FROM public.organization_subscriptions subscription
    JOIN public.organizations organization
      ON organization.id = subscription.organization_id
    JOIN public.saas_plan_versions plan
      ON plan.id = subscription.plan_version_id
    WHERE search_term IS NULL
       OR organization.name ILIKE '%' || search_term || '%'
       OR plan.name ILIKE '%' || search_term || '%'
       OR plan.code ILIKE '%' || search_term || '%'
  ),
  page AS (
    SELECT subscription.*
    FROM filtered subscription
    ORDER BY subscription.updated_at DESC, subscription.id
    LIMIT page_size OFFSET page_offset
  )
  SELECT jsonb_build_object(
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', subscription.id,
        'organization_id', subscription.organization_id,
        'organization_name', subscription.organization_name,
        'status', subscription.status,
        'plan_code', subscription.plan_code,
        'plan_name', subscription.plan_name,
        'plan_version', subscription.plan_version,
        'provider_connected', subscription.provider IS NOT NULL,
        'current_period_ends_at', subscription.current_period_ends_at,
        'updated_at', subscription.updated_at
      ) ORDER BY subscription.updated_at DESC, subscription.id)
      FROM page subscription
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'limit', page_size,
    'offset', page_offset
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.is_system_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_system_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.system_admin_page_size(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.system_admin_search(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_admin_audit_logs_immutable()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_audit_system_admin_change()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_system_admin_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_system_admin_organizations(text,integer,integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_system_admin_users(text,integer,integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_system_admin_championships(text,integer,integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_system_admin_subscriptions(text,integer,integer)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_admin_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_admin_organizations(text,integer,integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_admin_users(text,integer,integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_admin_championships(text,integer,integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_system_admin_subscriptions(text,integer,integer)
  TO authenticated;
