-- Fase 5 / RF03: preferencias operacionais, arquivamento e zona de perigo.
-- As regras esportivas continuam em championship_settings (Fase 2).

ALTER TABLE public.championships
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.can_manage_championship_settings(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_org_member(p_organization_id)
    AND (
      public.current_user_has_role(p_organization_id, 'owner'::public.app_role)
      OR public.current_user_has_role(p_organization_id, 'admin'::public.app_role)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_permanently_delete_championship(
  p_organization_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.current_user_has_role(p_organization_id, 'owner'::public.app_role);
$$;

-- A policy anterior usava can_administer_org, que tambem inclui editor.
-- Alteracoes diretas no registro administrativo ficam restritas a owner/admin;
-- operacoes esportivas continuam passando pelas RPCs especificas da Fase 2.
DROP POLICY IF EXISTS "champ member write" ON public.championships;
DROP POLICY IF EXISTS "championships_admin_update" ON public.championships;
CREATE POLICY "championships_admin_update" ON public.championships
  FOR UPDATE TO authenticated
  USING (public.can_manage_championship_settings(organization_id))
  WITH CHECK (public.can_manage_championship_settings(organization_id));

CREATE TABLE IF NOT EXISTS public.championship_operational_settings (
  championship_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  locale text NOT NULL DEFAULT 'pt-BR',
  notification_preferences jsonb NOT NULL DEFAULT jsonb_build_object(
    'registration_updates', true,
    'match_changes', true,
    'referee_updates', true,
    'publication_updates', true
  ),
  enabled_integrations text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT championship_operational_settings_championship_org_fkey
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT championship_operational_settings_timezone_check
    CHECK (char_length(timezone) BETWEEN 1 AND 100),
  CONSTRAINT championship_operational_settings_locale_check
    CHECK (locale IN ('pt-BR', 'en-US', 'es-ES')),
  CONSTRAINT championship_operational_settings_notifications_check
    CHECK (jsonb_typeof(notification_preferences) = 'object'),
  CONSTRAINT championship_operational_settings_integrations_check
    CHECK (
      enabled_integrations <@ ARRAY[
        'registration_finance',
        'sponsorship_finance',
        'refereeing_finance'
      ]::text[]
    )
);

ALTER TABLE public.championship_operational_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS championship_operational_settings_owner_admin_select
  ON public.championship_operational_settings;
CREATE POLICY championship_operational_settings_owner_admin_select
  ON public.championship_operational_settings
  FOR SELECT TO authenticated
  USING (public.can_manage_championship_settings(organization_id));

REVOKE ALL ON public.championship_operational_settings FROM anon, authenticated;
GRANT SELECT ON public.championship_operational_settings TO authenticated;
GRANT ALL ON public.championship_operational_settings TO service_role;

CREATE OR REPLACE FUNCTION public.championship_dependency_summary(
  p_championship_id uuid,
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT jsonb_build_object(
    'matches', (
      SELECT count(*) FROM public.matches
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    ),
    'teams', (
      SELECT count(*) FROM public.teams
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    ),
    'registrations', (
      SELECT count(*) FROM public.championship_teams
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    ),
    'stages', (
      SELECT count(*) FROM public.competition_stages
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    ),
    'financial_transactions', (
      SELECT count(*) FROM public.financial_transactions
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    ),
    'content', (
      (SELECT count(*) FROM public.news
       WHERE championship_id = p_championship_id
         AND organization_id = p_organization_id)
      + (SELECT count(*) FROM public.media
         WHERE championship_id = p_championship_id
           AND organization_id = p_organization_id)
      + (SELECT count(*) FROM public.sponsors
         WHERE championship_id = p_championship_id
           AND organization_id = p_organization_id)
    ),
    'sports_operations', (
      (SELECT count(*) FROM public.referee_assignments
       WHERE championship_id = p_championship_id
         AND organization_id = p_organization_id)
      + (SELECT count(*) FROM public.sanctions
         WHERE championship_id = p_championship_id
           AND organization_id = p_organization_id)
    ),
    'audit_logs', (
      SELECT count(*) FROM public.audit_logs
      WHERE championship_id = p_championship_id
        AND organization_id = p_organization_id
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.championship_dependency_total(p_summary jsonb)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(sum(value::bigint), 0)
  FROM jsonb_each_text(COALESCE(p_summary, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.assert_championship_settings_manager(
  p_championship_id uuid,
  p_lock boolean DEFAULT false
)
RETURNS public.championships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
BEGIN
  IF p_lock THEN
    SELECT * INTO target
    FROM public.championships
    WHERE id = p_championship_id
    FOR UPDATE;
  ELSE
    SELECT * INTO target
    FROM public.championships
    WHERE id = p_championship_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'championship_settings:not_found';
  END IF;
  IF NOT public.can_manage_championship_settings(target.organization_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'championship_settings:forbidden';
  END IF;

  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_championship_operational_settings(
  p_championship_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  preferences public.championship_operational_settings%ROWTYPE;
  dependencies jsonb;
BEGIN
  target := public.assert_championship_settings_manager(p_championship_id, false);

  SELECT * INTO preferences
  FROM public.championship_operational_settings
  WHERE championship_id = target.id
    AND organization_id = target.organization_id;

  dependencies := public.championship_dependency_summary(
    target.id,
    target.organization_id
  );

  RETURN jsonb_build_object(
    'identity', jsonb_build_object(
      'id', target.id,
      'organization_id', target.organization_id,
      'name', target.name,
      'season', target.season,
      'description', target.description,
      'starts_at', target.starts_at,
      'ends_at', target.ends_at,
      'city', target.city,
      'state', target.state,
      'contact_email', target.contact_email,
      'contact_phone', target.contact_phone,
      'website_url', target.website_url,
      'instagram_url', target.instagram_url,
      'logo_url', target.logo_url,
      'status', target.status,
      'is_public', target.is_public
    ),
    'preferences', jsonb_build_object(
      'timezone', COALESCE(preferences.timezone, 'America/Sao_Paulo'),
      'locale', COALESCE(preferences.locale, 'pt-BR'),
      'notification_preferences', COALESCE(
        preferences.notification_preferences,
        jsonb_build_object(
          'registration_updates', true,
          'match_changes', true,
          'referee_updates', true,
          'publication_updates', true
        )
      ),
      'enabled_integrations', COALESCE(preferences.enabled_integrations, '{}'::text[])
    ),
    'governance', jsonb_build_object(
      'dependencies', dependencies,
      'dependency_total', public.championship_dependency_total(dependencies),
      'can_permanently_delete',
        public.can_permanently_delete_championship(target.organization_id)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_championship_operational_settings(
  p_championship_id uuid,
  p_identity jsonb,
  p_timezone text,
  p_locale text,
  p_notification_preferences jsonb,
  p_enabled_integrations text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  previous_preferences public.championship_operational_settings%ROWTYPE;
  saved_preferences public.championship_operational_settings%ROWTYPE;
  previous_snapshot jsonb;
  next_snapshot jsonb;
  start_date date;
  end_date date;
  normalized_name text;
  normalized_email text;
  normalized_website text;
  normalized_instagram text;
  normalized_integrations text[];
BEGIN
  target := public.assert_championship_settings_manager(p_championship_id, true);

  IF p_identity IS NULL OR jsonb_typeof(p_identity) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_identity';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_object_keys(p_identity) AS identity_field(key)
    WHERE identity_field.key NOT IN (
      'name', 'season', 'description', 'starts_at', 'ends_at', 'city', 'state',
      'contact_email', 'contact_phone', 'website_url', 'instagram_url'
    )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:unknown_identity_field';
  END IF;

  normalized_name := trim(COALESCE(p_identity->>'name', ''));
  IF char_length(normalized_name) NOT BETWEEN 3 AND 120 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_name';
  END IF;
  IF char_length(COALESCE(p_identity->>'season', '')) > 40
     OR char_length(COALESCE(p_identity->>'description', '')) > 4000
     OR char_length(COALESCE(p_identity->>'city', '')) > 120
     OR char_length(COALESCE(p_identity->>'state', '')) > 120
     OR char_length(COALESCE(p_identity->>'contact_phone', '')) > 40 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:field_too_long';
  END IF;

  start_date := NULLIF(p_identity->>'starts_at', '')::date;
  end_date := NULLIF(p_identity->>'ends_at', '')::date;
  IF start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_period';
  END IF;

  normalized_email := NULLIF(lower(trim(p_identity->>'contact_email')), '');
  IF normalized_email IS NOT NULL AND (
    char_length(normalized_email) > 254
    OR normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_email';
  END IF;

  normalized_website := NULLIF(trim(p_identity->>'website_url'), '');
  normalized_instagram := NULLIF(trim(p_identity->>'instagram_url'), '');
  IF normalized_website IS NOT NULL AND (
    char_length(normalized_website) > 2048
    OR normalized_website !~* '^https://[^[:space:]]+$'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_website';
  END IF;
  IF normalized_instagram IS NOT NULL AND (
    char_length(normalized_instagram) > 2048
    OR normalized_instagram !~* '^https://[^[:space:]]+$'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_instagram';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_timezone';
  END IF;
  IF p_locale IS NULL OR p_locale NOT IN ('pt-BR', 'en-US', 'es-ES') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_locale';
  END IF;
  IF p_notification_preferences IS NULL
     OR jsonb_typeof(p_notification_preferences) <> 'object'
     OR NOT p_notification_preferences ?& ARRAY[
       'registration_updates', 'match_changes',
       'referee_updates', 'publication_updates'
     ]
     OR EXISTS (
       SELECT 1
       FROM jsonb_each(p_notification_preferences) preference
       WHERE preference.key NOT IN (
         'registration_updates', 'match_changes',
         'referee_updates', 'publication_updates'
       )
         OR jsonb_typeof(preference.value) <> 'boolean'
     ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_notifications';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT integration ORDER BY integration), '{}'::text[])
  INTO normalized_integrations
  FROM unnest(COALESCE(p_enabled_integrations, '{}'::text[]))
    AS integrations(integration);
  IF NOT normalized_integrations <@ ARRAY[
    'registration_finance',
    'sponsorship_finance',
    'refereeing_finance'
  ]::text[] THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:invalid_integration';
  END IF;

  SELECT * INTO previous_preferences
  FROM public.championship_operational_settings
  WHERE championship_id = target.id;

  previous_snapshot := jsonb_build_object(
    'championship', to_jsonb(target),
    'preferences', CASE
      WHEN previous_preferences.championship_id IS NULL THEN NULL
      ELSE to_jsonb(previous_preferences)
    END
  );

  UPDATE public.championships
  SET
    name = normalized_name,
    season = NULLIF(trim(p_identity->>'season'), ''),
    description = NULLIF(trim(p_identity->>'description'), ''),
    starts_at = start_date,
    ends_at = end_date,
    city = NULLIF(trim(p_identity->>'city'), ''),
    state = NULLIF(trim(p_identity->>'state'), ''),
    contact_email = normalized_email,
    contact_phone = NULLIF(trim(p_identity->>'contact_phone'), ''),
    website_url = normalized_website,
    instagram_url = normalized_instagram,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = target.id
    AND organization_id = target.organization_id
  RETURNING * INTO target;

  INSERT INTO public.championship_operational_settings (
    championship_id,
    organization_id,
    timezone,
    locale,
    notification_preferences,
    enabled_integrations,
    updated_at,
    updated_by
  ) VALUES (
    target.id,
    target.organization_id,
    p_timezone,
    p_locale,
    p_notification_preferences,
    normalized_integrations,
    now(),
    auth.uid()
  )
  ON CONFLICT (championship_id) DO UPDATE SET
    timezone = EXCLUDED.timezone,
    locale = EXCLUDED.locale,
    notification_preferences = EXCLUDED.notification_preferences,
    enabled_integrations = EXCLUDED.enabled_integrations,
    updated_at = now(),
    updated_by = auth.uid()
  RETURNING * INTO saved_preferences;

  next_snapshot := jsonb_build_object(
    'championship_id', target.id,
    'championship', to_jsonb(target),
    'preferences', to_jsonb(saved_preferences)
  );

  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data
  ) VALUES (
    target.organization_id,
    auth.uid(),
    'championship_operational_settings',
    target.id,
    'updated',
    previous_snapshot,
    next_snapshot
  );

  RETURN public.get_championship_operational_settings(target.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_championship(
  p_championship_id uuid,
  p_confirmation text,
  p_reason text
)
RETURNS public.championships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  archived public.championships%ROWTYPE;
BEGIN
  target := public.assert_championship_settings_manager(p_championship_id, true);

  IF target.status = 'archived'::public.championship_status THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'championship_settings:already_archived';
  END IF;
  IF p_confirmation IS DISTINCT FROM target.name THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:confirmation_mismatch';
  END IF;
  IF char_length(trim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:reason_required';
  END IF;

  UPDATE public.championships
  SET
    status = 'archived'::public.championship_status,
    is_public = false,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE id = target.id
    AND organization_id = target.organization_id
  RETURNING * INTO archived;

  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    context
  ) VALUES (
    target.organization_id,
    auth.uid(),
    'championship',
    target.id,
    'archived',
    to_jsonb(target),
    to_jsonb(archived),
    jsonb_build_object('reason', trim(p_reason))
  );

  RETURN archived;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_championship_permanently(
  p_championship_id uuid,
  p_confirmation text,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  dependencies jsonb;
  dependency_total bigint;
BEGIN
  SELECT * INTO target
  FROM public.championships
  WHERE id = p_championship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship_settings:not_found';
  END IF;
  IF NOT public.can_permanently_delete_championship(target.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship_settings:owner_required';
  END IF;
  IF p_confirmation IS DISTINCT FROM target.name THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:confirmation_mismatch';
  END IF;
  IF char_length(trim(COALESCE(p_reason, ''))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_settings:reason_required';
  END IF;

  dependencies := public.championship_dependency_summary(
    target.id,
    target.organization_id
  );
  dependency_total := public.championship_dependency_total(dependencies);
  IF dependency_total > 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'championship_settings:has_dependencies',
      DETAIL = dependencies::text,
      HINT = 'archive_championship_instead';
  END IF;

  -- Logs existentes tambem sao uma dependencia: a FK usa ON DELETE SET NULL,
  -- mas a trilha e imutavel para clientes. O log da propria exclusao e criado
  -- somente depois do DELETE, ja sem vinculo FK com o registro removido.
  DELETE FROM public.championships
  WHERE id = target.id
    AND organization_id = target.organization_id;

  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    context
  ) VALUES (
    target.organization_id,
    auth.uid(),
    'championship',
    target.id,
    'permanently_deleted',
    to_jsonb(target),
    jsonb_build_object('reason', trim(p_reason))
  );
END;
$$;

-- A exclusao antiga nao exige confirmacao digitada nem justificativa.
REVOKE ALL ON FUNCTION public.delete_championship(uuid)
  FROM PUBLIC, anon, authenticated;

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
      'championship_operational_settings'
    ) THEN 'governance'
    ELSE 'other'
  END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_championship_settings(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_permanently_delete_championship(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.championship_dependency_summary(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.championship_dependency_total(jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_championship_settings_manager(uuid,boolean)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_championship_operational_settings(uuid)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_championship_operational_settings(
  uuid,jsonb,text,text,jsonb,text[]
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.archive_championship(uuid,text,text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_championship_permanently(uuid,text,text)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_manage_championship_settings(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_permanently_delete_championship(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_championship_operational_settings(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_championship_operational_settings(
  uuid,jsonb,text,text,jsonb,text[]
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_championship(uuid,text,text)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_championship_permanently(uuid,text,text)
  TO authenticated;
