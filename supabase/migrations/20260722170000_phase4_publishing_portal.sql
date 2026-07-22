-- Phase 4: real editorial content, media library, sponsors and public portal.

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.news
SET slug = lower(trim(both '-' from regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '-+', '-', 'g')))
           || '-' || left(id::text,8)
WHERE slug IS NULL;
UPDATE public.news SET status=CASE WHEN published_at IS NOT NULL THEN 'published' ELSE 'draft' END
WHERE status='draft' AND published_at IS NOT NULL;
ALTER TABLE public.news ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='news_status_check') THEN
    ALTER TABLE public.news ADD CONSTRAINT news_status_check
      CHECK(status IN ('draft','scheduled','published','archived'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS news_championship_slug_unique
  ON public.news(championship_id,slug) WHERE championship_id IS NOT NULL;

ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS object_path text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS media_object_path_unique
  ON public.media(object_path) WHERE object_path IS NOT NULL;

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='sponsors_status_check') THEN
    ALTER TABLE public.sponsors ADD CONSTRAINT sponsors_status_check CHECK(status IN ('active','inactive','archived'));
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='sponsors_period_check') THEN
    ALTER TABLE public.sponsors ADD CONSTRAINT sponsors_period_check CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at>starts_at);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.championship_public_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE UNIQUE,
  description text,
  theme jsonb NOT NULL DEFAULT '{"accent":"#bef52d","background":"#050706"}'::jsonb CHECK(jsonb_typeof(theme)='object'),
  contact jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(contact)='object'),
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(social_links)='object'),
  visible_sections jsonb NOT NULL DEFAULT '["matches","standings","teams","news","media","sponsors"]'::jsonb CHECK(jsonb_typeof(visible_sections)='array'),
  hero_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT championship_public_pages_same_org_fk FOREIGN KEY(championship_id,organization_id)
    REFERENCES public.championships(id,organization_id)
);

CREATE TABLE IF NOT EXISTS public.media_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(championship_id,slug)
);

CREATE TABLE IF NOT EXISTS public.media_gallery_items (
  gallery_id uuid NOT NULL REFERENCES public.media_galleries(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE RESTRICT,
  display_order integer NOT NULL DEFAULT 0,
  caption text,
  PRIMARY KEY(gallery_id,media_id)
);

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS broadcast_url text;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='matches_broadcast_url_check') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_broadcast_url_check
      CHECK(broadcast_url IS NULL OR broadcast_url ~ '^https://[a-zA-Z0-9.-]+(?:/[^[:space:]]*)?$');
  END IF;
END $$;

ALTER TABLE public.championship_public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS championship_public_pages_member_select ON public.championship_public_pages;
CREATE POLICY championship_public_pages_member_select ON public.championship_public_pages
  FOR SELECT TO authenticated USING(public.is_org_member(organization_id));
DROP POLICY IF EXISTS championship_public_pages_public_select ON public.championship_public_pages;
CREATE POLICY championship_public_pages_public_select ON public.championship_public_pages
  FOR SELECT TO anon,authenticated USING(EXISTS(
    SELECT 1 FROM public.championships c WHERE c.id=championship_id
      AND c.is_public AND c.status='published'
  ));

DROP POLICY IF EXISTS media_galleries_member_select ON public.media_galleries;
CREATE POLICY media_galleries_member_select ON public.media_galleries
  FOR SELECT TO authenticated USING(public.is_org_member(organization_id));
DROP POLICY IF EXISTS media_galleries_public_select ON public.media_galleries;
CREATE POLICY media_galleries_public_select ON public.media_galleries
  FOR SELECT TO anon,authenticated USING(status='published' AND published_at<=now() AND EXISTS(
    SELECT 1 FROM public.championships c WHERE c.id=championship_id
      AND c.is_public AND c.status='published'
  ));
DROP POLICY IF EXISTS media_gallery_items_member_select ON public.media_gallery_items;
CREATE POLICY media_gallery_items_member_select ON public.media_gallery_items
  FOR SELECT TO authenticated USING(EXISTS(
    SELECT 1 FROM public.media_galleries g WHERE g.id=gallery_id AND public.is_org_member(g.organization_id)
  ));
DROP POLICY IF EXISTS media_gallery_items_public_select ON public.media_gallery_items;
CREATE POLICY media_gallery_items_public_select ON public.media_gallery_items
  FOR SELECT TO anon,authenticated USING(EXISTS(
    SELECT 1 FROM public.media_galleries g JOIN public.championships c ON c.id=g.championship_id
    WHERE g.id=gallery_id AND g.status='published' AND g.published_at<=now()
      AND c.is_public AND c.status='published'
  ));

