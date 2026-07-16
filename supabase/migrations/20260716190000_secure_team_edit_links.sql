-- Etapa 3: links seguros de acesso para dirigentes e equipes.
-- Migration aditiva, sem armazenamento do token em texto puro.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.default_team_edit_permissions()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'edit_team_details', false,
    'change_crest', false,
    'change_cover', false,
    'edit_contacts', false,
    'edit_responsibles', false,
    'edit_staff', false,
    'add_athletes', false,
    'edit_athletes', false,
    'remove_athletes', false,
    'change_shirt_number', false,
    'add_documents', false,
    'submit_for_review', false
  )
$$;

CREATE OR REPLACE FUNCTION public.team_edit_permissions_are_valid(p_permissions jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    jsonb_typeof(p_permissions) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_object_keys(p_permissions) AS key
      WHERE key NOT IN (
        'edit_team_details', 'change_crest', 'change_cover', 'edit_contacts',
        'edit_responsibles', 'edit_staff', 'add_athletes', 'edit_athletes',
        'remove_athletes', 'change_shirt_number', 'add_documents', 'submit_for_review'
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(p_permissions) AS item
      WHERE jsonb_typeof(item.value) <> 'boolean'
    )
$$;

REVOKE ALL ON FUNCTION public.default_team_edit_permissions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.team_edit_permissions_are_valid(jsonb) FROM PUBLIC, anon, authenticated;

CREATE TABLE public.team_edit_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  championship_id uuid NOT NULL,
  championship_team_id uuid NOT NULL,
  team_id uuid NOT NULL,
  token_hash text NOT NULL,
  token_prefix text,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL,
  last_accessed_at timestamptz,
  access_count bigint NOT NULL DEFAULT 0,
  max_access_count bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revocation_reason text,
  blocked_at timestamptz,
  blocked_by uuid REFERENCES auth.users(id),
  block_reason text,
  replaced_at timestamptz,
  replaced_by uuid REFERENCES auth.users(id),
  replaced_by_link_id uuid,
  permissions jsonb NOT NULL DEFAULT public.default_team_edit_permissions(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT team_edit_links_status_check
    CHECK (status IN ('active', 'blocked', 'revoked', 'replaced')),
  CONSTRAINT team_edit_links_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT team_edit_links_prefix_check
    CHECK (token_prefix IS NULL OR token_prefix ~ '^[A-Za-z0-9_-]{6,12}$'),
  CONSTRAINT team_edit_links_expiration_check CHECK (expires_at > created_at),
  CONSTRAINT team_edit_links_access_count_check CHECK (access_count >= 0),
  CONSTRAINT team_edit_links_max_access_count_check
    CHECK (max_access_count IS NULL OR max_access_count > 0),
  CONSTRAINT team_edit_links_permissions_check
    CHECK (public.team_edit_permissions_are_valid(permissions)),
  CONSTRAINT team_edit_links_metadata_check CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT team_edit_links_championship_fk
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id),
  CONSTRAINT team_edit_links_team_fk
    FOREIGN KEY (team_id, organization_id)
    REFERENCES public.teams(id, organization_id),
  CONSTRAINT team_edit_links_participation_fk
    FOREIGN KEY (championship_team_id, championship_id, team_id, organization_id)
    REFERENCES public.championship_teams(id, championship_id, team_id, organization_id)
);

ALTER TABLE public.team_edit_links
  ADD CONSTRAINT team_edit_links_replaced_by_link_fk
  FOREIGN KEY (replaced_by_link_id) REFERENCES public.team_edit_links(id);

CREATE UNIQUE INDEX team_edit_links_token_hash_idx ON public.team_edit_links(token_hash);
CREATE UNIQUE INDEX team_edit_links_one_current_idx
  ON public.team_edit_links(championship_team_id)
  WHERE status IN ('active', 'blocked');
CREATE UNIQUE INDEX team_edit_links_id_organization_idx
  ON public.team_edit_links(id, organization_id);
CREATE INDEX team_edit_links_team_lookup_idx
  ON public.team_edit_links(championship_id, team_id, created_at DESC);
