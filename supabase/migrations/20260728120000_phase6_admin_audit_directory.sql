-- Phase 6 / F6-RF06: searchable, sanitized and immutable administrative audit.

CREATE INDEX IF NOT EXISTS admin_audit_logs_action_occurred_idx
  ON public.admin_audit_logs (action, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.sanitize_admin_audit_json(
  p_value jsonb
)
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

  IF jsonb_typeof(p_value) = 'object' THEN
    SELECT COALESCE(
      jsonb_object_agg(
        entry.key,
        CASE
          WHEN lower(entry.key) ~
            '(password|passwd|secret|token|authorization|cookie|api[_-]?key|private[_-]?key)'
          THEN to_jsonb('[REDACTED]'::text)
          ELSE public.sanitize_admin_audit_json(entry.value)
        END
      ),
      '{}'::jsonb
    )
    INTO result
    FROM jsonb_each(p_value) entry;

    RETURN result;
  END IF;

  IF jsonb_typeof(p_value) = 'array' THEN
    SELECT COALESCE(
      jsonb_agg(public.sanitize_admin_audit_json(entry.value) ORDER BY entry.ordinality),
      '[]'::jsonb
    )
    INTO result
    FROM jsonb_array_elements(p_value) WITH ORDINALITY entry(value, ordinality);

    RETURN result;
  END IF;

  RETURN p_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_system_admin_audit_logs(
  p_search text DEFAULT NULL,
  p_actor_user_id uuid DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_target_type text DEFAULT NULL,
  p_alert_category text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
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
  clean_search text;
  clean_action text := NULLIF(btrim(COALESCE(p_action, '')), '');
  clean_target_type text := NULLIF(btrim(COALESCE(p_target_type, '')), '');
  clean_alert_category text := NULLIF(btrim(COALESCE(p_alert_category, '')), '');
  safe_limit integer;
  safe_offset integer;
  result jsonb;
BEGIN
  PERFORM public.assert_system_admin();

  clean_search := public.system_admin_search(p_search);
  safe_limit := public.system_admin_page_size(p_limit);
  safe_offset := GREATEST(COALESCE(p_offset, 0), 0);

  IF clean_action IS NOT NULL AND length(clean_action) > 100 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'admin_audit:invalid_action';
  END IF;
  IF clean_target_type IS NOT NULL AND length(clean_target_type) > 100 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'admin_audit:invalid_target_type';
  END IF;
  IF clean_alert_category IS NOT NULL
    AND clean_alert_category NOT IN ('plan', 'suspension', 'support', 'privileged', 'general')
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'admin_audit:invalid_alert_category';
  END IF;
  IF p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND p_date_from > p_date_to THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'admin_audit:invalid_date_range';
  END IF;

  WITH classified AS MATERIALIZED (
    SELECT
      audit.id,
      audit.actor_user_id,
      COALESCE(profile.display_name, profile.email, audit.actor_user_id::text, 'Sistema')
        AS actor_name,
      profile.email AS actor_email,
      audit.action,
      audit.target_type,
      audit.target_id,
      audit.reason,
      audit.old_data,
      audit.new_data,
      audit.context,
      audit.occurred_at,
      CASE
        WHEN audit.action LIKE 'support\_%' ESCAPE '\' THEN 'support'
        WHEN lower(audit.action) ~ '(suspend|suspens)' THEN 'suspension'
        WHEN lower(audit.action) ~ '(plan|subscription|assinatura)' THEN 'plan'
        WHEN audit.action LIKE 'system_admin\_%' ESCAPE '\'
          OR lower(audit.action) ~ '(privileged|privilegiad)'
        THEN 'privileged'
        ELSE 'general'
      END AS alert_category,
      CASE
        WHEN lower(audit.action) ~ '(suspend|suspens)'
          OR audit.action IN ('system_admin_granted', 'system_admin_revoked')
        THEN 'critical'
        WHEN audit.action LIKE 'support\_%' ESCAPE '\'
          OR lower(audit.action) ~ '(plan|subscription|assinatura|privileged|privilegiad)'
        THEN 'warning'
        ELSE 'info'
      END AS severity
    FROM public.admin_audit_logs audit
    LEFT JOIN public.profiles profile ON profile.id = audit.actor_user_id
  ),
  filtered AS MATERIALIZED (
    SELECT *
    FROM classified item
    WHERE (p_actor_user_id IS NULL OR item.actor_user_id = p_actor_user_id)
      AND (clean_action IS NULL OR item.action = clean_action)
      AND (clean_target_type IS NULL OR item.target_type = clean_target_type)
      AND (clean_alert_category IS NULL OR item.alert_category = clean_alert_category)
      AND (p_date_from IS NULL OR item.occurred_at >= p_date_from)
      AND (p_date_to IS NULL OR item.occurred_at <= p_date_to)
      AND (
        clean_search IS NULL
        OR position(lower(clean_search) IN lower(concat_ws(
          ' ',
          item.action,
          item.target_type,
          item.target_id,
          item.reason,
          item.actor_name,
          item.actor_email
        ))) > 0
      )
  ),
  page AS (
    SELECT *
    FROM filtered
    ORDER BY occurred_at DESC, id DESC
    LIMIT safe_limit
    OFFSET safe_offset
  )
  SELECT jsonb_build_object(
    'items',
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', page.id,
          'actor_user_id', page.actor_user_id,
          'actor_name', page.actor_name,
          'actor_email', page.actor_email,
          'action', page.action,
          'target_type', page.target_type,
          'target_id', page.target_id,
          'reason', page.reason,
          'old_data', public.sanitize_admin_audit_json(page.old_data),
          'new_data', public.sanitize_admin_audit_json(page.new_data),
          'context', public.sanitize_admin_audit_json(page.context),
          'occurred_at', page.occurred_at,
          'alert_category', page.alert_category,
          'severity', page.severity
        )
        ORDER BY page.occurred_at DESC, page.id DESC
      )
      FROM page
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'limit', safe_limit,
    'offset', safe_offset,
    'alert_counts', jsonb_build_object(
      'plan', (SELECT count(*) FROM filtered WHERE alert_category = 'plan'),
      'suspension', (SELECT count(*) FROM filtered WHERE alert_category = 'suspension'),
      'support', (SELECT count(*) FROM filtered WHERE alert_category = 'support'),
      'privileged', (SELECT count(*) FROM filtered WHERE alert_category = 'privileged')
    ),
    'filter_options', jsonb_build_object(
      'actions', COALESCE((
        SELECT jsonb_agg(option.action ORDER BY option.action)
        FROM (SELECT DISTINCT action FROM classified) option
      ), '[]'::jsonb),
      'target_types', COALESCE((
        SELECT jsonb_agg(option.target_type ORDER BY option.target_type)
        FROM (SELECT DISTINCT target_type FROM classified) option
      ), '[]'::jsonb),
      'actors', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', option.actor_user_id,
            'name', option.actor_name,
            'email', option.actor_email
          )
          ORDER BY option.actor_name
        )
        FROM (
          SELECT DISTINCT actor_user_id, actor_name, actor_email
          FROM classified
          WHERE actor_user_id IS NOT NULL
        ) option
      ), '[]'::jsonb)
    ),
    'retention', jsonb_build_object(
      'mode', 'indefinite',
      'automatic_deletion', false
    )
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.sanitize_admin_audit_json(jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_system_admin_audit_logs(
  text,uuid,text,text,text,timestamptz,timestamptz,integer,integer
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_system_admin_audit_logs(
  text,uuid,text,text,text,timestamptz,timestamptz,integer,integer
) TO authenticated;

