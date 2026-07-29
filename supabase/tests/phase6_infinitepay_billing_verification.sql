-- Run after 20260728230000_phase6_infinitepay_billing_foundation.sql.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.billing_checkout_orders') IS NULL
     OR to_regclass('public.billing_provider_events') IS NULL THEN
    RAISE EXCEPTION 'billing:required_table_missing';
  END IF;

  IF has_table_privilege('authenticated', 'public.billing_checkout_orders', 'SELECT')
     OR has_table_privilege('authenticated', 'public.billing_provider_events', 'SELECT') THEN
    RAISE EXCEPTION 'billing:raw_table_exposed';
  END IF;

  IF to_regprocedure('public.prepare_subscription_checkout(uuid,uuid,uuid)') IS NULL
     OR to_regprocedure('public.attach_subscription_checkout_url(uuid,text)') IS NULL
     OR to_regprocedure(
       'public.confirm_infinitepay_subscription_payment(text,text,text,text,integer,text)'
     ) IS NULL THEN
    RAISE EXCEPTION 'billing:required_rpc_missing';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'public.confirm_infinitepay_subscription_payment(text,text,text,text,integer,text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'billing:confirmation_rpc_exposed';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.prepare_subscription_checkout(uuid,uuid,uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'billing:checkout_rpc_unavailable';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'billing_checkout_orders_transaction_key'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'billing_provider_events'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ) THEN
    RAISE EXCEPTION 'billing:idempotency_index_missing';
  END IF;
END;
$$;

ROLLBACK;