CREATE INDEX team_edit_links_expiration_idx
  ON public.team_edit_links(expires_at) WHERE status IN ('active', 'blocked');

CREATE TABLE public.team_edit_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  championship_id uuid NOT NULL,
  team_id uuid NOT NULL,
  link_id uuid NOT NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  reason text,
  old_data jsonb,
  new_data jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_edit_link_events_type_check CHECK (event_type IN (
    'generated', 'blocked', 'unblocked', 'revoked', 'replaced',
    'expiration_extended', 'permissions_updated', 'valid_access',
    'expired_attempt', 'blocked_attempt', 'revoked_attempt', 'replaced_attempt',
    'unavailable_attempt', 'access_limit_attempt'
  )),
  CONSTRAINT team_edit_link_events_context_check CHECK (jsonb_typeof(context) = 'object'),
  CONSTRAINT team_edit_link_events_link_fk
    FOREIGN KEY (link_id, organization_id)
    REFERENCES public.team_edit_links(id, organization_id),
  CONSTRAINT team_edit_link_events_championship_fk
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id),
  CONSTRAINT team_edit_link_events_team_fk
    FOREIGN KEY (team_id, organization_id)
    REFERENCES public.teams(id, organization_id)
);

CREATE INDEX team_edit_link_events_history_idx
  ON public.team_edit_link_events(link_id, created_at DESC);
CREATE INDEX team_edit_link_events_team_idx
  ON public.team_edit_link_events(championship_id, team_id, created_at DESC);

CREATE TABLE public.team_edit_link_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.team_edit_links(id) ON DELETE CASCADE,
  session_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_edit_link_sessions_hash_check CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT team_edit_link_sessions_expiration_check CHECK (expires_at > created_at)
);

CREATE INDEX team_edit_link_sessions_link_idx
  ON public.team_edit_link_sessions(link_id, expires_at DESC);

CREATE TABLE public.team_access_rate_limits (
  fingerprint_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1,
  blocked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_access_rate_limits_hash_check CHECK (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT team_access_rate_limits_attempts_check CHECK (attempts > 0)
);

CREATE TABLE public.team_access_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('invalid_token', 'rate_limited')),
  fingerprint_hash text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_access_security_events_fingerprint_check
    CHECK (fingerprint_hash IS NULL OR fingerprint_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT team_access_security_events_context_check CHECK (jsonb_typeof(context) = 'object')
);

CREATE INDEX team_access_security_events_created_idx
  ON public.team_access_security_events(created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_team_edit_link_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  ELSE
    NEW.id := OLD.id;
    NEW.organization_id := OLD.organization_id;
    NEW.championship_id := OLD.championship_id;
    NEW.championship_team_id := OLD.championship_team_id;
    NEW.team_id := OLD.team_id;
    NEW.token_hash := OLD.token_hash;
    NEW.token_prefix := OLD.token_prefix;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    IF auth.uid() IS NOT NULL THEN NEW.updated_by := auth.uid(); END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER team_edit_links_audit_fields
  BEFORE INSERT OR UPDATE ON public.team_edit_links
  FOR EACH ROW EXECUTE FUNCTION public.tg_team_edit_link_audit_fields();

ALTER TABLE public.team_edit_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_edit_link_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_edit_link_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_access_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_access_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_edit_links_member_select ON public.team_edit_links
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY team_edit_links_admin_insert ON public.team_edit_links
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
CREATE POLICY team_edit_links_admin_update ON public.team_edit_links
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));
CREATE POLICY team_edit_link_events_member_select ON public.team_edit_link_events
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

REVOKE ALL ON public.team_edit_links FROM authenticated;
GRANT SELECT (
  id, organization_id, championship_id, championship_team_id, team_id,
  token_prefix, status, expires_at, last_accessed_at, access_count,
  max_access_count, created_at, created_by, updated_at, updated_by,
  revoked_at, revoked_by, revocation_reason, blocked_at, blocked_by,
  block_reason, replaced_at, replaced_by, replaced_by_link_id, permissions
) ON public.team_edit_links TO authenticated;
GRANT SELECT ON public.team_edit_link_events TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.team_edit_link_events FROM authenticated;
REVOKE ALL ON public.team_edit_links, public.team_edit_link_events,
  public.team_edit_link_sessions, public.team_access_rate_limits,
  public.team_access_security_events FROM anon;
