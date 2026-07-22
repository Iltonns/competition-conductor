BEGIN;
DO $$ DECLARE missing text[]; BEGIN
  SELECT array_agg(v.name) INTO missing FROM (VALUES
    ('championship_public_pages'),('media_galleries'),('media_gallery_items')
  ) v(name) WHERE to_regclass('public.'||v.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 4 tables: %',missing; END IF;
  SELECT array_agg(v.name) INTO missing FROM (VALUES
    ('save_championship_news(uuid,uuid,jsonb)'),('save_championship_sponsor(uuid,uuid,jsonb)'),
    ('register_championship_media(uuid,jsonb)'),('save_championship_public_page(uuid,jsonb)'),
    ('set_championship_publication(uuid,boolean)'),('get_public_championship_portal(text)')
  ) v(name) WHERE to_regprocedure('public.'||v.name) IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'Missing Phase 4 RPCs: %',missing; END IF;
  IF has_table_privilege('authenticated','public.news','INSERT') OR has_table_privilege('authenticated','public.sponsors','DELETE') THEN
    RAISE EXCEPTION 'Direct publishing writes are broader than expected';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='championship-media' AND NOT public AND file_size_limit=10485760) THEN
    RAISE EXCEPTION 'Championship media bucket is missing or unsafe';
  END IF;
END $$;
ROLLBACK;
