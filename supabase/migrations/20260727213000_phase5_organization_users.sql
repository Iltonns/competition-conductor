-- Fase 5 / RF04: administracao segura de organizacoes, membros e convites.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'pt-BR';

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_locale_check;
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_locale_check
  CHECK (locale IN ('pt-BR', 'en-US', 'es-ES'));

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'provisioned', 'revoked', 'expired')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  last_sent_at timestamptz,
  send_count integer NOT NULL DEFAULT 0 CHECK (send_count >= 0),
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_invitations_email_check
    CHECK (email = lower(btrim(email)) AND length(email) BETWEEN 3 AND 320),
  CONSTRAINT organization_invitations_role_check
    CHECK (role <> 'owner'::public.app_role)
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_invitations_one_pending_email
  ON public.organization_invitations (organization_id, lower(email))
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS organization_invitations_email_status_idx
  ON public.organization_invitations (lower(email), status, expires_at);
CREATE INDEX IF NOT EXISTS organization_invitations_org_created_idx
  ON public.organization_invitations (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS organization_invitations_updated_at
  ON public.organization_invitations;
CREATE TRIGGER organization_invitations_updated_at
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organization invitations managers read"
  ON public.organization_invitations;
CREATE POLICY "organization invitations managers read"
  ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles actor_role
      WHERE actor_role.organization_id = organization_invitations.organization_id
        AND actor_role.user_id = auth.uid()
        AND actor_role.role IN ('owner'::public.app_role, 'admin'::public.app_role)
    )
  );

GRANT SELECT ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.organization_invitations FROM authenticated;

CREATE OR REPLACE FUNCTION public.organization_effective_role(
  p_organization_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT user_role.role
  FROM public.user_roles user_role
  WHERE user_role.organization_id = p_organization_id
    AND user_role.user_id = p_user_id
  ORDER BY CASE user_role.role
    WHEN 'owner'::public.app_role THEN 1
    WHEN 'admin'::public.app_role THEN 2
    WHEN 'editor'::public.app_role THEN 3
    ELSE 4
  END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_organization(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.organization_effective_role(p_organization_id, auth.uid())
      IN ('owner'::public.app_role, 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.assert_organization_role_assignment(
  p_organization_id uuid,
  p_new_role public.app_role
)
RETURNS public.app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor_role public.app_role;
BEGIN
  actor_role := public.organization_effective_role(p_organization_id, auth.uid());
  IF actor_role IS NULL OR actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:owner_invitation_not_allowed';
  END IF;
  IF actor_role = 'admin' AND p_new_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:privilege_escalation';
  END IF;
  RETURN actor_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_manageable_organizations()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', organization.id,
    'name', organization.name,
    'logo_url', organization.logo_url,
    'role', public.organization_effective_role(organization.id, auth.uid())
  ) ORDER BY organization.name), '[]'::jsonb)
  FROM public.organizations organization
  WHERE public.can_manage_organization(organization.id);
$$;