GRANT ALL ON public.team_edit_links, public.team_edit_link_events,
  public.team_edit_link_sessions, public.team_access_rate_limits,
  public.team_access_security_events TO service_role;

CREATE OR REPLACE FUNCTION public.generate_team_edit_link(
  p_championship_id uuid,
  p_team_id uuid,
  p_expires_at timestamptz,
  p_permissions jsonb,
  p_admin_note text DEFAULT NULL
)
RETURNS TABLE(link_id uuid, plaintext_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_link public.championship_teams%ROWTYPE;
  v_previous public.team_edit_links%ROWTYPE;
  v_created public.team_edit_links%ROWTYPE;
  v_permissions jsonb;
  v_token text;
  v_token_hash text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'invalid_expiration';
  END IF;
  IF NOT public.team_edit_permissions_are_valid(coalesce(p_permissions, '{}'::jsonb)) THEN
    RAISE EXCEPTION 'invalid_permissions';
  END IF;
  v_permissions := public.default_team_edit_permissions() || coalesce(p_permissions, '{}'::jsonb);
  v_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  SELECT * INTO v_link FROM public.championship_teams
  WHERE championship_id = p_championship_id AND team_id = p_team_id
    AND status <> 'archived'
  FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN
    RAISE EXCEPTION 'team_link_not_found_or_forbidden';
  END IF;

  SELECT * INTO v_previous FROM public.team_edit_links
  WHERE championship_team_id = v_link.id AND status IN ('active', 'blocked')
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.team_edit_links SET
      status = 'replaced', replaced_at = now(), replaced_by = auth.uid(),
      blocked_at = NULL, blocked_by = NULL, block_reason = NULL
    WHERE id = v_previous.id;
  END IF;

  INSERT INTO public.team_edit_links (
    organization_id, championship_id, championship_team_id, team_id,
    token_hash, token_prefix, expires_at, permissions, metadata
  ) VALUES (
    v_link.organization_id, v_link.championship_id, v_link.id, v_link.team_id,
    v_token_hash, left(v_token, 8), p_expires_at, v_permissions,
    jsonb_build_object('admin_note', nullif(btrim(p_admin_note), ''))
  ) RETURNING * INTO v_created;

  IF v_previous.id IS NOT NULL THEN
    UPDATE public.team_edit_links SET replaced_by_link_id = v_created.id WHERE id = v_previous.id;
    INSERT INTO public.team_edit_link_events (
      organization_id, championship_id, team_id, link_id, event_type, actor_id,
      old_data, new_data
    ) VALUES (
      v_previous.organization_id, v_previous.championship_id, v_previous.team_id,
      v_previous.id, 'replaced', auth.uid(),
      jsonb_build_object('status', v_previous.status),
      jsonb_build_object('status', 'replaced', 'replacement_link_id', v_created.id)
    );
  END IF;

  INSERT INTO public.team_edit_link_events (
    organization_id, championship_id, team_id, link_id, event_type, actor_id, new_data
  ) VALUES (
    v_created.organization_id, v_created.championship_id, v_created.team_id,
    v_created.id, 'generated', auth.uid(),
    jsonb_build_object('expires_at', v_created.expires_at, 'permissions', v_created.permissions)
  );
  RETURN QUERY SELECT v_created.id, v_token;
END
$$;

CREATE OR REPLACE FUNCTION public.block_team_edit_link(p_link_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v public.team_edit_links%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.team_edit_links WHERE id = p_link_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v.organization_id) THEN RAISE EXCEPTION 'link_not_found_or_forbidden'; END IF;
  IF v.status <> 'active' OR v.expires_at <= now() THEN RAISE EXCEPTION 'link_not_active'; END IF;
  IF nullif(btrim(p_reason), '') IS NULL THEN RAISE EXCEPTION 'reason_required'; END IF;
  UPDATE public.team_edit_links SET status='blocked', blocked_at=now(), blocked_by=auth.uid(), block_reason=btrim(p_reason)
    WHERE id=v.id RETURNING * INTO v;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,actor_id,reason)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'blocked',auth.uid(),v.block_reason);
  RETURN v.id;
