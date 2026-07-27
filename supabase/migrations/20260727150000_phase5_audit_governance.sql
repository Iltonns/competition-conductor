-- Fase 5: auditoria contextual, imutavel, paginada e sanitizada.

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS championship_id uuid REFERENCES public.championships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sanitized_at timestamptz;

CREATE OR REPLACE FUNCTION public.audit_try_uuid(p_value text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog
AS $$
BEGIN
  IF p_value IS NULL OR p_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;
  RETURN p_value::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_audit_json(p_value jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_value IS NULL THEN
    RETURN NULL;
  END IF;

  CASE jsonb_typeof(p_value)
    WHEN 'object' THEN
      SELECT COALESCE(
        jsonb_object_agg(entry.key, public.sanitize_audit_json(entry.value)),
        '{}'::jsonb
      )
      INTO result
      FROM jsonb_each(p_value) entry
      WHERE lower(entry.key) !~ (
        'password|token|secret|authorization|document|cpf|cnpj|(^|_)rg($|_)|'
        || 'phone|email|object_path|signed_url|attachment_url'
      );
      RETURN result;
    WHEN 'array' THEN
      SELECT COALESCE(
        jsonb_agg(public.sanitize_audit_json(item.value) ORDER BY item.ordinality),
        '[]'::jsonb
      )
      INTO result
      FROM jsonb_array_elements(p_value) WITH ORDINALITY item(value, ordinality);
      RETURN result;
    ELSE
      RETURN p_value;
  END CASE;
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
    WHEN p_entity_type IN ('championship', 'championship_team', 'team', 'athlete') THEN 'registry'
    ELSE 'other'
  END;
$$;

-- Remove a assinatura da primeira versao local, caso o editor SQL tenha
-- persistido os statements anteriores ao erro de backfill.
DROP FUNCTION IF EXISTS public.resolve_audit_championship(text,uuid,jsonb,jsonb,jsonb);

CREATE OR REPLACE FUNCTION public.resolve_audit_championship(
  p_organization_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_old_data jsonb,
  p_new_data jsonb,
  p_context jsonb
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  resolved uuid;
  related_match_id uuid;
BEGIN
  SELECT championship.id INTO resolved
  FROM (
    VALUES
      (1, public.audit_try_uuid(p_context->>'championship_id')),
      (2, public.audit_try_uuid(p_new_data->>'championship_id')),
      (3, public.audit_try_uuid(p_old_data->>'championship_id')),
      (4, public.audit_try_uuid(p_new_data#>>'{gallery,championship_id}')),
      (5, public.audit_try_uuid(p_old_data#>>'{gallery,championship_id}'))
  ) candidate(priority, id)
  JOIN public.championships championship ON championship.id = candidate.id
  WHERE candidate.id IS NOT NULL
    AND championship.organization_id = p_organization_id
  ORDER BY candidate.priority
  LIMIT 1;

  IF resolved IS NOT NULL THEN
    RETURN resolved;
  END IF;

  related_match_id := public.audit_try_uuid(COALESCE(
    p_context->>'match_id',
    p_new_data->>'match_id',
    p_old_data->>'match_id'
  ));
  IF related_match_id IS NOT NULL THEN
    SELECT championship_id INTO resolved
    FROM public.matches
    WHERE id = related_match_id
      AND organization_id = p_organization_id;
    IF resolved IS NOT NULL THEN
      RETURN resolved;
    END IF;
  END IF;

  IF p_entity_type = 'championship' THEN
    SELECT id INTO resolved
    FROM public.championships
    WHERE id = p_entity_id
      AND organization_id = p_organization_id;
  ELSIF p_entity_type = 'championship_settings' THEN
    SELECT championship_id INTO resolved
    FROM public.championship_settings WHERE id = p_entity_id;
  ELSIF p_entity_type IN ('competition_stage', 'standings') THEN
    SELECT championship_id INTO resolved
    FROM public.competition_stages WHERE id = p_entity_id;
  ELSIF p_entity_type = 'competition_advancement' THEN
    SELECT championship_id INTO resolved
    FROM public.competition_advancements WHERE id = p_entity_id;
  ELSIF p_entity_type IN ('match', 'match_lineup', 'match_staff') THEN
    SELECT championship_id INTO resolved
    FROM public.matches WHERE id = p_entity_id;
  ELSIF p_entity_type = 'match_event' THEN
    SELECT match_record.championship_id INTO resolved
    FROM public.match_events event
    JOIN public.matches match_record ON match_record.id = event.match_id
    WHERE event.id = p_entity_id;
  ELSIF p_entity_type = 'match_report' THEN
    SELECT championship_id INTO resolved
    FROM public.match_reports WHERE id = p_entity_id;
  ELSIF p_entity_type = 'match_report_attachment' THEN
    SELECT championship_id INTO resolved
    FROM public.match_report_attachments WHERE id = p_entity_id;
  ELSIF p_entity_type = 'substitution' THEN
    SELECT match_record.championship_id INTO resolved
    FROM public.substitutions substitution
    JOIN public.matches match_record ON match_record.id = substitution.match_id
    WHERE substitution.id = p_entity_id;
  ELSIF p_entity_type = 'referee_assignment' THEN
    SELECT championship_id INTO resolved
    FROM public.referee_assignments WHERE id = p_entity_id;
  ELSIF p_entity_type = 'sanction' THEN
    SELECT championship_id INTO resolved
    FROM public.sanctions WHERE id = p_entity_id;
  ELSIF p_entity_type = 'news' THEN
    SELECT championship_id INTO resolved FROM public.news WHERE id = p_entity_id;
  ELSIF p_entity_type = 'media' THEN
    SELECT championship_id INTO resolved FROM public.media WHERE id = p_entity_id;
  ELSIF p_entity_type = 'media_gallery' THEN
    SELECT championship_id INTO resolved
    FROM public.media_galleries WHERE id = p_entity_id;
  ELSIF p_entity_type = 'sponsor' THEN
    SELECT championship_id INTO resolved FROM public.sponsors WHERE id = p_entity_id;
  ELSIF p_entity_type = 'championship_public_page' THEN
    SELECT championship_id INTO resolved
    FROM public.championship_public_pages WHERE id = p_entity_id;
  ELSIF p_entity_type = 'financial_transaction' THEN
    SELECT championship_id INTO resolved
    FROM public.financial_transactions WHERE id = p_entity_id;
  ELSIF p_entity_type = 'financial_attachment' THEN
    SELECT championship_id INTO resolved
    FROM public.financial_attachments WHERE id = p_entity_id;
  END IF;

  IF resolved IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.championships championship
    WHERE championship.id = resolved
      AND championship.organization_id = p_organization_id
  ) THEN
    resolved := NULL;
  END IF;

  RETURN resolved;
END;
$$;

-- Limpeza unica: remove campos sensiveis de payloads historicos e resolve o
-- campeonato quando o relacionamento ainda existe.
UPDATE public.audit_logs audit
SET
  championship_id = public.resolve_audit_championship(
    audit.organization_id,
    audit.entity_type,
    audit.entity_id,
    audit.old_data,
    audit.new_data,
    COALESCE(audit.context, '{}'::jsonb)
      || jsonb_strip_nulls(jsonb_build_object('championship_id', audit.championship_id))
  ),
  old_data = public.sanitize_audit_json(audit.old_data),
  new_data = public.sanitize_audit_json(audit.new_data),
  context = COALESCE(public.sanitize_audit_json(audit.context), '{}'::jsonb),
  sanitized_at = now();

CREATE OR REPLACE FUNCTION public.tg_enrich_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.championship_id := public.resolve_audit_championship(
    NEW.organization_id,
    NEW.entity_type,
    NEW.entity_id,
    NEW.old_data,
    NEW.new_data,
    COALESCE(NEW.context, '{}'::jsonb)
      || jsonb_strip_nulls(jsonb_build_object('championship_id', NEW.championship_id))
  );
  NEW.old_data := public.sanitize_audit_json(NEW.old_data);
  NEW.new_data := public.sanitize_audit_json(NEW.new_data);
  NEW.context := COALESCE(public.sanitize_audit_json(NEW.context), '{}'::jsonb);
  NEW.sanitized_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_enrich ON public.audit_logs;
CREATE TRIGGER audit_logs_enrich
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_enrich_audit_log();

CREATE OR REPLACE FUNCTION public.tg_guard_audit_log_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'audit:immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_guard_audit_log_immutability();

CREATE INDEX IF NOT EXISTS audit_logs_championship_created_idx
  ON public.audit_logs (championship_id, created_at DESC, id DESC)
  WHERE championship_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_logs_championship_filters_idx
  ON public.audit_logs (championship_id, entity_type, action, created_at DESC)
  WHERE championship_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx
  ON public.audit_logs (organization_id, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.audit_retention_policies (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  retention_months integer NOT NULL DEFAULT 60 CHECK (retention_months BETWEEN 12 AND 120),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.audit_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_view_audit(p_organization_id uuid)
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

DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_owner_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_owner_admin_select ON public.audit_logs
  FOR SELECT TO authenticated USING (public.can_view_audit(organization_id));

DROP POLICY IF EXISTS audit_retention_owner_admin_select ON public.audit_retention_policies;
CREATE POLICY audit_retention_owner_admin_select ON public.audit_retention_policies
  FOR SELECT TO authenticated USING (public.can_view_audit(organization_id));

REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
REVOKE ALL ON public.audit_retention_policies FROM anon, authenticated;
GRANT SELECT ON public.audit_retention_policies TO authenticated;
GRANT ALL ON public.audit_retention_policies TO service_role;

CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  removed_count bigint;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'audit:service_role_required';
  END IF;

  DELETE FROM public.audit_logs audit
  WHERE audit.created_at < (
    now() - make_interval(
      months => COALESCE(
        (
          SELECT retention.retention_months
          FROM public.audit_retention_policies retention
          WHERE retention.organization_id = audit.organization_id
        ),
        60
      )
    )
  );
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RETURN removed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_championship_context(p_championship_id uuid)
RETURNS public.championships
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.championships WHERE id = p_championship_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'audit:championship_not_found';
  END IF;
  IF NOT public.can_view_audit(target.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'audit:forbidden';
  END IF;
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_championship_audit_logs(
  p_championship_id uuid,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25,
  p_actor_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_module text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  page_number integer := GREATEST(COALESCE(p_page, 1), 1);
  page_size integer := LEAST(GREATEST(COALESCE(p_page_size, 25), 1), 100);
  result jsonb;
BEGIN
  target := public.audit_championship_context(p_championship_id);
  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND p_date_from > p_date_to THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'audit:invalid_period';
  END IF;

  WITH filtered AS (
    SELECT audit.*
    FROM public.audit_logs audit
    WHERE audit.organization_id = target.organization_id
      AND audit.championship_id = p_championship_id
      AND (p_actor_id IS NULL OR audit.user_id = p_actor_id)
      AND (p_action IS NULL OR audit.action = p_action)
      AND (p_module IS NULL OR public.audit_module_name(audit.entity_type) = p_module)
      AND (p_entity_type IS NULL OR audit.entity_type = p_entity_type)
      AND (p_entity_id IS NULL OR audit.entity_id = p_entity_id)
      AND (p_date_from IS NULL OR audit.created_at >= p_date_from)
      AND (p_date_to IS NULL OR audit.created_at <= p_date_to)
  ),
  page_rows AS (
    SELECT filtered.*
    FROM filtered
    ORDER BY created_at DESC, id DESC
    LIMIT page_size OFFSET (page_number - 1) * page_size
  )
  SELECT jsonb_build_object(
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', page_row.id,
        'championship_id', page_row.championship_id,
        'actor_id', page_row.user_id,
        'actor_name', COALESCE(profile.display_name, 'Usuário removido ou sistema'),
        'module', public.audit_module_name(page_row.entity_type),
        'entity_type', page_row.entity_type,
        'entity_id', page_row.entity_id,
        'action', page_row.action,
        'old_data', page_row.old_data,
        'new_data', page_row.new_data,
        'context', page_row.context,
        'created_at', page_row.created_at
      ) ORDER BY page_row.created_at DESC, page_row.id DESC)
      FROM page_rows page_row
      LEFT JOIN public.profiles profile ON profile.id = page_row.user_id
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'page', page_number,
    'page_size', page_size,
    'retention_months', COALESCE((
      SELECT retention.retention_months
      FROM public.audit_retention_policies retention
      WHERE retention.organization_id = target.organization_id
    ), 60),
    'filters', jsonb_build_object(
      'actions', COALESCE((
        SELECT jsonb_agg(action ORDER BY action)
        FROM (
          SELECT DISTINCT audit.action
          FROM public.audit_logs audit
          WHERE audit.championship_id = p_championship_id
            AND audit.organization_id = target.organization_id
        ) action_options
      ), '[]'::jsonb),
      'entity_types', COALESCE((
        SELECT jsonb_agg(entity_type ORDER BY entity_type)
        FROM (
          SELECT DISTINCT audit.entity_type
          FROM public.audit_logs audit
          WHERE audit.championship_id = p_championship_id
            AND audit.organization_id = target.organization_id
        ) entity_options
      ), '[]'::jsonb),
      'actors', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', actor.user_id,
          'name', COALESCE(profile.display_name, 'Usuário removido ou sistema')
        ) ORDER BY COALESCE(profile.display_name, 'Usuário removido ou sistema'))
        FROM (
          SELECT DISTINCT audit.user_id
          FROM public.audit_logs audit
          WHERE audit.championship_id = p_championship_id
            AND audit.organization_id = target.organization_id
        ) actor
        LEFT JOIN public.profiles profile ON profile.id = actor.user_id
      ), '[]'::jsonb)
    )
  )
  INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.export_championship_audit_logs(
  p_championship_id uuid,
  p_actor_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_module text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  row_count bigint;
  result jsonb;
BEGIN
  target := public.audit_championship_context(p_championship_id);
  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND p_date_from > p_date_to THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'audit:invalid_period';
  END IF;

  WITH filtered AS (
    SELECT audit.*
    FROM public.audit_logs audit
    WHERE audit.organization_id = target.organization_id
      AND audit.championship_id = p_championship_id
      AND (p_actor_id IS NULL OR audit.user_id = p_actor_id)
      AND (p_action IS NULL OR audit.action = p_action)
      AND (p_module IS NULL OR public.audit_module_name(audit.entity_type) = p_module)
      AND (p_entity_type IS NULL OR audit.entity_type = p_entity_type)
      AND (p_entity_id IS NULL OR audit.entity_id = p_entity_id)
      AND (p_date_from IS NULL OR audit.created_at >= p_date_from)
      AND (p_date_to IS NULL OR audit.created_at <= p_date_to)
  )
  SELECT count(*) INTO row_count FROM filtered;

  IF row_count > 5000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '54000',
      MESSAGE = 'audit:export_too_large',
      HINT = 'Narrow the date range or filters to at most 5000 records';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', audit.id,
    'actor_id', audit.user_id,
    'actor_name', COALESCE(profile.display_name, 'Usuário removido ou sistema'),
    'module', public.audit_module_name(audit.entity_type),
    'entity_type', audit.entity_type,
    'entity_id', audit.entity_id,
    'action', audit.action,
    'context', audit.context,
    'created_at', audit.created_at
  ) ORDER BY audit.created_at DESC, audit.id DESC), '[]'::jsonb)
  INTO result
  FROM public.audit_logs audit
  LEFT JOIN public.profiles profile ON profile.id = audit.user_id
  WHERE audit.organization_id = target.organization_id
    AND audit.championship_id = p_championship_id
    AND (p_actor_id IS NULL OR audit.user_id = p_actor_id)
    AND (p_action IS NULL OR audit.action = p_action)
    AND (p_module IS NULL OR public.audit_module_name(audit.entity_type) = p_module)
    AND (p_entity_type IS NULL OR audit.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR audit.entity_id = p_entity_id)
    AND (p_date_from IS NULL OR audit.created_at >= p_date_from)
    AND (p_date_to IS NULL OR audit.created_at <= p_date_to);

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_try_uuid(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sanitize_audit_json(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_module_name(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_audit_championship(uuid,text,uuid,jsonb,jsonb,jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_enrich_audit_log() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_guard_audit_log_immutability()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_view_audit(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_expired_audit_logs()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_championship_context(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_championship_audit_logs(
  uuid,integer,integer,uuid,text,text,text,uuid,timestamptz,timestamptz
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.export_championship_audit_logs(
  uuid,uuid,text,text,text,uuid,timestamptz,timestamptz
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.audit_module_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_audit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_championship_audit_logs(
  uuid,integer,integer,uuid,text,text,text,uuid,timestamptz,timestamptz
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_championship_audit_logs(
  uuid,uuid,text,text,text,uuid,timestamptz,timestamptz
) TO authenticated;
