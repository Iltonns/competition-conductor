-- Phase 4 continuity: gallery administration, match broadcasts and sponsor logos
-- backed by the championship media library.

ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS logo_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sponsors_logo_media_id_idx
  ON public.sponsors(logo_media_id)
  WHERE logo_media_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.save_championship_gallery(
  p_championship_id uuid,
  p_gallery_id uuid,
  p_payload jsonb
) RETURNS public.media_galleries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  result public.media_galleries%ROWTYPE;
  clean_slug text;
  target_status text;
  items jsonb;
BEGIN
  target := public.phase4_championship_context(p_championship_id);
  clean_slug := lower(trim(both '-' from regexp_replace(
    regexp_replace(COALESCE(p_payload->>'slug', p_payload->>'title'), '[^a-zA-Z0-9]+', '-', 'g'),
    '-+', '-', 'g'
  )));
  target_status := COALESCE(p_payload->>'status', 'draft');
  items := COALESCE(p_payload->'items', '[]'::jsonb);

  IF nullif(trim(p_payload->>'title'), '') IS NULL
     OR clean_slug = ''
     OR target_status NOT IN ('draft', 'published', 'archived')
     OR jsonb_typeof(items) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='publishing:invalid_gallery';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(items) item
    WHERE nullif(item->>'media_id', '') IS NULL
       OR COALESCE((item->>'display_order')::integer, 0) < 0
  ) OR (
    SELECT count(*) FROM jsonb_array_elements(items)
  ) <> (
    SELECT count(DISTINCT item->>'media_id') FROM jsonb_array_elements(items) item
  ) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='publishing:invalid_gallery_items';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(items) item
    LEFT JOIN public.media media_item
      ON media_item.id = (item->>'media_id')::uuid
     AND media_item.championship_id = p_championship_id
     AND media_item.organization_id = target.organization_id
     AND media_item.archived_at IS NULL
     AND media_item.mime_type LIKE 'image/%'
    WHERE media_item.id IS NULL
       OR (target_status = 'published' AND NOT media_item.is_public)
  ) THEN
    RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='publishing:gallery_media_outside_championship';
  END IF;

  IF target_status = 'published' AND jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='publishing:gallery_requires_media';
  END IF;

  IF p_gallery_id IS NULL THEN
    INSERT INTO public.media_galleries (
      organization_id, championship_id, title, slug, description, status,
      published_at, created_by, updated_by
    )
    VALUES (
      target.organization_id, p_championship_id, trim(p_payload->>'title'),
      clean_slug, nullif(trim(p_payload->>'description'), ''), target_status,
      CASE WHEN target_status = 'published' THEN now() END, auth.uid(), auth.uid()
    )
    RETURNING * INTO result;
  ELSE
    UPDATE public.media_galleries
    SET title = trim(p_payload->>'title'),
        slug = clean_slug,
        description = nullif(trim(p_payload->>'description'), ''),
        status = target_status,
        published_at = CASE
          WHEN target_status = 'published' THEN COALESCE(published_at, now())
          ELSE NULL
        END,
        updated_by = auth.uid(),
        updated_at = now()
    WHERE id = p_gallery_id
      AND championship_id = p_championship_id
      AND organization_id = target.organization_id
    RETURNING * INTO result;
  END IF;

  IF result.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='publishing:gallery_not_found';
  END IF;

  DELETE FROM public.media_gallery_items WHERE gallery_id = result.id;
  INSERT INTO public.media_gallery_items(gallery_id, media_id, display_order, caption)
  SELECT
    result.id,
    (item->>'media_id')::uuid,
    COALESCE((item->>'display_order')::integer, (row_number() OVER ())::integer - 1),
    nullif(trim(item->>'caption'), '')
  FROM jsonb_array_elements(items) item;

  INSERT INTO public.audit_logs(
    organization_id, user_id, entity_type, entity_id, action, new_data
  )
  VALUES (
    target.organization_id, auth.uid(), 'media_gallery', result.id, 'saved',
    jsonb_build_object('gallery', to_jsonb(result), 'items', items)
  );

  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='publishing:duplicate_gallery_slug';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_championship_match_public_details(
  p_championship_id uuid,
  p_match_id uuid,
  p_scheduled_at timestamptz,
  p_venue text,
  p_phase text,
  p_round text,
  p_broadcast_url text
) RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.matches%ROWTYPE;
  clean_broadcast_url text;
