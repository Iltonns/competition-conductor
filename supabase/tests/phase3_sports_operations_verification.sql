-- Run after 20260721170000_phase3_sports_operations.sql in staging.
BEGIN;

DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('match_reports'),('referee_unavailability'),('lineups'),('referee_assignments'),('sanctions')
  ) required(name)
  WHERE to_regclass('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 3 tables: %',missing; END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('save_match_lineup(uuid,uuid,uuid,jsonb)'),('save_match_report(uuid,uuid,jsonb)'),
    ('homologate_match_report(uuid,uuid)'),('reopen_match_report(uuid,uuid,text)'),
    ('save_referee(uuid,uuid,jsonb)'),('assign_referee(uuid,uuid,uuid,text,numeric)'),
    ('save_manual_sanction(uuid,uuid,jsonb)'),('revoke_sanction(uuid,uuid,text)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 3 RPCs: %',missing; END IF;

  IF has_table_privilege('anon','public.match_reports','SELECT')
     OR has_table_privilege('anon','public.sanctions','SELECT')
     OR has_table_privilege('authenticated','public.lineups','INSERT')
     OR has_table_privilege('authenticated','public.referee_assignments','UPDATE') THEN
    RAISE EXCEPTION 'Phase 3 direct privileges are broader than expected';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='phase3_automatic_card_sanction' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'Automatic card sanction trigger is missing';
  END IF;
END $$;

ROLLBACK;
