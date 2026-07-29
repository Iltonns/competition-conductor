-- Fase 6 / F6-RF02 e F6-RF07: reconciliacao agendada do vencimento
-- de assinaturas, com auditoria administrativa e telemetria sanitizada.

CREATE EXTENSION IF NOT EXISTS pg_cron;

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
      'job_event',
      'job_failure',
      'webhook_event',
      'webhook_failure'
    )
  );

CREATE INDEX IF NOT EXISTS organization_subscriptions_trial_expiration_idx
  ON public.organization_subscriptions (trial_ends_at, id)
  WHERE status = 'trial' AND trial_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS organization_subscriptions_period_expiration_idx
  ON public.organization_subscriptions (current_period_ends_at, id)
  WHERE status = 'active' AND current_period_ends_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reconcile_expired_organization_subscriptions(
  p_batch_size integer DEFAULT 1000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  started_at timestamptz := clock_timestamp();
  reconciled_count integer := 0;
  backlog_count bigint := 0;
  duration_value integer;
  failure_state text;
BEGIN
  IF p_batch_size IS NULL OR p_batch_size NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription_reconciliation:invalid_batch_size';
  END IF;

  IF NOT pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended('subscription-lifecycle-reconciliation', 0)
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'skipped', true,
      'reason', 'concurrent_execution',
      'reconciled', 0
    );
  END IF;

  WITH candidates AS (
    SELECT
      subscription.id,
      subscription.organization_id,
      subscription.status AS old_status,
      CASE
        WHEN subscription.status = 'trial' THEN subscription.trial_ends_at
        ELSE subscription.current_period_ends_at
      END AS expired_at
    FROM public.organization_subscriptions subscription
    WHERE (
        subscription.status = 'trial'
        AND subscription.trial_ends_at IS NOT NULL
        AND subscription.trial_ends_at <= now()
      )
      OR (
        subscription.status = 'active'
        AND subscription.current_period_ends_at IS NOT NULL
        AND subscription.current_period_ends_at <= now()
      )
    ORDER BY
      CASE
        WHEN subscription.status = 'trial' THEN subscription.trial_ends_at
        ELSE subscription.current_period_ends_at
      END,
      subscription.id
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.organization_subscriptions subscription
    SET
      status = 'past_due',
      updated_at = now()
    FROM candidates candidate
    WHERE subscription.id = candidate.id
    RETURNING
      subscription.id,
      subscription.organization_id,
      candidate.old_status,
      candidate.expired_at,
      subscription.updated_at
  ),
  audited AS (
    INSERT INTO public.admin_audit_logs (
      action,
      actor_user_id,
      target_type,
      target_id,
      reason,
      context,
      old_data,
      new_data
    )
    SELECT
      'subscription.period_expired',
      NULL,
      'organization_subscription',
      updated.organization_id::text,
      'Periodo da assinatura vencido e reconciliado automaticamente.',
      jsonb_build_object(
        'source', 'scheduled_job',
        'subscription_id', updated.id
      ),
      jsonb_build_object(
        'status', updated.old_status,
        'expired_at', updated.expired_at
      ),
      jsonb_build_object(
        'status', 'past_due',
        'reconciled_at', updated.updated_at
      )
    FROM updated
    RETURNING 1
  )
  SELECT count(*)::integer
  INTO reconciled_count
  FROM audited;

  SELECT count(*)
  INTO backlog_count
  FROM public.organization_subscriptions subscription
  WHERE (
      subscription.status = 'trial'
      AND subscription.trial_ends_at IS NOT NULL
      AND subscription.trial_ends_at <= now()
    )
    OR (
      subscription.status = 'active'
      AND subscription.current_period_ends_at IS NOT NULL
      AND subscription.current_period_ends_at <= now()
    );

  duration_value := LEAST(
    600000,
    GREATEST(
      0,
      round(EXTRACT(epoch FROM (clock_timestamp() - started_at)) * 1000)::integer
    )
  );

  INSERT INTO public.platform_operational_events (
    actor_user_id,
    event_kind,
    source,
    severity,
    code,
    route,
    duration_ms
  )
  VALUES (
    NULL,
    'job_event',
    'job',
    CASE WHEN backlog_count > 0 THEN 'warning' ELSE 'info' END,
    CASE
      WHEN backlog_count > 0 THEN 'subscription.reconciliation.backlog'
      WHEN reconciled_count > 0 THEN 'subscription.reconciliation.completed'
      ELSE 'subscription.reconciliation.no_changes'
    END,
    '/jobs/subscription-lifecycle',
    duration_value
  );

  RETURN jsonb_build_object(
    'success', true,
    'skipped', false,
    'reconciled', reconciled_count,
    'remaining', backlog_count,
    'duration_ms', duration_value
  );
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS failure_state = RETURNED_SQLSTATE;
    duration_value := LEAST(
      600000,
      GREATEST(
        0,
        round(EXTRACT(epoch FROM (clock_timestamp() - started_at)) * 1000)::integer
      )
    );

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
      'job_failure',
      'job',
      'error',
      'subscription.reconciliation.failed',
      md5(COALESCE(failure_state, 'unknown')),
      '/jobs/subscription-lifecycle',
      duration_value
    );

    RETURN jsonb_build_object(
      'success', false,
      'skipped', false,
      'error', 'subscription_reconciliation:failed',
      'duration_ms', duration_value
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_expired_organization_subscriptions(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_expired_organization_subscriptions(integer)
  TO service_role;

SELECT cron.schedule(
  'is-arena-subscription-lifecycle',
  '5 * * * *',
  'SELECT public.reconcile_expired_organization_subscriptions();'
);
