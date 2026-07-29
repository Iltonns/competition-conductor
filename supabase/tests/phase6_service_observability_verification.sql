-- Run after 20260729060000_phase6_service_observability.sql.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure(
    'public.record_service_operational_event(text,text,text,text,text,integer,text)'
  ) IS NULL THEN
    RAISE EXCEPTION 'service_observability:rpc_missing';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.record_service_operational_event(text,text,text,text,text,integer,text)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.record_service_operational_event(text,text,text,text,text,integer,text)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.record_service_operational_event(text,text,text,text,text,integer,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'service_observability:invalid_privileges';
  END IF;

  IF pg_get_functiondef(
    'public.record_service_operational_event(text,text,text,text,text,integer,text)'::regprocedure
  ) NOT ILIKE '%interval ''1 hour''%'
     OR pg_get_functiondef(
       'public.record_service_operational_event(text,text,text,text,text,integer,text)'::regprocedure
     ) NOT ILIKE '%>= 100%'
     OR pg_get_functiondef(
       'public.record_service_operational_event(text,text,text,text,text,integer,text)'::regprocedure
     ) NOT ILIKE '%pg_advisory_xact_lock%' THEN
    RAISE EXCEPTION 'service_observability:rate_limit_missing';
  END IF;

  IF to_regclass(
    'public.platform_operational_events_service_rate_limit_idx'
  ) IS NULL THEN
    RAISE EXCEPTION 'service_observability:rate_limit_index_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_definition
    WHERE constraint_definition.conrelid = 'public.platform_operational_events'::regclass
      AND constraint_definition.conname = 'platform_operational_events_kind_check'
      AND pg_get_constraintdef(constraint_definition.oid) ILIKE '%webhook_event%'
  ) THEN
    RAISE EXCEPTION 'service_observability:webhook_success_kind_missing';
  END IF;
END;
$$;

SET LOCAL ROLE service_role;

SELECT public.record_service_operational_event(
  'webhook_event',
  'webhook',
  'info',
  'billing.webhook.verified',
  '/api/billing/infinitepay/webhook',
  25,
  NULL
);

RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.platform_operational_events event
    WHERE event.event_kind = 'webhook_event'
      AND event.source = 'webhook'
      AND event.code = 'billing.webhook.verified'
      AND event.route = '/api/billing/infinitepay/webhook'
      AND event.duration_ms = 25
      AND event.actor_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'service_observability:event_not_recorded';
  END IF;
END;
$$;

ROLLBACK;
