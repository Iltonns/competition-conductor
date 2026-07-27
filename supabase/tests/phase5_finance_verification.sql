-- Run after 20260727120000_phase5_finance_foundation.sql in staging.
BEGIN;

DO $$
DECLARE
  missing text[];
BEGIN
  SELECT array_agg(required.name) INTO missing
  FROM (VALUES ('financial_transactions'), ('financial_attachments')) required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing Phase 5 finance tables: %', missing;
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('competence_date'), ('due_date'), ('paid_at'), ('counterparty'), ('notes'),
    ('source_type'), ('source_id'), ('cancelled_at'), ('cancelled_by'),
    ('cancellation_reason')
  ) required(name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns column_info
    WHERE column_info.table_schema = 'public'
      AND column_info.table_name = 'financial_transactions'
      AND column_info.column_name = required.name
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing reconciled finance columns: %', missing;
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('get_championship_finance(uuid,date,date,text,text,text)'),
    ('save_financial_transaction(uuid,uuid,jsonb)'),
    ('settle_financial_transaction(uuid,uuid,timestamptz)'),
    ('reverse_financial_settlement(uuid,uuid,text)'),
    ('cancel_financial_transaction(uuid,uuid,text)'),
    ('register_financial_attachment(uuid,uuid,text,text,text,bigint)'),
    ('remove_financial_attachment(uuid,uuid)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing Phase 5 finance RPCs: %', missing;
  END IF;

  IF has_table_privilege('anon', 'public.financial_transactions', 'SELECT')
     OR has_table_privilege('authenticated', 'public.financial_transactions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.financial_transactions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.financial_transactions', 'DELETE')
     OR has_table_privilege('authenticated', 'public.financial_attachments', 'INSERT') THEN
    RAISE EXCEPTION 'Direct finance privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'anon', 'public.get_championship_finance(uuid,date,date,text,text,text)', 'EXECUTE'
     )
     OR has_function_privilege(
       'anon', 'public.save_financial_transaction(uuid,uuid,jsonb)', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Anonymous finance RPC access is broader than expected';
  END IF;

  IF NOT has_function_privilege(
       'authenticated', 'public.get_championship_finance(uuid,date,date,text,text,text)', 'EXECUTE'
     )
     OR NOT has_function_privilege(
       'authenticated', 'public.save_financial_transaction(uuid,uuid,jsonb)', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Authenticated finance RPC grants are missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'financial-attachments'
      AND NOT public
      AND file_size_limit = 10485760
  ) THEN
    RAISE EXCEPTION 'Financial attachments bucket is missing or unsafe';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_transactions'
      AND policyname = 'financial_transactions_admin_select'
  ) THEN
    RAISE EXCEPTION 'Finance RLS policy is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'financial_transactions_compat_sync'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Legacy finance compatibility trigger is missing';
  END IF;
END
$$;

ROLLBACK;
