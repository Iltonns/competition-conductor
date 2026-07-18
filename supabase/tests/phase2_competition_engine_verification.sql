-- Execute após 20260718190000_phase2_competition_engine.sql em homologação.
DO $$
DECLARE object_name text;
BEGIN
  FOREACH object_name IN ARRAY ARRAY[
    'competition_groups','competition_rounds','competition_stage_teams',
    'competition_generations','standings_adjustments','competition_advancements'
  ] LOOP
    IF to_regclass('public.'||object_name) IS NULL THEN
      RAISE EXCEPTION 'phase2:missing_table:%',object_name;
    END IF;
    IF has_table_privilege('authenticated','public.'||object_name,'INSERT')
       OR has_table_privilege('authenticated','public.'||object_name,'UPDATE')
       OR has_table_privilege('authenticated','public.'||object_name,'DELETE') THEN
      RAISE EXCEPTION 'phase2:direct_mutation_privilege:%',object_name;
    END IF;
  END LOOP;
  IF to_regprocedure('public.save_competition_settings(uuid,jsonb,text)') IS NULL
     OR to_regprocedure('public.publish_competition(uuid)') IS NULL
     OR to_regprocedure('public.generate_competition_groups(uuid,uuid,uuid,integer)') IS NULL
     OR to_regprocedure('public.commit_fixture_generation(uuid,uuid,uuid,uuid,jsonb,timestamptz,integer)') IS NULL
     OR to_regprocedure('public.confirm_stage_advancement(uuid,uuid,uuid,uuid,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'phase2:required_rpc_missing';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='matches_generated_fixture_unique') THEN
    RAISE EXCEPTION 'phase2:fixture_uniqueness_missing';
  END IF;
END $$;