REVOKE ALL ON public.championship_public_pages,public.media_galleries,public.media_gallery_items FROM PUBLIC,anon;
REVOKE INSERT,UPDATE,DELETE ON public.news,public.media,public.sponsors,public.championship_public_pages,public.media_galleries,public.media_gallery_items FROM authenticated;
GRANT SELECT ON public.championship_public_pages,public.media_galleries,public.media_gallery_items TO anon,authenticated;
GRANT ALL ON public.championship_public_pages,public.media_galleries,public.media_gallery_items TO service_role;

DROP TRIGGER IF EXISTS championship_public_pages_updated_at ON public.championship_public_pages;
CREATE TRIGGER championship_public_pages_updated_at BEFORE UPDATE ON public.championship_public_pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS media_galleries_updated_at ON public.media_galleries;
CREATE TRIGGER media_galleries_updated_at BEFORE UPDATE ON public.media_galleries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('championship-media','championship-media',false,10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT(id) DO UPDATE SET public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit,
  allowed_mime_types=EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS championship_media_admin_insert ON storage.objects;
CREATE POLICY championship_media_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(
  bucket_id='championship-media' AND EXISTS(
    SELECT 1 FROM public.organizations o WHERE o.id::text=(storage.foldername(name))[1]
      AND public.can_administer_org(o.id)
  )
);
DROP POLICY IF EXISTS championship_media_admin_delete ON storage.objects;
CREATE POLICY championship_media_admin_delete ON storage.objects FOR DELETE TO authenticated USING(
  bucket_id='championship-media' AND EXISTS(
    SELECT 1 FROM public.organizations o WHERE o.id::text=(storage.foldername(name))[1]
      AND public.can_administer_org(o.id)
  )
);
DROP POLICY IF EXISTS championship_media_member_read ON storage.objects;
CREATE POLICY championship_media_member_read ON storage.objects FOR SELECT TO authenticated USING(
  bucket_id='championship-media' AND EXISTS(
    SELECT 1 FROM public.organizations o WHERE o.id::text=(storage.foldername(name))[1]
      AND public.is_org_member(o.id)
  )
);
DROP POLICY IF EXISTS championship_media_public_read ON storage.objects;
CREATE POLICY championship_media_public_read ON storage.objects FOR SELECT TO anon,authenticated USING(
  bucket_id='championship-media' AND EXISTS(
    SELECT 1 FROM public.media m JOIN public.championships c ON c.id=m.championship_id
    WHERE m.object_path=name AND m.is_public AND m.archived_at IS NULL
      AND c.is_public AND c.status='published'
  )
);

CREATE OR REPLACE FUNCTION public.phase4_championship_context(p_championship_id uuid)
RETURNS public.championships LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.championships%ROWTYPE;
BEGIN
  SELECT * INTO result FROM public.championships WHERE id=p_championship_id;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='publishing:championship_not_found'; END IF;
  IF NOT public.can_administer_org(result.organization_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='publishing:forbidden'; END IF;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_championship_news(p_championship_id uuid,p_news_id uuid,p_payload jsonb)
RETURNS public.news LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; result public.news%ROWTYPE; clean_slug text; clean_body text; target_status text;
BEGIN
  target:=public.phase4_championship_context(p_championship_id);
  clean_slug:=lower(trim(both '-' from regexp_replace(regexp_replace(COALESCE(p_payload->>'slug',p_payload->>'title'), '[^a-zA-Z0-9]+','-','g'),'-+','-','g')));
  clean_body:=trim(regexp_replace(COALESCE(p_payload->>'body',''),'<[^>]*>','','g'));
  target_status:=COALESCE(p_payload->>'status','draft');
  IF nullif(trim(p_payload->>'title'),'') IS NULL OR clean_slug='' OR target_status NOT IN('draft','scheduled','published','archived') THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='publishing:invalid_news';
  END IF;
  IF target_status='scheduled' AND (p_payload->>'scheduled_at')::timestamptz<=now() THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='publishing:invalid_schedule';
  END IF;
  IF p_news_id IS NULL THEN
    INSERT INTO public.news(organization_id,championship_id,title,slug,summary,body,image_url,author,is_featured,status,scheduled_at,published_at,archived_at,created_by,updated_by)
    VALUES(target.organization_id,p_championship_id,trim(p_payload->>'title'),clean_slug,nullif(trim(p_payload->>'summary'),''),nullif(clean_body,''),nullif(trim(p_payload->>'image_url'),''),nullif(trim(p_payload->>'author'),''),COALESCE((p_payload->>'is_featured')::boolean,false),target_status,(p_payload->>'scheduled_at')::timestamptz,CASE WHEN target_status='published' THEN now() END,CASE WHEN target_status='archived' THEN now() END,auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE
    UPDATE public.news SET title=trim(p_payload->>'title'),slug=clean_slug,summary=nullif(trim(p_payload->>'summary'),''),body=nullif(clean_body,''),image_url=nullif(trim(p_payload->>'image_url'),''),author=nullif(trim(p_payload->>'author'),''),is_featured=COALESCE((p_payload->>'is_featured')::boolean,false),status=target_status,scheduled_at=(p_payload->>'scheduled_at')::timestamptz,published_at=CASE WHEN target_status='published' THEN COALESCE(published_at,now()) ELSE NULL END,archived_at=CASE WHEN target_status='archived' THEN COALESCE(archived_at,now()) ELSE NULL END,updated_by=auth.uid(),updated_at=now()
    WHERE id=p_news_id AND championship_id=p_championship_id RETURNING * INTO result;
  END IF;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='publishing:news_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'news',result.id,'saved',to_jsonb(result));
  RETURN result;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='publishing:duplicate_news_slug';
END $$;

CREATE OR REPLACE FUNCTION public.save_championship_sponsor(p_championship_id uuid,p_sponsor_id uuid,p_payload jsonb)
RETURNS public.sponsors LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; result public.sponsors%ROWTYPE; site text;
BEGIN
  target:=public.phase4_championship_context(p_championship_id); site:=nullif(trim(p_payload->>'website'),'');
  IF nullif(trim(p_payload->>'name'),'') IS NULL OR (site IS NOT NULL AND site !~ '^https://') OR COALESCE(p_payload->>'status','active') NOT IN('active','inactive','archived') THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='publishing:invalid_sponsor';
  END IF;
  IF p_sponsor_id IS NULL THEN
    INSERT INTO public.sponsors(organization_id,championship_id,name,logo_url,website,tier,status,starts_at,ends_at,display_order,created_by,updated_by)
    VALUES(target.organization_id,p_championship_id,trim(p_payload->>'name'),nullif(trim(p_payload->>'logo_url'),''),site,nullif(trim(p_payload->>'tier'),''),COALESCE(p_payload->>'status','active'),(p_payload->>'starts_at')::timestamptz,(p_payload->>'ends_at')::timestamptz,COALESCE((p_payload->>'display_order')::int,0),auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE
    UPDATE public.sponsors SET name=trim(p_payload->>'name'),logo_url=nullif(trim(p_payload->>'logo_url'),''),website=site,tier=nullif(trim(p_payload->>'tier'),''),status=COALESCE(p_payload->>'status','active'),starts_at=(p_payload->>'starts_at')::timestamptz,ends_at=(p_payload->>'ends_at')::timestamptz,display_order=COALESCE((p_payload->>'display_order')::int,0),updated_by=auth.uid(),updated_at=now()
    WHERE id=p_sponsor_id AND championship_id=p_championship_id RETURNING * INTO result;
  END IF;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='publishing:sponsor_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'sponsor',result.id,'saved',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.register_championship_media(p_championship_id uuid,p_payload jsonb)
RETURNS public.media LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,storage AS $$
DECLARE target public.championships%ROWTYPE; result public.media%ROWTYPE; path text; mime text; bytes bigint;
BEGIN
  target:=public.phase4_championship_context(p_championship_id); path:=p_payload->>'object_path'; mime:=p_payload->>'mime_type'; bytes:=(p_payload->>'size_bytes')::bigint;
  IF nullif(trim(p_payload->>'title'),'') IS NULL OR bytes<=0 OR bytes>10485760 OR mime NOT IN('image/jpeg','image/png','image/webp','application/pdf')
    OR path NOT LIKE target.organization_id::text||'/'||p_championship_id::text||'/%'
    OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='championship-media' AND o.name=path) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='publishing:invalid_media';
  END IF;
  INSERT INTO public.media(organization_id,championship_id,title,description,media_type,is_public,is_featured,object_path,file_name,mime_type,size_bytes,alt_text,created_by,updated_by)
  VALUES(target.organization_id,p_championship_id,trim(p_payload->>'title'),nullif(trim(p_payload->>'description'),''),CASE WHEN mime='application/pdf' THEN 'document' ELSE 'image' END,COALESCE((p_payload->>'is_public')::boolean,false),COALESCE((p_payload->>'is_featured')::boolean,false),path,trim(p_payload->>'file_name'),mime,bytes,nullif(trim(p_payload->>'alt_text'),''),auth.uid(),auth.uid()) RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'media',result.id,'created',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.archive_championship_media(p_championship_id uuid,p_media_id uuid)
RETURNS public.media LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; result public.media%ROWTYPE;
BEGIN
  target:=public.phase4_championship_context(p_championship_id);
  IF EXISTS(SELECT 1 FROM public.championship_public_pages WHERE hero_media_id=p_media_id)
    OR EXISTS(SELECT 1 FROM public.media_gallery_items WHERE media_id=p_media_id) THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='publishing:media_in_use';
  END IF;
  UPDATE public.media SET archived_at=now(),is_public=false,updated_by=auth.uid(),updated_at=now() WHERE id=p_media_id AND championship_id=p_championship_id AND archived_at IS NULL RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='publishing:media_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'media',result.id,'archived',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_championship_public_page(p_championship_id uuid,p_payload jsonb)
RETURNS public.championship_public_pages LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; result public.championship_public_pages%ROWTYPE; sections jsonb;
BEGIN
  target:=public.phase4_championship_context(p_championship_id); sections:=COALESCE(p_payload->'visible_sections','[]'::jsonb);
  IF jsonb_typeof(sections)<>'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(sections) s WHERE s NOT IN('matches','standings','teams','scorers','news','media','sponsors')) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='publishing:invalid_sections';
  END IF;
  INSERT INTO public.championship_public_pages(organization_id,championship_id,description,theme,contact,social_links,visible_sections,hero_media_id,created_by,updated_by)
  VALUES(target.organization_id,p_championship_id,nullif(trim(p_payload->>'description'),''),COALESCE(p_payload->'theme','{}'::jsonb),COALESCE(p_payload->'contact','{}'::jsonb),COALESCE(p_payload->'social_links','{}'::jsonb),sections,(p_payload->>'hero_media_id')::uuid,auth.uid(),auth.uid())
  ON CONFLICT(championship_id) DO UPDATE SET description=EXCLUDED.description,theme=EXCLUDED.theme,contact=EXCLUDED.contact,social_links=EXCLUDED.social_links,visible_sections=EXCLUDED.visible_sections,hero_media_id=EXCLUDED.hero_media_id,updated_by=auth.uid(),updated_at=now() RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'championship_public_page',result.id,'saved',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.set_championship_publication(p_championship_id uuid,p_publish boolean)
RETURNS public.championships LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; result public.championships%ROWTYPE;
BEGIN
  target:=public.phase4_championship_context(p_championship_id);
  IF p_publish AND (nullif(trim(target.description),'') IS NULL OR nullif(trim(target.slug),'') IS NULL
    OR NOT EXISTS(SELECT 1 FROM public.championship_public_pages WHERE championship_id=p_championship_id)
    OR (SELECT count(*) FROM public.championship_teams WHERE championship_id=p_championship_id)<2) THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='publishing:checklist_incomplete';
  END IF;
  PERFORM set_config('app.phase2_publish','true',true);
  UPDATE public.championships SET is_public=p_publish,status=CASE WHEN p_publish THEN 'published'::public.championship_status ELSE 'draft'::public.championship_status END,published_at=CASE WHEN p_publish THEN now() ELSE NULL END,updated_by=auth.uid(),updated_at=now() WHERE id=p_championship_id RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'championship',result.id,CASE WHEN p_publish THEN 'published' ELSE 'unpublished' END,to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_championship_portal(p_slug text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.championships%ROWTYPE; page public.championship_public_pages%ROWTYPE; result jsonb;
BEGIN
  SELECT * INTO target FROM public.championships WHERE slug=lower(trim(p_slug)) AND is_public AND status='published';
  IF target.id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO page FROM public.championship_public_pages WHERE championship_id=target.id;
  SELECT jsonb_build_object(
    'championship',jsonb_build_object('id',target.id,'name',target.name,'slug',target.slug,'season',target.season,'description',COALESCE(page.description,target.description),'starts_at',target.starts_at,'ends_at',target.ends_at,'city',target.city,'state',target.state,'logo_url',target.logo_url,'cover_url',target.cover_url),
    'page',jsonb_build_object('theme',COALESCE(page.theme,'{}'::jsonb),'contact',COALESCE(page.contact,'{}'::jsonb),'social_links',COALESCE(page.social_links,'{}'::jsonb),'visible_sections',COALESCE(page.visible_sections,'[]'::jsonb)),
    'teams',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'short_name',t.short_name,'crest_url',t.crest_url) ORDER BY t.name),'[]'::jsonb) FROM public.championship_teams ct JOIN public.teams t ON t.id=ct.team_id WHERE ct.championship_id=target.id AND ct.status NOT IN('archived','rejected')),
    'matches',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',m.id,'scheduled_at',m.scheduled_at,'status',m.status,'home_score',m.home_score,'away_score',m.away_score,'venue',m.venue,'broadcast_url',m.broadcast_url,'home_team',jsonb_build_object('id',ht.id,'name',ht.name),'away_team',jsonb_build_object('id',at.id,'name',at.name)) ORDER BY m.scheduled_at DESC),'[]'::jsonb) FROM public.matches m LEFT JOIN public.teams ht ON ht.id=m.home_team_id LEFT JOIN public.teams at ON at.id=m.away_team_id WHERE m.championship_id=target.id),
    'standings',(SELECT COALESCE(jsonb_agg(jsonb_build_object('team_id',s.team_id,'team_name',t.name,'position',s.position,'played',s.played,'won',s.wins,'drawn',s.draws,'lost',s.losses,'goals_for',s.goals_for,'goals_against',s.goals_against,'goal_difference',s.goal_difference,'points',s.points) ORDER BY s.position),'[]'::jsonb) FROM public.standings s JOIN public.teams t ON t.id=s.team_id WHERE s.championship_id=target.id),
    'news',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'slug',n.slug,'summary',n.summary,'body',n.body,'image_url',n.image_url,'author',n.author,'published_at',COALESCE(n.published_at,n.scheduled_at),'is_featured',n.is_featured) ORDER BY COALESCE(n.published_at,n.scheduled_at) DESC),'[]'::jsonb) FROM public.news n WHERE n.championship_id=target.id AND n.archived_at IS NULL AND (n.status='published' OR (n.status='scheduled' AND n.scheduled_at<=now()))),
    'media',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',m.id,'title',m.title,'description',m.description,'media_type',m.media_type,'object_path',m.object_path,'external_url',m.external_url,'file_url',m.file_url,'alt_text',m.alt_text,'mime_type',m.mime_type,'is_featured',m.is_featured) ORDER BY m.created_at DESC),'[]'::jsonb) FROM public.media m WHERE m.championship_id=target.id AND m.is_public AND m.archived_at IS NULL),
    'sponsors',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'logo_url',s.logo_url,'website',s.website,'tier',s.tier) ORDER BY s.display_order,s.name),'[]'::jsonb) FROM public.sponsors s WHERE s.championship_id=target.id AND s.status='active' AND (s.starts_at IS NULL OR s.starts_at<=now()) AND (s.ends_at IS NULL OR s.ends_at>now()))
  ) INTO result;
  RETURN result;