END $$;

CREATE OR REPLACE FUNCTION public.unblock_team_edit_link(p_link_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v public.team_edit_links%ROWTYPE; v_reason text;
BEGIN
  SELECT * INTO v FROM public.team_edit_links WHERE id=p_link_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v.organization_id) THEN RAISE EXCEPTION 'link_not_found_or_forbidden'; END IF;
  IF v.status <> 'blocked' OR v.expires_at <= now() THEN RAISE EXCEPTION 'link_not_blocked_or_expired'; END IF;
  v_reason := v.block_reason;
  UPDATE public.team_edit_links SET status='active',blocked_at=NULL,blocked_by=NULL,block_reason=NULL
    WHERE id=v.id RETURNING * INTO v;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,actor_id,old_data)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'unblocked',auth.uid(),jsonb_build_object('block_reason',v_reason));
  RETURN v.id;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_team_edit_link(p_link_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v public.team_edit_links%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.team_edit_links WHERE id=p_link_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v.organization_id) THEN RAISE EXCEPTION 'link_not_found_or_forbidden'; END IF;
  IF v.status NOT IN ('active','blocked') THEN RAISE EXCEPTION 'link_not_revocable'; END IF;
  IF nullif(btrim(p_reason), '') IS NULL THEN RAISE EXCEPTION 'reason_required'; END IF;
  UPDATE public.team_edit_links SET status='revoked',revoked_at=now(),revoked_by=auth.uid(),revocation_reason=btrim(p_reason)
    WHERE id=v.id RETURNING * INTO v;
  DELETE FROM public.team_edit_link_sessions WHERE link_id=v.id;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,actor_id,reason)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'revoked',auth.uid(),v.revocation_reason);
  RETURN v.id;
END $$;

CREATE OR REPLACE FUNCTION public.extend_team_edit_link_expiration(p_link_id uuid, p_expires_at timestamptz)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v public.team_edit_links%ROWTYPE; v_old timestamptz;
BEGIN
  SELECT * INTO v FROM public.team_edit_links WHERE id=p_link_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v.organization_id) THEN RAISE EXCEPTION 'link_not_found_or_forbidden'; END IF;
  IF v.status NOT IN ('active','blocked') THEN RAISE EXCEPTION 'link_not_extendable'; END IF;
  IF p_expires_at <= now() OR p_expires_at > now()+interval '90 days' THEN RAISE EXCEPTION 'invalid_expiration'; END IF;
  v_old := v.expires_at;
  UPDATE public.team_edit_links SET expires_at=p_expires_at WHERE id=v.id RETURNING * INTO v;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,actor_id,old_data,new_data)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'expiration_extended',auth.uid(),jsonb_build_object('expires_at',v_old),jsonb_build_object('expires_at',v.expires_at));
  RETURN v.id;
END $$;

CREATE OR REPLACE FUNCTION public.update_team_edit_link_permissions(p_link_id uuid, p_permissions jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v public.team_edit_links%ROWTYPE; v_old jsonb; v_permissions jsonb;
BEGIN
  IF NOT public.team_edit_permissions_are_valid(coalesce(p_permissions,'{}'::jsonb)) THEN RAISE EXCEPTION 'invalid_permissions'; END IF;
  v_permissions := public.default_team_edit_permissions() || coalesce(p_permissions,'{}'::jsonb);
  SELECT * INTO v FROM public.team_edit_links WHERE id=p_link_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v.organization_id) THEN RAISE EXCEPTION 'link_not_found_or_forbidden'; END IF;
  IF v.status NOT IN ('active','blocked') THEN RAISE EXCEPTION 'link_not_editable'; END IF;
  v_old := v.permissions;
  UPDATE public.team_edit_links SET permissions=v_permissions WHERE id=v.id RETURNING * INTO v;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,actor_id,old_data,new_data)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'permissions_updated',auth.uid(),jsonb_build_object('permissions',v_old),jsonb_build_object('permissions',v.permissions));
  RETURN v.id;
