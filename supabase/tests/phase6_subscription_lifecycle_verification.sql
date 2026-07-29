-- Run after 20260729070000_phase6_subscription_lifecycle_reconciliation.sql.
BEGIN;

DO $$
BEGIN
  IF to_regprocedure(
    'public.reconcile_expired_organization_subscriptions(integer)'
  ) IS NULL THEN
    RAISE EXCEPTION 'subscription_reconciliation:rpc_missing';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.reconcile_expired_organization_subscriptions(integer)',
    'EXECUTE'
  ) OR has_function_privilege(
    'authenticated',
    'public.reconcile_expired_organization_subscriptions(integer)',
    'EXECUTE'
  ) OR NOT has_function_privilege(
    'service_role',
    'public.reconcile_expired_organization_subscriptions(integer)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:invalid_privileges';
  END IF;

  IF pg_get_functiondef(
    'public.reconcile_expired_organization_subscriptions(integer)'::regprocedure
  ) NOT ILIKE '%FOR UPDATE SKIP LOCKED%'
     OR pg_get_functiondef(
       'public.reconcile_expired_organization_subscriptions(integer)'::regprocedure
     ) NOT ILIKE '%pg_try_advisory_xact_lock%' THEN
    RAISE EXCEPTION 'subscription_reconciliation:concurrency_protection_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'organization_subscriptions_trial_expiration_idx'
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'organization_subscriptions_period_expiration_idx'
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:expiration_index_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint constraint_definition
    WHERE constraint_definition.conrelid = 'public.platform_operational_events'::regclass
      AND constraint_definition.conname = 'platform_operational_events_kind_check'
      AND pg_get_constraintdef(constraint_definition.oid) ILIKE '%job_event%'
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:job_event_kind_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM cron.job scheduled_job
    WHERE scheduled_job.jobname = 'is-arena-subscription-lifecycle'
      AND scheduled_job.schedule = '5 * * * *'
      AND scheduled_job.command =
        'SELECT public.reconcile_expired_organization_subscriptions();'
      AND scheduled_job.active
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:cron_job_missing';
  END IF;
END;
$$;

CREATE TEMP TABLE subscription_reconciliation_fixture (
  organization_id uuid PRIMARY KEY
) ON COMMIT DROP;

WITH created_organization AS (
  INSERT INTO public.organizations (
    id,
    name,
    slug,
    plan
  )
  VALUES (
    gen_random_uuid(),
    'Verificacao de reconciliacao de assinatura',
    'phase6-subscription-reconciliation-' || left(gen_random_uuid()::text, 8),
    'starter'
  )
  RETURNING id
)
INSERT INTO subscription_reconciliation_fixture (organization_id)
SELECT id FROM created_organization;

UPDATE public.organization_subscriptions subscription
SET
  status = 'active',
  current_period_ends_at = '2000-01-01 00:00:00+00',
  updated_at = now()
FROM subscription_reconciliation_fixture fixture
WHERE subscription.organization_id = fixture.organization_id;

SET LOCAL ROLE service_role;

DO $$
DECLARE
  result jsonb;
BEGIN
  result := public.reconcile_expired_organization_subscriptions(1000);
  IF NOT COALESCE((result->>'success')::boolean, false)
     OR COALESCE((result->>'skipped')::boolean, true) THEN
    RAISE EXCEPTION 'subscription_reconciliation:unexpected_result:%', result;
  END IF;
END;
$$;

RESET ROLE;

DO $$
DECLARE
  fixture_organization_id uuid;
BEGIN
  SELECT organization_id
  INTO fixture_organization_id
  FROM subscription_reconciliation_fixture;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_subscriptions subscription
    WHERE subscription.organization_id = fixture_organization_id
      AND subscription.status = 'past_due'
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:expired_subscription_not_reconciled';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_audit_logs audit
    WHERE audit.action = 'subscription.period_expired'
      AND audit.target_type = 'organization_subscription'
      AND audit.target_id = fixture_organization_id::text
      AND audit.actor_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:audit_missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.platform_operational_events event
    WHERE event.event_kind = 'job_event'
      AND event.source = 'job'
      AND event.code IN (
        'subscription.reconciliation.completed',
        'subscription.reconciliation.backlog'
      )
      AND event.route = '/jobs/subscription-lifecycle'
      AND event.actor_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'subscription_reconciliation:telemetry_missing';
  END IF;
END;
$$;

SELECT true AS phase6_subscription_lifecycle_verified;

ROLLBACK;