BEGIN
  PERFORM public.phase4_championship_context(p_championship_id);
  SELECT * INTO target
  FROM public.matches
  WHERE id = p_match_id AND championship_id = p_championship_id
  FOR UPDATE;

  IF target.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found';
  END IF;
  IF target.status::text NOT IN ('scheduled', 'preparing', 'postponed') THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:cannot_edit_public_details_in_status';
  END IF;

  clean_broadcast_url := nullif(trim(p_broadcast_url), '');
  IF clean_broadcast_url IS NOT NULL
     AND clean_broadcast_url !~ '^https://[a-zA-Z0-9.-]+(?:/[^[:space:]]*)?$' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='publishing:invalid_broadcast_url';
  END IF;

  UPDATE public.matches
  SET scheduled_at = p_scheduled_at,
      venue = nullif(trim(p_venue), ''),
      phase = nullif(trim(p_phase), ''),
      round = nullif(trim(p_round), ''),
      broadcast_url = clean_broadcast_url,
      updated_by = auth.uid(),
      updated_at = now()
  WHERE id = target.id
  RETURNING * INTO target;

  INSERT INTO public.audit_logs(
    organization_id, user_id, entity_type, entity_id, action, new_data
  )
  VALUES (
    target.organization_id, auth.uid(), 'match', target.id, 'public_details_updated',
    jsonb_build_object(
      'scheduled_at', target.scheduled_at,
      'venue', target.venue,
      'phase', target.phase,
      'round', target.round,
      'broadcast_url', target.broadcast_url
    )
  );

  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_championship_sponsor(
  p_championship_id uuid,
  p_sponsor_id uuid,
  p_payload jsonb
) RETURNS public.sponsors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  result public.sponsors%ROWTYPE;
  site text;
  logo_media uuid;