END $$;

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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v public.team_edit_links%ROWTYPE;
  v_championship public.championships%ROWTYPE;
  v_team public.teams%ROWTYPE;
  v_participation public.championship_teams%ROWTYPE;
  v_session_expires timestamptz;
  v_inserted integer;
  v_rate public.team_access_rate_limits%ROWTYPE;
  v_event text;
BEGIN
  IF current_user NOT IN ('postgres','service_role','supabase_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_token_hash !~ '^[0-9a-f]{64}$' OR p_session_hash !~ '^[0-9a-f]{64}$'
    OR p_fingerprint_hash !~ '^[0-9a-f]{64}$' THEN RETURN QUERY SELECT 'invalid'::text,NULL,NULL,NULL,NULL,NULL,NULL,NULL; RETURN; END IF;

  INSERT INTO public.team_access_rate_limits(fingerprint_hash) VALUES(p_fingerprint_hash)
  ON CONFLICT(fingerprint_hash) DO UPDATE SET
    attempts=CASE WHEN public.team_access_rate_limits.window_started_at < now()-interval '5 minutes' THEN 1 ELSE public.team_access_rate_limits.attempts+1 END,
    window_started_at=CASE WHEN public.team_access_rate_limits.window_started_at < now()-interval '5 minutes' THEN now() ELSE public.team_access_rate_limits.window_started_at END,
    blocked_until=CASE WHEN public.team_access_rate_limits.window_started_at >= now()-interval '5 minutes' AND public.team_access_rate_limits.attempts >= 29 THEN now()+interval '15 minutes' ELSE public.team_access_rate_limits.blocked_until END,
    updated_at=now()
  RETURNING * INTO v_rate;
  IF v_rate.blocked_until IS NOT NULL AND v_rate.blocked_until > now() THEN
    INSERT INTO public.team_access_security_events(event_type,fingerprint_hash) VALUES('rate_limited',p_fingerprint_hash);
    RETURN QUERY SELECT 'rate_limited'::text,NULL,NULL,NULL,NULL,NULL,NULL,NULL; RETURN;
  END IF;

  SELECT * INTO v FROM public.team_edit_links WHERE token_hash=p_token_hash FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.team_access_security_events(event_type,fingerprint_hash) VALUES('invalid_token',p_fingerprint_hash);
    RETURN QUERY SELECT 'invalid'::text,NULL,NULL,NULL,NULL,NULL,NULL,NULL; RETURN;
  END IF;
  SELECT * INTO v_championship FROM public.championships WHERE id=v.championship_id AND organization_id=v.organization_id;
  SELECT * INTO v_team FROM public.teams WHERE id=v.team_id AND organization_id=v.organization_id;
  SELECT * INTO v_participation FROM public.championship_teams WHERE id=v.championship_team_id AND championship_id=v.championship_id AND team_id=v.team_id AND organization_id=v.organization_id;
  IF v_championship.id IS NULL OR v_team.id IS NULL OR v_participation.id IS NULL THEN
    RETURN QUERY SELECT 'invalid'::text,NULL,NULL,NULL,NULL,NULL,NULL,NULL; RETURN;
  END IF;

  access_state := CASE
    WHEN v.status='blocked' THEN 'blocked'
    WHEN v.status='revoked' THEN 'revoked'
    WHEN v.status='replaced' THEN 'replaced'
    WHEN v.expires_at<=now() THEN 'expired'
    WHEN v.max_access_count IS NOT NULL AND v.access_count>=v.max_access_count THEN 'access_limit'
    WHEN v_championship.status IN ('suspended','archived') OR v_participation.status='archived' OR v_team.status='archived' THEN 'unavailable'
    ELSE 'valid' END;
  IF access_state <> 'valid' THEN
    v_event := CASE access_state WHEN 'blocked' THEN 'blocked_attempt' WHEN 'revoked' THEN 'revoked_attempt' WHEN 'replaced' THEN 'replaced_attempt' WHEN 'expired' THEN 'expired_attempt' WHEN 'access_limit' THEN 'access_limit_attempt' ELSE 'unavailable_attempt' END;
    INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,context)
      VALUES(v.organization_id,v.championship_id,v.team_id,v.id,v_event,jsonb_build_object('source','public_exchange'));
    RETURN QUERY SELECT access_state,NULL,v_championship.name,v_championship.logo_url,v_team.name,v_team.crest_url,v.expires_at,v.permissions; RETURN;
  END IF;

  v_session_expires := least(now()+interval '15 minutes',v.expires_at);
  INSERT INTO public.team_edit_link_sessions(link_id,session_hash,expires_at)
    VALUES(v.id,p_session_hash,v_session_expires) ON CONFLICT(session_hash) DO UPDATE SET last_seen_at=now();
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  UPDATE public.team_edit_links SET last_accessed_at=now(),access_count=access_count+1 WHERE id=v.id RETURNING * INTO v;
  INSERT INTO public.team_edit_link_events(organization_id,championship_id,team_id,link_id,event_type,context)
    VALUES(v.organization_id,v.championship_id,v.team_id,v.id,'valid_access',jsonb_build_object('session_created',true));
  RETURN QUERY SELECT 'valid'::text,v_session_expires,v_championship.name,v_championship.logo_url,v_team.name,v_team.crest_url,v.expires_at,v.permissions;
