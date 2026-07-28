-- Fase 5 / RF06: notificacoes internas idempotentes e preferencias por usuario/organizacao.
-- O canal de e-mail permanece desabilitado ate validacao explicita de SMTP.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid REFERENCES public.championships(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL DEFAULT 'internal',
  title text NOT NULL,
  message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'sent',
  scheduled_at timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS event_key text,
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_recipient_event_channel_unique
  ON public.notifications (user_id, channel, event_key)
  WHERE user_id IS NOT NULL AND event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_user_unread_created_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE channel = 'internal' AND read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_org_type_created_idx
  ON public.notifications (organization_id, notification_type, created_at DESC);

DROP TRIGGER IF EXISTS notifications_updated_at ON public.notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  internal_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_identity_unique
    UNIQUE (organization_id, user_id, notification_type)
);

DROP TRIGGER IF EXISTS notification_preferences_updated_at
  ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_delivery_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT false,
  smtp_validated_at timestamptz,
  smtp_validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_delivery_email_validation_check
    CHECK (NOT email_enabled OR smtp_validated_at IS NOT NULL)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_settings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'notifications',
        'notification_preferences',
        'notification_delivery_settings'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename
    );
  END LOOP;
END
$$;

CREATE POLICY "notifications_recipient_select"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "notification_preferences_self_select"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY "notification_delivery_members_select"
  ON public.notification_delivery_settings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));

REVOKE ALL ON public.notifications, public.notification_preferences,
  public.notification_delivery_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notifications, public.notification_preferences,
  public.notification_delivery_settings TO authenticated;
GRANT ALL ON public.notifications, public.notification_preferences,
  public.notification_delivery_settings TO service_role;

