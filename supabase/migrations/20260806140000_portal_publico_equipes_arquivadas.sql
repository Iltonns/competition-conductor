-- P1 do PRD_FECHAMENTO_FINAL_PRODUCAO: setimo ponto do mesmo defeito de
-- vocabulario, encontrado pela guarda de regressao adicionada em
-- 2c_roster_rls_verification e nao pela varredura manual — a linha e longa e
-- ficou truncada na leitura inicial.
--
-- get_public_championship_portal listava as equipes com
--
--   AND ct.status NOT IN ('archived','rejected')
--
-- e 'archived' nunca foi valor aceito por championship_teams_status_check.
-- O filtro nao excluia nada: **equipe arquivada continuava aparecendo no portal
-- publico do campeonato**. Diferente dos outros seis, este vazava para pagina
-- aberta, sem autenticacao.
--
-- Vale o mesmo criterio de 20260806120000: arquivamento e archived_at, e o
-- descarte de 'rejected' fica como estava.

CREATE OR REPLACE FUNCTION public.get_public_championship_portal(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
    'teams',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'short_name',t.short_name,'crest_url',t.crest_url) ORDER BY t.name),'[]'::jsonb) FROM public.championship_teams ct JOIN public.teams t ON t.id=ct.team_id WHERE ct.championship_id=target.id AND ct.archived_at IS NULL AND ct.status<>'rejected'),
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