END $$;

CREATE OR REPLACE FUNCTION public.get_team_edit_session(p_session_hash text)
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_session public.team_edit_link_sessions%ROWTYPE; v public.team_edit_links%ROWTYPE;
  c public.championships%ROWTYPE; t public.teams%ROWTYPE; ct public.championship_teams%ROWTYPE; v_state text;
BEGIN
  IF current_user NOT IN ('postgres','service_role','supabase_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO v_session FROM public.team_edit_link_sessions WHERE session_hash=p_session_hash AND expires_at>now() FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT 'invalid'::text,NULL,NULL,NULL,NULL,NULL,NULL,NULL; RETURN; END IF;
  SELECT * INTO v FROM public.team_edit_links WHERE id=v_session.link_id;
  SELECT * INTO c FROM public.championships WHERE id=v.championship_id AND organization_id=v.organization_id;
  SELECT * INTO t FROM public.teams WHERE id=v.team_id AND organization_id=v.organization_id;
  SELECT * INTO ct FROM public.championship_teams WHERE id=v.championship_team_id AND championship_id=v.championship_id AND team_id=v.team_id AND organization_id=v.organization_id;
  v_state := CASE WHEN v.status='blocked' THEN 'blocked' WHEN v.status='revoked' THEN 'revoked' WHEN v.status='replaced' THEN 'replaced' WHEN v.expires_at<=now() THEN 'expired' WHEN c.status IN ('suspended','archived') OR ct.status='archived' OR t.status='archived' THEN 'unavailable' ELSE 'valid' END;
  IF v_state <> 'valid' THEN DELETE FROM public.team_edit_link_sessions WHERE id=v_session.id; END IF;
  UPDATE public.team_edit_link_sessions SET last_seen_at=now() WHERE id=v_session.id AND v_state='valid';
  RETURN QUERY SELECT v_state,v_session.expires_at,c.name,c.logo_url,t.name,t.crest_url,v.expires_at,v.permissions;
END $$;

REVOKE ALL ON FUNCTION public.tg_team_edit_link_audit_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_team_edit_link(uuid,uuid,timestamptz,jsonb,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_team_edit_link(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unblock_team_edit_link(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_team_edit_link(uuid,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.extend_team_edit_link_expiration(uuid,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_team_edit_link_permissions(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_team_edit_link(uuid,uuid,timestamptz,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_team_edit_link(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_team_edit_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_team_edit_link(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_team_edit_link_expiration(uuid,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_edit_link_permissions(uuid,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.consume_team_edit_token(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_team_edit_session(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_team_edit_token(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_team_edit_session(text) TO service_role;
