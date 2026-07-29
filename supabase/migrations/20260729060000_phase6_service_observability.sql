-- Fase 6 / F6-RF07: telemetria sanitizada de webhooks e falhas de servidor.

ALTER TABLE public.platform_operational_events
  DROP CONSTRAINT IF EXISTS platform_operational_events_kind_check;
ALTER TABLE public.platform_operational_events
  ADD CONSTRAINT platform_operational_events_kind_check
  CHECK (
    event_kind IN (
      'client_error',
      'server_error',
      'rpc_failure',
      'auth_failure',
      'job_failure',
      'webhook_event',
      'webhook_failure'
    )
  );

CREATE INDEX IF NOT EXISTS platform_operational_events_service_rate_limit_idx
  ON public.platform_operational_events (source, code, route, occurred_at DESC);

CREATE OR REPLACE FUNCTION public.record_service_operational_event(
  p_event_kind text,
  p_source text,
  p_severity text,
  p_code text,
  p_route text,
  p_duration_ms integer,
  p_fingerprint text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  clean_kind text := lower(btrim(COALESCE(p_event_kind, '')));
  clean_source text := lower(btrim(COALESCE(p_source, '')));
  clean_severity text := lower(btrim(COALESCE(p_severity, '')));
  clean_code text := lower(btrim(COALESCE(p_code, '')));
  clean_route text := btrim(COALESCE(p_route, ''));
  clean_fingerprint text := NULLIF(lower(btrim(COALESCE(p_fingerprint, ''))), '');
BEGIN
  IF clean_kind NOT IN ('server_error', 'rpc_failure', 'webhook_event', 'webhook_failure')
     OR clean_source NOT IN ('server', 'rpc', 'webhook')
     OR clean_severity NOT IN ('info', 'warning', 'error', 'critical')
     OR clean_code !~ '^[a-z][a-z0-9_.:-]{1,99}$'
     OR length(clean_route) NOT BETWEEN 1 AND 200
     OR left(clean_route, 1) <> '/'
     OR clean_route LIKE '%?%'
     OR clean_route LIKE '%#%'
     OR p_duration_ms IS NULL
     OR p_duration_ms NOT BETWEEN 0 AND 600000
     OR (
       clean_fingerprint IS NOT NULL
       AND clean_fingerprint !~ '^[0-9a-f]{8,64}$'
     ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
     MESSAGE = 'operational_event:invalid_service_event';
  END IF;

  -- Serializa apenas eventos com a mesma chave para manter o limite correto
  -- mesmo quando o provedor repete webhooks simultaneamente.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      clean_source || ':' || clean_code || ':' || clean_route,
      0
    )
  );

  IF (
    SELECT count(*)
    FROM public.platform_operational_events event
    WHERE event.source = clean_source
      AND event.code = clean_code
      AND event.route = clean_route
      AND event.occurred_at >= now() - interval '1 hour'
  ) >= 100 THEN
    RETURN false;
  END IF;

  INSERT INTO public.platform_operational_events (
    actor_user_id,
    event_kind,
    source,
    severity,
    code,
    fingerprint,
    route,
    duration_ms
  )
  VALUES (
    NULL,
    clean_kind,
    clean_source,
    clean_severity,
    clean_code,
    clean_fingerprint,
    clean_route,
    p_duration_ms
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_service_operational_event(
  text, text, text, text, text, integer, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_service_operational_event(
  text, text, text, text, text, integer, text
) TO service_role;
