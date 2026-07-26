BEGIN;
DO $$ DECLARE missing text[]; BEGIN
  SELECT array_agg(v.name) INTO missing FROM (VALUES
    ('championship_public_pages'),('media_galleries'),('media_gallery_items')
  ) v(name) WHERE to_regclass('public.'||v.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 4 tables: %',missing; END IF;
  SELECT array_agg(v.name) INTO missing FROM (VALUES
    ('save_championship_news(uuid,uuid,jsonb)'),('save_championship_sponsor(uuid,uuid,jsonb)'),
    ('register_championship_media(uuid,jsonb)'),('save_championship_public_page(uuid,jsonb)'),
    ('set_championship_publication(uuid,boolean)'),('get_public_championship_portal(text)'),
    ('save_championship_gallery(uuid,uuid,jsonb)'),
    ('update_championship_match_public_details(uuid,uuid,timestamptz,text,text,text,text)')
  ) v(name) WHERE to_regprocedure('public.'||v.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 4 RPCs: %',missing; END IF;
  IF has_table_privilege('authenticated','public.news','INSERT') OR has_table_privilege('authenticated','public.sponsors','DELETE') THEN
    RAISE EXCEPTION 'Direct publishing writes are broader than expected';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='championship-media' AND NOT public AND file_size_limit=10485760) THEN
    RAISE EXCEPTION 'Championship media bucket is missing or unsafe';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sponsors' AND column_name='logo_media_id'
  ) THEN
    RAISE EXCEPTION 'Sponsor media logo relation is missing';
  END IF;
  IF has_function_privilege('anon','public.save_championship_gallery(uuid,uuid,jsonb)','EXECUTE')
     OR has_function_privilege(
       'anon',
       'public.update_championship_match_public_details(uuid,uuid,timestamptz,text,text,text,text)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Anonymous publishing mutations are broader than expected';
  END IF;
END $$;
ROLLBACK;
