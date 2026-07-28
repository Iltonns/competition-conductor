-- Phase 6 / F6-RF05: time-bound, organization-scoped, read-only support mode.

CREATE TABLE IF NOT EXISTS public.support_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE RESTRICT,
  admin_user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended', 'expired')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_sessions_reason_check
    CHECK (length(btrim(reason)) BETWEEN 20 AND 1000),
  CONSTRAINT support_sessions_duration_check
    CHECK (
      expires_at >= started_at + interval '5 minutes'
      AND expires_at <= started_at + interval '2 hours'
    ),
  CONSTRAINT support_sessions_end_state_check
    CHECK (
      (status = 'active' AND ended_at IS NULL AND end_reason IS NULL)
      OR
      (
        status IN ('ended', 'expired')
        AND ended_at IS NOT NULL
        AND end_reason IS NOT NULL
        AND length(btrim(end_reason)) BETWEEN 10 AND 1000
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS support_sessions_one_active_per_admin
  ON public.support_sessions (admin_user_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS support_sessions_organization_started_idx
  ON public.support_sessions (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS support_sessions_expiration_idx
  ON public.support_sessions (expires_at)
  WHERE status = 'active';

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.support_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.close_expired_support_sessions(
  p_admin_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  closed_count integer;
BEGIN
  WITH expired AS (
    UPDATE public.support_sessions session
    SET status = 'expired',
        ended_at = session.expires_at,
        end_reason = 'Expiração automática da sessão temporária de suporte.'
    WHERE session.admin_user_id = p_admin_user_id
      AND session.status = 'active'
      AND session.expires_at <= now()
    RETURNING session.*
  ),
  audited AS (
    INSERT INTO public.admin_audit_logs (
      actor_user_id, action, target_type, target_id, reason,
      old_data, new_data, context
    )
    SELECT
      expired.admin_user_id,
      'support_session_expired',
      'support_session',
      expired.id::text,
      expired.end_reason,
      NULL,
      to_jsonb(expired),
      jsonb_build_object('organization_id', expired.organization_id)
    FROM expired
    RETURNING 1
  )
  SELECT count(*) INTO closed_count FROM audited;

  RETURN COALESCE(closed_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_active_support_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();
  PERFORM public.close_expired_support_sessions(auth.uid());

  SELECT jsonb_build_object(
    'id', session.id,
    'organization_id', session.organization_id,
    'organization_name', organization.name,
    'reason', session.reason,
    'started_at', session.started_at,
    'expires_at', session.expires_at
  )
  INTO result
  FROM public.support_sessions session
  JOIN public.organizations organization
    ON organization.id = session.organization_id
  WHERE session.admin_user_id = auth.uid()
    AND session.status = 'active'
    AND session.expires_at > now()
  ORDER BY session.started_at DESC
  LIMIT 1;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_support_session(
  p_organization_id uuid,
  p_reason text,
  p_duration_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  clean_reason text := btrim(COALESCE(p_reason, ''));
  created_session public.support_sessions%ROWTYPE;
BEGIN
  PERFORM public.assert_system_admin();
  PERFORM public.close_expired_support_sessions(auth.uid());

  IF length(clean_reason) NOT BETWEEN 20 AND 1000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'support:invalid_reason';
  END IF;
  IF p_duration_minutes NOT BETWEEN 5 AND 120 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'support:invalid_duration';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations organization
    WHERE organization.id = p_organization_id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'support:organization_not_found';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.support_sessions session
    WHERE session.admin_user_id = auth.uid()
      AND session.status = 'active'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'support:active_session_exists';
  END IF;

  INSERT INTO public.support_sessions (
    organization_id, admin_user_id, reason, expires_at
  ) VALUES (
    p_organization_id,
    auth.uid(),
    clean_reason,
    now() + make_interval(mins => p_duration_minutes)
  )
  RETURNING * INTO created_session;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_type, target_id, reason,
    old_data, new_data, context
  ) VALUES (
    auth.uid(),
    'support_session_started',
    'support_session',
    created_session.id::text,
    clean_reason,
    NULL,
    to_jsonb(created_session),
    jsonb_build_object(
      'organization_id', p_organization_id,
      'duration_minutes', p_duration_minutes,
      'read_only', true
    )
  );

  RETURN public.get_my_active_support_session();
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'support:active_session_exists';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_support_session_context(
  p_session_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_session public.support_sessions%ROWTYPE;
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();
  PERFORM public.close_expired_support_sessions(auth.uid());

  SELECT * INTO target_session
  FROM public.support_sessions session
  WHERE session.id = p_session_id
    AND session.admin_user_id = auth.uid()
    AND session.status = 'active'
    AND session.expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'support:session_unavailable';
  END IF;

  SELECT jsonb_build_object(
    'session', jsonb_build_object(
      'id', target_session.id,
      'organization_id', target_session.organization_id,
      'reason', target_session.reason,
      'started_at', target_session.started_at,
      'expires_at', target_session.expires_at,
      'read_only', true
    ),
    'organization', jsonb_build_object(
      'id', organization.id,
      'name', organization.name,
      'slug', organization.slug,
      'city', organization.city,
      'state', organization.state,
      'created_at', organization.created_at
    ),
    'metrics', jsonb_build_object(
      'members', (
        SELECT count(*)
        FROM public.organization_members member
        WHERE member.organization_id = organization.id
      ),
      'championships', (
        SELECT count(*)
        FROM public.championships championship
        WHERE championship.organization_id = organization.id
      ),
      'active_championships', (
        SELECT count(*)
        FROM public.championships championship
        WHERE championship.organization_id = organization.id
          AND championship.status::text IN ('active', 'published')
      ),
      'teams', (
        SELECT count(*)
        FROM public.teams team
        WHERE team.organization_id = organization.id
          AND team.status = 'active'
      )
    ),
    'subscription', (
      SELECT jsonb_build_object(
        'status', subscription.status,
        'plan_code', plan.code,
        'plan_name', plan.name,
        'plan_version', plan.version,
        'current_period_ends_at', subscription.current_period_ends_at
      )
      FROM public.organization_subscriptions subscription
      JOIN public.saas_plan_versions plan
        ON plan.id = subscription.plan_version_id
      WHERE subscription.organization_id = organization.id
    ),
    'recent_championships', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', recent.id,
        'name', recent.name,
        'status', recent.status,
        'is_public', recent.is_public,
        'created_at', recent.created_at
      ) ORDER BY recent.created_at DESC)
      FROM (
        SELECT championship.id, championship.name, championship.status,
               championship.is_public, championship.created_at
        FROM public.championships championship
        WHERE championship.organization_id = organization.id
        ORDER BY championship.created_at DESC
        LIMIT 10
      ) recent
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.organizations organization
  WHERE organization.id = target_session.organization_id;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_type, target_id, reason,
    old_data, new_data, context
  ) VALUES (
    auth.uid(),
    'support_context_viewed',
    'support_session',
    target_session.id::text,
    'Consulta do contexto sanitizado e somente leitura da organização.',
    NULL,
    NULL,
    jsonb_build_object(
      'organization_id', target_session.organization_id,
      'read_only', true
    )
  );

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_support_session(
  p_session_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  clean_reason text := btrim(COALESCE(p_reason, ''));
  old_session public.support_sessions%ROWTYPE;
  ended_session public.support_sessions%ROWTYPE;
BEGIN
  PERFORM public.assert_system_admin();
  PERFORM public.close_expired_support_sessions(auth.uid());
  IF length(clean_reason) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'support:invalid_end_reason';
  END IF;

  SELECT * INTO old_session
  FROM public.support_sessions session
  WHERE session.id = p_session_id
    AND session.admin_user_id = auth.uid()
    AND session.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'support:session_unavailable';
  END IF;

  UPDATE public.support_sessions
  SET status = 'ended',
      ended_at = now(),
      end_reason = clean_reason
  WHERE id = p_session_id
  RETURNING * INTO ended_session;

  INSERT INTO public.admin_audit_logs (
    actor_user_id, action, target_type, target_id, reason,
    old_data, new_data, context
  ) VALUES (
    auth.uid(),
    'support_session_ended',
    'support_session',
    ended_session.id::text,
    clean_reason,
    to_jsonb(old_session),
    to_jsonb(ended_session),
    jsonb_build_object('organization_id', ended_session.organization_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.close_expired_support_sessions(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_active_support_session()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_support_session(uuid,text,integer)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_support_session_context(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.end_support_session(uuid,text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_active_support_session()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_support_session(uuid,text,integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_support_session_context(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_support_session(uuid,text)
  TO authenticated;
