-- Etapa 3: torna a troca token -> sessao idempotente durante a janela ativa.
-- O hash de sessao nunca contem o token puro e permanece opaco no banco.

CREATE OR REPLACE FUNCTION public.consume_team_edit_token(
  p_token_hash text,
  p_session_hash text,
  p_fingerprint_hash text
)
RETURNS TABLE(
  access_state text,
  session_expires_at timestamptz,
  championship_name text,
  championship_logo_url text,
  team_name text,
  team_crest_url text,
  link_expires_at timestamptz,
  effective_permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v public.team_edit_links%ROWTYPE;
  v_championship public.championships%ROWTYPE;
  v_team public.teams%ROWTYPE;
  v_participation public.championship_teams%ROWTYPE;
  v_session public.team_edit_link_sessions%ROWTYPE;
  v_session_expires timestamptz;
  v_count_access boolean := false;
  v_rate public.team_access_rate_limits%ROWTYPE;
  v_event text;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_token_hash !~ '^[0-9a-f]{64}$'
    OR p_session_hash !~ '^[0-9a-f]{64}$'
    OR p_fingerprint_hash !~ '^[0-9a-f]{64}$'
  THEN
    RETURN QUERY SELECT 'invalid'::text, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
    RETURN;
  END IF;

  INSERT INTO public.team_access_rate_limits(fingerprint_hash)
  VALUES (p_fingerprint_hash)
  ON CONFLICT (fingerprint_hash) DO UPDATE SET
    attempts = CASE
      WHEN public.team_access_rate_limits.window_started_at < now() - interval '5 minutes'
        THEN 1
      ELSE public.team_access_rate_limits.attempts + 1
    END,
    window_started_at = CASE
      WHEN public.team_access_rate_limits.window_started_at < now() - interval '5 minutes'
        THEN now()
      ELSE public.team_access_rate_limits.window_started_at
    END,
    blocked_until = CASE
      WHEN public.team_access_rate_limits.window_started_at >= now() - interval '5 minutes'
        AND public.team_access_rate_limits.attempts >= 29
        THEN now() + interval '15 minutes'
      ELSE public.team_access_rate_limits.blocked_until
    END,
    updated_at = now()
  RETURNING * INTO v_rate;

  IF v_rate.blocked_until IS NOT NULL AND v_rate.blocked_until > now() THEN
    INSERT INTO public.team_access_security_events(event_type, fingerprint_hash)
    VALUES ('rate_limited', p_fingerprint_hash);
    RETURN QUERY SELECT 'rate_limited'::text, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
    RETURN;
  END IF;

  SELECT *
  INTO v
  FROM public.team_edit_links
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.team_access_security_events(event_type, fingerprint_hash)
    VALUES ('invalid_token', p_fingerprint_hash);
    RETURN QUERY SELECT 'invalid'::text, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
    RETURN;
  END IF;

  SELECT *
  INTO v_championship
  FROM public.championships
  WHERE id = v.championship_id AND organization_id = v.organization_id;

  SELECT *
  INTO v_team
  FROM public.teams
  WHERE id = v.team_id AND organization_id = v.organization_id;

  SELECT *
  INTO v_participation
  FROM public.championship_teams
  WHERE id = v.championship_team_id
    AND championship_id = v.championship_id
    AND team_id = v.team_id
    AND organization_id = v.organization_id;

  IF v_championship.id IS NULL OR v_team.id IS NULL OR v_participation.id IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
    RETURN;
  END IF;

  SELECT *
  INTO v_session
  FROM public.team_edit_link_sessions
  WHERE session_hash = p_session_hash
  FOR UPDATE;

  IF v_session.id IS NOT NULL AND v_session.link_id <> v.id THEN
    RETURN QUERY SELECT 'invalid'::text, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
    RETURN;
  END IF;

  access_state := CASE
    WHEN v.status = 'blocked' THEN 'blocked'
    WHEN v.status = 'revoked' THEN 'revoked'
    WHEN v.status = 'replaced' THEN 'replaced'
    WHEN v.expires_at <= now() THEN 'expired'
    WHEN v.max_access_count IS NOT NULL
      AND v.access_count >= v.max_access_count
      AND (v_session.id IS NULL OR v_session.expires_at <= now())
      THEN 'access_limit'
    WHEN v_championship.status IN ('suspended', 'archived')
      OR v_participation.status = 'archived'
      OR v_team.status = 'archived'
      THEN 'unavailable'
    ELSE 'valid'
  END;

  IF access_state <> 'valid' THEN
    v_event := CASE access_state
      WHEN 'blocked' THEN 'blocked_attempt'
      WHEN 'revoked' THEN 'revoked_attempt'
      WHEN 'replaced' THEN 'replaced_attempt'
      WHEN 'expired' THEN 'expired_attempt'
      WHEN 'access_limit' THEN 'access_limit_attempt'
      ELSE 'unavailable_attempt'
    END;
    INSERT INTO public.team_edit_link_events(
      organization_id, championship_id, team_id, link_id, event_type, context
    )
    VALUES (
      v.organization_id, v.championship_id, v.team_id, v.id, v_event,
      jsonb_build_object('source', 'public_exchange')
    );
    RETURN QUERY
      SELECT access_state, NULL, v_championship.name, v_championship.logo_url,
        v_team.name, v_team.crest_url, v.expires_at, v.permissions;
    RETURN;
  END IF;

  v_session_expires := least(now() + interval '15 minutes', v.expires_at);

  IF v_session.id IS NULL THEN
    INSERT INTO public.team_edit_link_sessions(link_id, session_hash, expires_at)
    VALUES (v.id, p_session_hash, v_session_expires);
    v_count_access := true;
  ELSIF v_session.expires_at <= now() THEN
    UPDATE public.team_edit_link_sessions
    SET created_at = now(), expires_at = v_session_expires, last_seen_at = now()
    WHERE id = v_session.id;
    v_count_access := true;
  ELSE
    v_session_expires := v_session.expires_at;
    UPDATE public.team_edit_link_sessions
    SET last_seen_at = now()
    WHERE id = v_session.id;
  END IF;

  IF v_count_access THEN
    UPDATE public.team_edit_links
    SET last_accessed_at = now(), access_count = access_count + 1
    WHERE id = v.id
    RETURNING * INTO v;

    INSERT INTO public.team_edit_link_events(
      organization_id, championship_id, team_id, link_id, event_type, context
    )
    VALUES (
      v.organization_id, v.championship_id, v.team_id, v.id, 'valid_access',
      jsonb_build_object('session_created', true)
    );
  END IF;

  RETURN QUERY
    SELECT 'valid'::text, v_session_expires, v_championship.name,
      v_championship.logo_url, v_team.name, v_team.crest_url,
      v.expires_at, v.permissions;
END
$$;

REVOKE ALL ON FUNCTION public.consume_team_edit_token(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_team_edit_token(text, text, text)
  TO service_role;