CREATE OR REPLACE FUNCTION public.get_organization_admin_context(p_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;

  SELECT jsonb_build_object(
    'organization', jsonb_build_object(
      'id', organization.id,
      'name', organization.name,
      'slug', organization.slug,
      'logo_url', organization.logo_url,
      'contact_email', organization.contact_email,
      'contact_phone', organization.contact_phone,
      'website_url', organization.website_url,
      'city', organization.city,
      'state', organization.state,
      'timezone', organization.timezone,
      'locale', organization.locale,
      'plan', organization.plan,
      'plan_expires_at', organization.plan_expires_at
    ),
    'actor_role', public.organization_effective_role(p_organization_id, auth.uid()),
    'actor_user_id', auth.uid(),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'display_name', profile.display_name,
        'email', profile.email,
        'avatar_url', profile.avatar_url,
        'role', public.organization_effective_role(p_organization_id, member.user_id),
        'joined_at', member.created_at
      ) ORDER BY lower(COALESCE(profile.display_name, profile.email, member.user_id::text)))
      FROM public.organization_members member
      LEFT JOIN public.profiles profile ON profile.id = member.user_id
      WHERE member.organization_id = p_organization_id
    ), '[]'::jsonb),
    'invitations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', invitation.id,
        'email', invitation.email,
        'role', invitation.role,
        'status', CASE
          WHEN invitation.status = 'pending' AND invitation.expires_at <= now() THEN 'expired'
          ELSE invitation.status
        END,
        'expires_at', invitation.expires_at,
        'last_sent_at', invitation.last_sent_at,
        'send_count', invitation.send_count,
        'created_at', invitation.created_at
      ) ORDER BY invitation.created_at DESC)
      FROM public.organization_invitations invitation
      WHERE invitation.organization_id = p_organization_id
        AND invitation.status IN ('pending', 'provisioned')
    ), '[]'::jsonb)
  )
  INTO result
  FROM public.organizations organization
  WHERE organization.id = p_organization_id;

  IF result IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:not_found';
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_organization_profile(
  p_organization_id uuid,
  p_profile jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  old_row public.organizations%ROWTYPE;
  updated_row public.organizations%ROWTYPE;
  normalized_name text := btrim(COALESCE(p_profile->>'name', ''));
  normalized_website text := NULLIF(btrim(p_profile->>'website_url'), '');
  normalized_logo text := NULLIF(btrim(p_profile->>'logo_url'), '');
  normalized_email text := NULLIF(lower(btrim(p_profile->>'contact_email')), '');
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  IF length(normalized_name) NOT BETWEEN 3 AND 120 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_name';
  END IF;
  IF normalized_website IS NOT NULL AND normalized_website !~* '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_website';
  END IF;
  IF normalized_logo IS NOT NULL AND normalized_logo !~* '^https://[^[:space:]]+$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_logo';
  END IF;
  IF normalized_email IS NOT NULL
     AND (
       normalized_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       OR length(normalized_email) > 320
     ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_email';
  END IF;
  IF length(COALESCE(p_profile->>'contact_phone', '')) > 40
     OR length(COALESCE(p_profile->>'city', '')) > 100
     OR length(COALESCE(p_profile->>'state', '')) > 3
     OR length(COALESCE(p_profile->>'timezone', '')) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_profile';
  END IF;
  IF COALESCE(p_profile->>'locale', 'pt-BR') NOT IN ('pt-BR', 'en-US', 'es-ES') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_locale';
  END IF;

  SELECT * INTO old_row
  FROM public.organizations
  WHERE id = p_organization_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:not_found';
  END IF;

  UPDATE public.organizations
  SET name = normalized_name,
      logo_url = normalized_logo,
      contact_email = normalized_email,
      contact_phone = NULLIF(btrim(p_profile->>'contact_phone'), ''),
      website_url = normalized_website,
      city = NULLIF(btrim(p_profile->>'city'), ''),
      state = NULLIF(upper(btrim(p_profile->>'state')), ''),
      timezone = COALESCE(NULLIF(btrim(p_profile->>'timezone'), ''), 'America/Sao_Paulo'),
      locale = COALESCE(NULLIF(btrim(p_profile->>'locale'), ''), 'pt-BR'),
      updated_by = auth.uid()
  WHERE id = p_organization_id
  RETURNING * INTO updated_row;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization', p_organization_id, 'updated',
    to_jsonb(old_row), to_jsonb(updated_row), '{}'::jsonb
  );
  RETURN public.get_organization_admin_context(p_organization_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_role public.app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_email text := lower(btrim(COALESCE(p_email, '')));
  existing_user uuid;
  invitation public.organization_invitations%ROWTYPE;
BEGIN
  PERFORM public.assert_organization_role_assignment(p_organization_id, p_role);
  IF normalized_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(normalized_email) > 320 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:invalid_email';
  END IF;

  SELECT profile.id INTO existing_user
  FROM public.profiles profile
  WHERE lower(profile.email) = normalized_email
  LIMIT 1;

  IF existing_user IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = p_organization_id AND user_id = existing_user
    ) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:already_member';
    END IF;
    INSERT INTO public.organization_members (organization_id, user_id)
      VALUES (p_organization_id, existing_user);
    DELETE FROM public.user_roles
      WHERE organization_id = p_organization_id AND user_id = existing_user;
    INSERT INTO public.user_roles (organization_id, user_id, role)
      VALUES (p_organization_id, existing_user, p_role);
    INSERT INTO public.organization_invitations (
      organization_id, email, role, status, invited_by, accepted_by, accepted_at
    ) VALUES (
      p_organization_id, normalized_email, p_role, 'provisioned',
      auth.uid(), existing_user, now()
    ) RETURNING * INTO invitation;
  ELSE
    INSERT INTO public.organization_invitations (
      organization_id, email, role, status, invited_by, expires_at
    ) VALUES (
      p_organization_id, normalized_email, p_role, 'pending',
      auth.uid(), now() + interval '7 days'
    )
    ON CONFLICT (organization_id, (lower(email))) WHERE status = 'pending'
    DO UPDATE SET
      role = EXCLUDED.role,
      invited_by = auth.uid(),
      expires_at = now() + interval '7 days',
      revoked_by = NULL,
      revoked_at = NULL
    RETURNING * INTO invitation;
    IF invitation.last_sent_at IS NOT NULL
       AND invitation.last_sent_at > now() - interval '60 seconds' THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'organization:resend_rate_limited';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, new_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization_invitation', invitation.id,
    CASE WHEN existing_user IS NULL THEN 'created' ELSE 'provisioned' END,
    jsonb_build_object('role', p_role, 'status', invitation.status),
    '{}'::jsonb
  );
  RETURN jsonb_build_object(
    'id', invitation.id,
    'email', invitation.email,
    'role', invitation.role,
    'status', invitation.status,
    'requires_email', existing_user IS NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_organization_invitation_resend(
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  invitation public.organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation
  FROM public.organization_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:invitation_not_found';
  END IF;
  PERFORM public.assert_organization_role_assignment(
    invitation.organization_id, invitation.role
  );
  IF invitation.status <> 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:invitation_not_pending';
  END IF;
  IF invitation.last_sent_at IS NOT NULL
     AND invitation.last_sent_at > now() - interval '60 seconds' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:resend_rate_limited';
  END IF;

  UPDATE public.organization_invitations
  SET expires_at = now() + interval '7 days'
  WHERE id = invitation.id
  RETURNING * INTO invitation;

  RETURN jsonb_build_object(
    'id', invitation.id, 'email', invitation.email, 'role', invitation.role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_organization_invitation_sent(
  p_invitation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  invitation public.organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation
  FROM public.organization_invitations
  WHERE id = p_invitation_id
  FOR UPDATE;
  IF NOT FOUND OR NOT public.can_manage_organization(invitation.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  UPDATE public.organization_invitations
  SET last_sent_at = now(), send_count = send_count + 1
  WHERE id = p_invitation_id AND status = 'pending';
  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, context
  ) VALUES (
    invitation.organization_id, auth.uid(), 'organization_invitation',
    invitation.id, 'sent', '{}'::jsonb
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_organization_invitation(
  p_invitation_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  invitation public.organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation FROM public.organization_invitations
  WHERE id = p_invitation_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_manage_organization(invitation.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization:forbidden';
  END IF;
  IF invitation.status <> 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization:invitation_not_pending';
  END IF;
  IF length(btrim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization:reason_required';
  END IF;
  UPDATE public.organization_invitations
  SET status = 'revoked', revoked_by = auth.uid(), revoked_at = now()
  WHERE id = invitation.id;
  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action, old_data, context
  ) VALUES (
    invitation.organization_id, auth.uid(), 'organization_invitation',
    invitation.id, 'revoked', to_jsonb(invitation),
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.change_organization_member_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_new_role public.app_role,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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

CREATE OR REPLACE FUNCTION public.remove_organization_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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

-- Convites sao consumidos no mesmo transaction boundary da criacao do usuario.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_org uuid;
  dname text;
  invitation public.organization_invitations%ROWTYPE;
  attached_count integer := 0;
BEGIN
  dname := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Usuario'
  );
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (NEW.id, dname, lower(NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

  FOR invitation IN
    SELECT *
    FROM public.organization_invitations
    WHERE lower(email) = lower(NEW.email)
      AND status = 'pending'
      AND expires_at > now()
    FOR UPDATE
  LOOP
    INSERT INTO public.organization_members (organization_id, user_id)
      VALUES (invitation.organization_id, NEW.id)
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    DELETE FROM public.user_roles
      WHERE organization_id = invitation.organization_id AND user_id = NEW.id;
    INSERT INTO public.user_roles (organization_id, user_id, role)
      VALUES (invitation.organization_id, NEW.id, invitation.role);
    UPDATE public.organization_invitations
    SET status = 'provisioned', accepted_by = NEW.id, accepted_at = now()
    WHERE id = invitation.id;
    attached_count := attached_count + 1;
  END LOOP;

  IF attached_count = 0 THEN
    INSERT INTO public.organizations (name, created_by)
      VALUES (dname || ' Organizacao', NEW.id) RETURNING id INTO new_org;
    INSERT INTO public.organization_members (organization_id, user_id)
      VALUES (new_org, NEW.id);
    INSERT INTO public.user_roles (user_id, organization_id, role)
      VALUES (NEW.id, new_org, 'owner');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_module_name(p_entity_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT CASE
    WHEN p_entity_type IN (
      'championship_settings', 'competition_stage', 'competition_group',
      'competition_round', 'competition_advancement', 'standings'
    ) THEN 'competition'
    WHEN p_entity_type IN (
      'match', 'match_event', 'match_lineup', 'match_report',
      'match_report_attachment', 'match_staff', 'substitution', 'referee',
      'referee_assignment', 'referee_unavailability', 'sanction'
    ) THEN 'sports'
    WHEN p_entity_type IN (
      'news', 'media', 'media_gallery', 'sponsor', 'championship_public_page'
    ) THEN 'publishing'
    WHEN p_entity_type IN ('financial_transaction', 'financial_attachment') THEN 'finance'
    WHEN p_entity_type IN (
      'championship', 'championship_team', 'team', 'athlete',
      'championship_operational_settings', 'organization',
      'organization_member', 'organization_invitation'
    ) THEN 'governance'
    ELSE 'other'
  END;
$$;

-- Todas as mutacoes administrativas passam pelas RPCs auditadas acima.
REVOKE INSERT, UPDATE, DELETE ON public.organization_members FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.organizations FROM authenticated;

REVOKE ALL ON FUNCTION public.organization_effective_role(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_organization(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assert_organization_role_assignment(uuid,public.app_role)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_manageable_organizations() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_organization_admin_context(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_organization_profile(uuid,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_organization_invitation(uuid,text,public.app_role)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prepare_organization_invitation_resend(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_organization_invitation_sent(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_organization_invitation(uuid,text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.change_organization_member_role(
  uuid,uuid,public.app_role,text
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_organization_member(uuid,uuid,text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.can_manage_organization(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_manageable_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_admin_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_organization_profile(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_invitation(
  uuid,text,public.app_role
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_organization_invitation_resend(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_organization_invitation_sent(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_organization_invitation(uuid,text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_organization_member_role(
  uuid,uuid,public.app_role,text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid,uuid,text)
  TO authenticated;
