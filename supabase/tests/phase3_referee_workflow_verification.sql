BEGIN;
DO $$
DECLARE missing text[];
BEGIN
  SELECT array_agg(required.name) INTO missing FROM (VALUES
    ('save_referee_unavailability(uuid,uuid,uuid,timestamptz,timestamptz,text)'),
    ('delete_referee_unavailability(uuid,uuid)'),
    ('set_referee_assignment_status(uuid,uuid,text,text)')
  ) required(name) WHERE to_regprocedure('public.'||required.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing referee workflow RPCs: %',missing; END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='referee_assignments' AND column_name='response_note') THEN
    RAISE EXCEPTION 'Missing referee assignment response fields';
  END IF;
  IF has_table_privilege('authenticated','public.referee_unavailability','INSERT') THEN
    RAISE EXCEPTION 'Direct referee unavailability writes must remain revoked';
  END IF;
END $$;
ROLLBACK;