BEGIN
  target := public.phase4_championship_context(p_championship_id);
  site := nullif(trim(p_payload->>'website'), '');
  logo_media := nullif(p_payload->>'logo_media_id', '')::uuid;

  IF nullif(trim(p_payload->>'name'), '') IS NULL
     OR (site IS NOT NULL AND site !~ '^https://')
     OR COALESCE(p_payload->>'status', 'active') NOT IN ('active', 'inactive', 'archived')
     OR (
       logo_media IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.media media_item
         WHERE media_item.id = logo_media
           AND media_item.championship_id = p_championship_id
           AND media_item.organization_id = target.organization_id
           AND media_item.archived_at IS NULL
           AND media_item.mime_type LIKE 'image/%'
       )
     ) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='publishing:invalid_sponsor';
  END IF;

  IF p_sponsor_id IS NULL THEN
    INSERT INTO public.sponsors(
      organization_id, championship_id, name, logo_url, logo_media_id, website,
      tier, status, starts_at, ends_at, display_order, created_by, updated_by
    )
    VALUES(
      target.organization_id, p_championship_id, trim(p_payload->>'name'),
      nullif(trim(p_payload->>'logo_url'), ''), logo_media, site,
      nullif(trim(p_payload->>'tier'), ''), COALESCE(p_payload->>'status', 'active'),
      (p_payload->>'starts_at')::timestamptz, (p_payload->>'ends_at')::timestamptz,
      COALESCE((p_payload->>'display_order')::integer, 0), auth.uid(), auth.uid()
    )
    RETURNING * INTO result;
  ELSE
    UPDATE public.sponsors
    SET name = trim(p_payload->>'name'),
        logo_url = nullif(trim(p_payload->>'logo_url'), ''),
        logo_media_id = logo_media,
        website = site,
        tier = nullif(trim(p_payload->>'tier'), ''),
        status = COALESCE(p_payload->>'status', 'active'),
        starts_at = (p_payload->>'starts_at')::timestamptz,
        ends_at = (p_payload->>'ends_at')::timestamptz,
        display_order = COALESCE((p_payload->>'display_order')::integer, 0),
        updated_by = auth.uid(),
        updated_at = now()
    WHERE id = p_sponsor_id
      AND championship_id = p_championship_id
      AND organization_id = target.organization_id
    RETURNING * INTO result;
  END IF;

  IF result.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='publishing:sponsor_not_found';
  END IF;

  INSERT INTO public.audit_logs(
    organization_id, user_id, entity_type, entity_id, action, new_data
  )
  VALUES (
    target.organization_id, auth.uid(), 'sponsor', result.id, 'saved', to_jsonb(result)
  );
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_championship_media(
  p_championship_id uuid,
  p_media_id uuid
) RETURNS public.media
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  result public.media%ROWTYPE;
BEGIN
  target := public.phase4_championship_context(p_championship_id);
  IF EXISTS(SELECT 1 FROM public.championship_public_pages WHERE hero_media_id = p_media_id)
     OR EXISTS(SELECT 1 FROM public.media_gallery_items WHERE media_id = p_media_id)
     OR EXISTS(SELECT 1 FROM public.sponsors WHERE logo_media_id = p_media_id) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='publishing:media_in_use';
  END IF;
  UPDATE public.media
  SET archived_at=now(), is_public=false, updated_by=auth.uid(), updated_at=now()
  WHERE id=p_media_id AND championship_id=p_championship_id AND archived_at IS NULL
  RETURNING * INTO result;
  IF result.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='publishing:media_not_found';
  END IF;
  INSERT INTO public.audit_logs(
    organization_id,user_id,entity_type,entity_id,action,new_data
  )
  VALUES(target.organization_id,auth.uid(),'media',result.id,'archived',to_jsonb(result));
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_championship_portal(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  page public.championship_public_pages%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO target
  FROM public.championships
  WHERE slug=lower(trim(p_slug)) AND is_public AND status='published';
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
    'galleries',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',g.id,'title',g.title,'slug',g.slug,'description',g.description,
      'items',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'media_id',media_item.id,'title',media_item.title,'object_path',media_item.object_path,
        'alt_text',media_item.alt_text,'caption',gallery_item.caption
      ) ORDER BY gallery_item.display_order),'[]'::jsonb)
      FROM public.media_gallery_items gallery_item
      JOIN public.media media_item ON media_item.id=gallery_item.media_id
      WHERE gallery_item.gallery_id=g.id AND media_item.is_public AND media_item.archived_at IS NULL)
    ) ORDER BY g.published_at DESC),'[]'::jsonb)
    FROM public.media_galleries g
    WHERE g.championship_id=target.id AND g.status='published' AND g.published_at<=now()),
    'sponsors',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',s.id,'name',s.name,'logo_url',s.logo_url,'logo_object_path',logo.object_path,
      'website',s.website,'tier',s.tier
    ) ORDER BY s.display_order,s.name),'[]'::jsonb)
    FROM public.sponsors s
    LEFT JOIN public.media logo ON logo.id=s.logo_media_id AND logo.archived_at IS NULL
    WHERE s.championship_id=target.id AND s.status='active'
      AND (s.starts_at IS NULL OR s.starts_at<=now())
      AND (s.ends_at IS NULL OR s.ends_at>now()))
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_championship_gallery(uuid,uuid,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.update_championship_match_public_details(uuid,uuid,timestamptz,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_championship_gallery(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_championship_match_public_details(uuid,uuid,timestamptz,text,text,text,text) TO authenticated;