CREATE OR REPLACE FUNCTION public.notification_type_is_valid(p_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT p_type IN (
    'organization_invitation',
    'registration_submitted',
    'registration_review_requested',
    'match_changed',
    'referee_assigned',
    'publication_published'
  );
$$;

CREATE OR REPLACE FUNCTION public.emit_internal_notification(
  p_organization_id uuid,
  p_championship_id uuid,
  p_user_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_event_key text,
  p_action_url text DEFAULT NULL,
  p_source_type text DEFAULT NULL,
  p_source_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result uuid;
  internal_allowed boolean;
BEGIN
  IF p_user_id IS NULL
     OR NOT public.notification_type_is_valid(p_notification_type)
     OR nullif(btrim(p_event_key), '') IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_members member
    WHERE member.organization_id = p_organization_id
      AND member.user_id = p_user_id
  ) THEN
    RETURN NULL;
  END IF;
  IF p_championship_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.championships championship
    WHERE championship.id = p_championship_id
      AND championship.organization_id = p_organization_id
  ) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(preference.internal_enabled, true)
  INTO internal_allowed
  FROM (SELECT true) seed
  LEFT JOIN public.notification_preferences preference
    ON preference.organization_id = p_organization_id
   AND preference.user_id = p_user_id
   AND preference.notification_type = p_notification_type;

  IF NOT internal_allowed THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    organization_id, championship_id, user_id, notification_type, channel,
    title, message, payload, status, sent_at, event_key, action_url,
    actor_id, source_type, source_id
  ) VALUES (
    p_organization_id, p_championship_id, p_user_id, p_notification_type,
    'internal', left(btrim(p_title), 160), left(btrim(p_message), 500),
    public.sanitize_audit_json(COALESCE(p_payload, '{}'::jsonb)),
    'sent', now(), btrim(p_event_key), NULLIF(btrim(p_action_url), ''),
    auth.uid(), NULLIF(btrim(p_source_type), ''), NULLIF(btrim(p_source_id), '')
  )
  ON CONFLICT (user_id, channel, event_key)
    WHERE user_id IS NOT NULL AND event_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.emit_internal_notification_to_org(
  p_organization_id uuid,
  p_championship_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_event_key text,
  p_action_url text DEFAULT NULL,
  p_source_type text DEFAULT NULL,
  p_source_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_roles public.app_role[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  recipient record;
  emitted_count integer := 0;
BEGIN
  FOR recipient IN
    SELECT DISTINCT member.user_id
    FROM public.organization_members member
    WHERE member.organization_id = p_organization_id
      AND (
        p_roles IS NULL
        OR EXISTS (
          SELECT 1 FROM public.user_roles role
          WHERE role.organization_id = member.organization_id
            AND role.user_id = member.user_id
            AND role.role = ANY(p_roles)
        )
      )
  LOOP
    IF public.emit_internal_notification(
      p_organization_id, p_championship_id, recipient.user_id,
      p_notification_type, p_title, p_message,
      p_event_key || ':' || recipient.user_id::text,
      p_action_url, p_source_type, p_source_id, p_payload
    ) IS NOT NULL THEN
      emitted_count := emitted_count + 1;
    END IF;
  END LOOP;
  RETURN emitted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_notifications(p_limit integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT jsonb_build_object(
    'unread_count', (
      SELECT count(*) FROM public.notifications unread
      WHERE unread.user_id = auth.uid()
        AND unread.channel = 'internal'
        AND unread.read_at IS NULL
    ),
    'items', COALESCE((
      SELECT jsonb_agg(to_jsonb(page_row) ORDER BY page_row.created_at DESC)
      FROM (
        SELECT notification.id, notification.organization_id,
          notification.championship_id, notification.notification_type,
          notification.title, notification.message, notification.action_url,
          notification.read_at, notification.created_at
        FROM public.notifications notification
        WHERE notification.user_id = auth.uid()
          AND notification.channel = 'internal'
        ORDER BY notification.created_at DESC
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 30), 1), 100)
      ) page_row
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.mark_my_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND channel = 'internal';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'notification:not_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_my_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE user_id = auth.uid() AND channel = 'internal' AND read_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_notification_preferences(p_organization_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH types(notification_type, display_order) AS (
    VALUES
      ('organization_invitation', 1),
      ('registration_submitted', 2),
      ('registration_review_requested', 3),
      ('match_changed', 4),
      ('referee_assigned', 5),
      ('publication_published', 6)
  )
  SELECT CASE WHEN public.is_org_member(p_organization_id) THEN jsonb_build_object(
    'organization_id', p_organization_id,
    'email_available', COALESCE((
      SELECT settings.email_enabled AND settings.smtp_validated_at IS NOT NULL
      FROM public.notification_delivery_settings settings
      WHERE settings.organization_id = p_organization_id
    ), false),
    'preferences', jsonb_agg(jsonb_build_object(
      'notification_type', types.notification_type,
      'internal_enabled', COALESCE(preference.internal_enabled, true),
      'email_enabled', COALESCE(preference.email_enabled, false)
    ) ORDER BY types.display_order)
  ) ELSE NULL END
  FROM types
  LEFT JOIN public.notification_preferences preference
    ON preference.organization_id = p_organization_id
   AND preference.user_id = auth.uid()
   AND preference.notification_type = types.notification_type;
$$;

CREATE OR REPLACE FUNCTION public.save_my_notification_preferences(
  p_organization_id uuid,
  p_preferences jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  preference jsonb;
  preference_type text;
  email_available boolean;
BEGIN
  IF NOT public.is_org_member(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'notification:forbidden';
  END IF;
  IF jsonb_typeof(p_preferences) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'notification:invalid_preferences';
  END IF;
  SELECT COALESCE(settings.email_enabled AND settings.smtp_validated_at IS NOT NULL, false)
  INTO email_available
  FROM (SELECT true) seed
  LEFT JOIN public.notification_delivery_settings settings
    ON settings.organization_id = p_organization_id;

  FOR preference IN SELECT value FROM jsonb_array_elements(p_preferences)
  LOOP
    preference_type := preference->>'notification_type';
    IF NOT public.notification_type_is_valid(preference_type)
       OR jsonb_typeof(preference->'internal_enabled') <> 'boolean'
       OR jsonb_typeof(preference->'email_enabled') <> 'boolean' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'notification:invalid_preferences';
    END IF;
    IF COALESCE((preference->>'email_enabled')::boolean, false) AND NOT email_available THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'notification:email_unavailable';
    END IF;
    INSERT INTO public.notification_preferences (
      organization_id, user_id, notification_type, internal_enabled, email_enabled
    ) VALUES (
      p_organization_id, auth.uid(), preference_type,
      (preference->>'internal_enabled')::boolean,
      (preference->>'email_enabled')::boolean
    )
    ON CONFLICT (organization_id, user_id, notification_type)
    DO UPDATE SET
      internal_enabled = EXCLUDED.internal_enabled,
      email_enabled = EXCLUDED.email_enabled;
  END LOOP;
  RETURN public.get_my_notification_preferences(p_organization_id);
END;
$$;

-- Convite provisionado: notifica o usuario que passou a integrar a organizacao.
CREATE OR REPLACE FUNCTION public.tg_notify_organization_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'provisioned' AND NEW.accepted_by IS NOT NULL
     AND (
       TG_OP = 'INSERT'
       OR OLD.status IS DISTINCT FROM NEW.status
       OR OLD.accepted_by IS DISTINCT FROM NEW.accepted_by
     ) THEN
    PERFORM public.emit_internal_notification(
      NEW.organization_id, NULL, NEW.accepted_by, 'organization_invitation',
      'Você entrou em uma organização',
      'Seu acesso à organização foi provisionado com sucesso.',
      'organization_invitation:' || NEW.id::text || ':' || NEW.accepted_by::text,
      '/settings/users', 'organization_invitation', NEW.id::text,
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organization_invitation_notification
  ON public.organization_invitations;
CREATE TRIGGER organization_invitation_notification
  AFTER INSERT OR UPDATE OF status, accepted_by
  ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_organization_invitation();

-- Inscricao enviada/revisao solicitada. Criado dinamicamente para tolerar
-- ambientes em que o modulo de inscricao ainda nao foi provisionado.
CREATE OR REPLACE FUNCTION public.tg_notify_registration_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('submitted', 'pending') THEN
      PERFORM public.emit_internal_notification_to_org(
        NEW.organization_id, NEW.championship_id, 'registration_submitted',
        'Nova inscrição enviada',
        'Uma inscrição aguarda análise da organização.',
        'registration_submitted:' || NEW.id::text || ':' || NEW.status,
        '/championships/' || NEW.championship_id::text || '/teams',
        'registration_submission', NEW.id::text, '{}'::jsonb,
        ARRAY['owner','admin','editor']::public.app_role[]
      );
    ELSIF NEW.status IN ('changes_requested', 'revision_requested') THEN
      PERFORM public.emit_internal_notification_to_org(
        NEW.organization_id, NEW.championship_id,
        'registration_review_requested', 'Revisão solicitada',
        'Foram solicitados ajustes em uma inscrição.',
        'registration_review_requested:' || NEW.id::text || ':' || NEW.status,
        '/championships/' || NEW.championship_id::text || '/teams',
        'registration_submission', NEW.id::text, '{}'::jsonb,
        ARRAY['owner','admin','editor']::public.app_role[]
      );
      IF NEW.submitted_by IS NOT NULL THEN
        PERFORM public.emit_internal_notification(
          NEW.organization_id, NEW.championship_id, NEW.submitted_by,
          'registration_review_requested', 'Revisão solicitada',
          'A organização solicitou ajustes em uma inscrição.',
          'registration_review_requested:' || NEW.id::text || ':' ||
            NEW.status || ':' || NEW.submitted_by::text,
          '/championships/' || NEW.championship_id::text || '/teams',
          'registration_submission', NEW.id::text, '{}'::jsonb
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.registration_submissions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS registration_submission_notification
      ON public.registration_submissions;
    CREATE TRIGGER registration_submission_notification
      AFTER INSERT OR UPDATE OF status ON public.registration_submissions
      FOR EACH ROW EXECUTE FUNCTION public.tg_notify_registration_submission();
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.tg_notify_match_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  state_hash text;
BEGIN
  IF ROW(
    OLD.scheduled_at, OLD.venue, OLD.venue_id, OLD.home_team_id,
    OLD.away_team_id, OLD.status
  ) IS DISTINCT FROM ROW(
    NEW.scheduled_at, NEW.venue, NEW.venue_id, NEW.home_team_id,
    NEW.away_team_id, NEW.status
  ) THEN
    state_hash := md5(concat_ws('|', NEW.scheduled_at::text, NEW.venue,
      NEW.venue_id::text, NEW.home_team_id::text, NEW.away_team_id::text,
      NEW.status::text));
    PERFORM public.emit_internal_notification_to_org(
      NEW.organization_id, NEW.championship_id, 'match_changed',
      'Partida alterada', 'Data, local, participantes ou status de uma partida foi alterado.',
      'match_changed:' || NEW.id::text || ':' || state_hash,
      '/championships/' || NEW.championship_id::text || '/matches/' || NEW.id::text,
      'match', NEW.id::text, '{}'::jsonb, NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS match_changed_notification ON public.matches;
CREATE TRIGGER match_changed_notification
  AFTER UPDATE OF scheduled_at, venue, venue_id, home_team_id, away_team_id, status
  ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_match_changed();

CREATE OR REPLACE FUNCTION public.tg_notify_referee_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  state_hash text;
BEGIN
  IF TG_OP = 'INSERT'
     OR ROW(OLD.referee_id, OLD.assignment_role, OLD.confirmation_status)
        IS DISTINCT FROM
        ROW(NEW.referee_id, NEW.assignment_role, NEW.confirmation_status) THEN
    state_hash := md5(concat_ws('|', NEW.referee_id::text,
      NEW.assignment_role, NEW.confirmation_status));
    PERFORM public.emit_internal_notification_to_org(
      NEW.organization_id, NEW.championship_id, 'referee_assigned',
      'Escala de arbitragem atualizada',
      'Uma escala de arbitragem foi criada ou alterada.',
      'referee_assigned:' || NEW.id::text || ':' || state_hash,
      '/championships/' || NEW.championship_id::text || '/referees',
      'referee_assignment', NEW.id::text, '{}'::jsonb,
      ARRAY['owner','admin','editor']::public.app_role[]
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referee_assignment_notification
  ON public.referee_assignments;
CREATE TRIGGER referee_assignment_notification
  AFTER INSERT OR UPDATE OF referee_id, assignment_role, confirmation_status
  ON public.referee_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_referee_assignment();

CREATE OR REPLACE FUNCTION public.tg_notify_news_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND (
       TG_OP = 'INSERT'
       OR OLD.status IS DISTINCT FROM NEW.status
       OR (OLD.published_at IS NULL AND NEW.published_at IS NOT NULL)
     ) THEN
    PERFORM public.emit_internal_notification_to_org(
      NEW.organization_id, NEW.championship_id, 'publication_published',
      'Nova publicação', left('Conteúdo publicado: ' || NEW.title, 500),
      'publication_published:' || NEW.id::text,
      CASE WHEN NEW.championship_id IS NULL THEN '/championships'
        ELSE '/championships/' || NEW.championship_id::text || '/media' END,
      'news', NEW.id::text, '{}'::jsonb, NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS news_published_notification ON public.news;
CREATE TRIGGER news_published_notification
  AFTER INSERT OR UPDATE OF status, published_at ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_news_published();

REVOKE ALL ON FUNCTION public.notification_type_is_valid(text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.emit_internal_notification(
  uuid,uuid,uuid,text,text,text,text,text,text,text,jsonb
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.emit_internal_notification_to_org(
  uuid,uuid,text,text,text,text,text,text,text,jsonb,public.app_role[]
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_notifications(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_my_notification_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_all_my_notifications_read() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_notification_preferences(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_my_notification_preferences(uuid,jsonb)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.tg_notify_organization_invitation()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_registration_submission()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_match_changed()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_referee_assignment()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_notify_news_published()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_notifications(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_my_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_my_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_notification_preferences(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_my_notification_preferences(uuid,jsonb)
  TO authenticated;
