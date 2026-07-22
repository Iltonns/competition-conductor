-- Run after 20260722140000_phase3_complete_match_report.sql.
BEGIN;

DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(required.name) INTO missing
  FROM (VALUES ('match_staff'),('match_report_attachments')) required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 3 completion tables: %',missing; END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('save_match_staff(uuid,uuid,uuid,uuid[])'),
    ('save_match_substitution(uuid,uuid,uuid,uuid,uuid,uuid,integer,text,text)'),
    ('delete_match_substitution(uuid,uuid,uuid)'),
    ('register_match_report_attachment(uuid,uuid,text,text,text,bigint)'),
    ('delete_match_report_attachment(uuid,uuid,uuid)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 3 completion RPCs: %',missing; END IF;

  IF has_table_privilege('authenticated','public.match_staff','INSERT')
     OR has_table_privilege('authenticated','public.match_report_attachments','DELETE') THEN
    RAISE EXCEPTION 'Phase 3 completion direct privileges are broader than expected';
  END IF;

  IF NOT EXISTS(
    SELECT 1 FROM storage.buckets
    WHERE id='match-report-attachments' AND NOT public AND file_size_limit=10485760
      AND allowed_mime_types @> ARRAY['application/pdf','image/jpeg','image/png','image/webp']::text[]
  ) THEN RAISE EXCEPTION 'Private report attachment bucket is missing or invalid'; END IF;

  IF NOT EXISTS(
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
      AND policyname='match_report_attachments_admin_insert'
  ) THEN RAISE EXCEPTION 'Report attachment storage policy is missing'; END IF;

  IF NOT EXISTS(
    SELECT 1 FROM pg_get_functiondef('public.homologate_match_report(uuid,uuid)'::regprocedure)::text definition
    WHERE definition LIKE '%substitutions%' AND definition LIKE '%match_report_attachments%'
  ) THEN RAISE EXCEPTION 'Homologation snapshot does not contain the complete report'; END IF;
END $$;

ROLLBACK;