END $$;

DROP POLICY IF EXISTS news_public_select ON public.news;
CREATE POLICY news_public_select ON public.news FOR SELECT TO anon,authenticated USING(
  archived_at IS NULL AND (status='published' OR (status='scheduled' AND scheduled_at<=now())) AND EXISTS(
    SELECT 1 FROM public.championships c WHERE c.id=news.championship_id AND c.organization_id=news.organization_id AND c.is_public AND c.status='published'
  )
);
DROP POLICY IF EXISTS sponsors_public_select ON public.sponsors;
CREATE POLICY sponsors_public_select ON public.sponsors FOR SELECT TO anon,authenticated USING(
  status='active' AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) AND EXISTS(
    SELECT 1 FROM public.championships c WHERE c.id=sponsors.championship_id AND c.organization_id=sponsors.organization_id AND c.is_public AND c.status='published'
  )
);

DO $$ DECLARE signature text; BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.phase4_championship_context(uuid)','public.save_championship_news(uuid,uuid,jsonb)',
    'public.save_championship_sponsor(uuid,uuid,jsonb)','public.register_championship_media(uuid,jsonb)',
    'public.archive_championship_media(uuid,uuid)','public.save_championship_public_page(uuid,jsonb)',
    'public.set_championship_publication(uuid,boolean)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',signature);
  END LOOP;
  REVOKE ALL ON FUNCTION public.get_public_championship_portal(text) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.get_public_championship_portal(text) TO anon,authenticated;
END $$;
