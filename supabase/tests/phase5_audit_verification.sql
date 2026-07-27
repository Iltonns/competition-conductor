-- Run after 20260727150000_phase5_audit_governance.sql in staging.
BEGIN;

DO $$
DECLARE
  missing text[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'championship_id'
  ) THEN
    RAISE EXCEPTION 'audit_logs.championship_id is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'sanitized_at'
  ) THEN
    RAISE EXCEPTION 'audit_logs.sanitized_at is missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('get_championship_audit_logs(uuid,integer,integer,uuid,text,text,text,uuid,timestamptz,timestamptz)'),
    ('export_championship_audit_logs(uuid,uuid,text,text,text,uuid,timestamptz,timestamptz)'),
    ('can_view_audit(uuid)'),
    ('purge_expired_audit_logs()'),
    ('sanitize_audit_json(jsonb)'),
    ('resolve_audit_championship(uuid,text,uuid,jsonb,jsonb,jsonb)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing Phase 5 audit functions: %', missing;
  END IF;

  IF has_table_privilege('anon', 'public.audit_logs', 'SELECT')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'INSERT')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') THEN
    RAISE EXCEPTION 'Audit table privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'anon',
       'public.get_championship_audit_logs(uuid,integer,integer,uuid,text,text,text,uuid,timestamptz,timestamptz)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon',
       'public.export_championship_audit_logs(uuid,uuid,text,text,text,uuid,timestamptz,timestamptz)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Anonymous audit RPC access is broader than expected';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.purge_expired_audit_logs()',
       'EXECUTE'
     )
     OR NOT has_function_privilege(
       'service_role',
       'public.purge_expired_audit_logs()',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Audit retention function privileges are invalid';
  END IF;

  IF public.sanitize_audit_json(
       '{"name":"visible","email":"secret@example.com","nested":{"access_token":"secret"}}'::jsonb
     ) <> '{"name":"visible","nested":{}}'::jsonb THEN
    RAISE EXCEPTION 'Audit JSON sanitizer did not remove sensitive fields';
  END IF;

  IF public.resolve_audit_championship(
       '00000000-0000-0000-0000-000000000001'::uuid,
       'championship',
       '2a220b78-5d2a-4a66-8706-62c2f16afa3a'::uuid,
       NULL,
       NULL,
       '{}'::jsonb
     ) IS NOT NULL THEN
    RAISE EXCEPTION 'Orphan audit championship resolution must return null';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.audit_logs audit
    LEFT JOIN public.championships championship
      ON championship.id = audit.championship_id
     AND championship.organization_id = audit.organization_id
    WHERE audit.championship_id IS NOT NULL
      AND championship.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Audit logs contain an invalid or cross-tenant championship';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND policyname = 'audit_logs_owner_admin_select'
  ) THEN
    RAISE EXCEPTION 'Owner/admin audit RLS policy is missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES ('audit_logs_enrich'), ('audit_logs_immutable')) required(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = required.name AND NOT tgisinternal
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing audit triggers: %', missing;
  END IF;

  IF to_regclass('public.audit_retention_policies') IS NULL THEN
    RAISE EXCEPTION 'Audit retention policy table is missing';
  END IF;
END
$$;

ROLLBACK;
