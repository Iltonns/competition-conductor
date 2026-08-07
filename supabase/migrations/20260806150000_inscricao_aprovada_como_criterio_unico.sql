-- P1 do PRD_FECHAMENTO_FINAL_PRODUCAO: fecha o vocabulario de
-- championship_teams.status, que 20260806120000 e 20260806140000 corrigiram pela
-- metade.
--
-- Aquelas duas trocaram `status <> 'archived'` por `archived_at IS NULL`, que era
-- a correcao do defeito, mas mantiveram o resto do predicado como estava:
-- `status <> 'rejected'`. Traducao fiel de um predicado que ja estava errado.
--
-- O que o proprio banco diz sobre quais inscricoes valem:
--
--   policy championship_teams_public_select (anon, authenticated)
--     -> status = 'approved'
--   view public_team_profiles
--     -> ct.status = 'approved'
--
-- Mas get_public_championship_portal e SECURITY DEFINER: contorna a policy e
-- devolvia para anon toda inscricao que nao fosse 'rejected' — incluindo
-- 'draft', 'submitted', 'under_review', 'cancelled' e 'withdrawn'. Ou seja, a
-- mesma linha que a policy recusa entregar pela tabela, a RPC entregava pela
-- pagina publica. Equipe que enviou inscricao pelo portal e nunca foi revisada
-- aparecia como participante do campeonato.
--
-- As tres superficies de competicao seguem o mesmo criterio, por decisao do
-- responsavel pelo produto: inscricao enviada e ainda nao revisada nao conta
-- como equipe participante. Nao muda nada para equipe criada pela
-- administracao, que ja nasce 'approved' em create_team_for_championship e em
-- teams.ts; muda para quem veio do portal publico, que e exatamente o caso que
-- precisa de revisao antes de valer.
--
-- Com isso o predicado passa a ser o mesmo em todo lugar:
--
--   ct.status = 'approved' AND ct.archived_at IS NULL

CREATE OR REPLACE FUNCTION public.phase1_team_in_championship(
  p_organization_id uuid, p_championship_id uuid, p_team_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = p_team_id
      AND t.organization_id = p_organization_id
      AND t.championship_id = p_championship_id
  ) OR EXISTS (
    SELECT 1 FROM public.championship_teams ct
    WHERE ct.team_id = p_team_id
      AND ct.organization_id = p_organization_id
      AND ct.championship_id = p_championship_id
      AND ct.status = 'approved'
      AND ct.archived_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.publish_competition(p_championship_id uuid)
RETURNS public.championships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target_org uuid; settings_row public.championship_settings%ROWTYPE; result public.championships%ROWTYPE; team_count int; stage_count int;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  SELECT count(*) INTO team_count FROM public.championship_teams WHERE championship_id=p_championship_id AND organization_id=target_org AND status='approved' AND archived_at IS NULL;
  SELECT count(*) INTO stage_count FROM public.competition_stages WHERE championship_id=p_championship_id AND organization_id=target_org AND status<>'archived';
  IF settings_row.id IS NULL OR team_count<2 OR stage_count<1 THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:publication_checklist_incomplete'; END IF;
  IF settings_row.competition_format IN ('groups','groups_knockout') AND (settings_row.group_count IS NULL OR settings_row.qualifiers_per_group IS NULL) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:group_settings_incomplete'; END IF;
  PERFORM set_config('app.phase2_publish','true',true);
  UPDATE public.championships SET status='published'::public.championship_status,updated_by=auth.uid(),updated_at=now() WHERE id=p_championship_id RETURNING * INTO result;
  UPDATE public.championship_settings SET published_at=now(),published_by=auth.uid(),updated_at=now() WHERE championship_id=p_championship_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target_org,auth.uid(),'championship',p_championship_id,'published',jsonb_build_object('checklist',true));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.recalculate_standings(
  p_championship_id uuid, p_stage_id uuid DEFAULT NULL::uuid,
  p_group_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target_org uuid; settings_row public.championship_settings%ROWTYPE;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id=p_championship_id;
  IF target_org IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='championship:not_found'; END IF;
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  IF settings_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:settings_not_found'; END IF;
  DELETE FROM public.standings s WHERE s.championship_id=p_championship_id AND s.stage_id IS NOT DISTINCT FROM p_stage_id AND s.group_id IS NOT DISTINCT FROM p_group_id AND s.category_id IS NOT DISTINCT FROM p_category_id;
  WITH eligible AS (
    SELECT st.team_id FROM public.competition_stage_teams st WHERE p_stage_id IS NOT NULL AND st.stage_id=p_stage_id AND st.group_id IS NOT DISTINCT FROM p_group_id
    UNION SELECT ct.team_id FROM public.championship_teams ct WHERE p_stage_id IS NULL AND ct.championship_id=p_championship_id AND ct.organization_id=target_org AND ct.status='approved' AND ct.archived_at IS NULL
  ), match_rows AS (
    SELECT m.id,m.home_team_id team_id,m.away_team_id opponent_id,1 played,(m.home_score>m.away_score)::int wins,(m.home_score=m.away_score)::int draws,(m.home_score<m.away_score)::int losses,COALESCE(m.home_score,0) goals_for,COALESCE(m.away_score,0) goals_against,CASE WHEN m.home_score>m.away_score THEN settings_row.points_win WHEN m.home_score=m.away_score THEN settings_row.points_draw ELSE settings_row.points_loss END points
    FROM public.matches m WHERE m.championship_id=p_championship_id AND m.status::text='finished' AND m.stage_id IS NOT DISTINCT FROM p_stage_id AND m.group_id IS NOT DISTINCT FROM p_group_id AND m.category_id IS NOT DISTINCT FROM p_category_id
    UNION ALL
    SELECT m.id,m.away_team_id,m.home_team_id,1,(m.away_score>m.home_score)::int,(m.away_score=m.home_score)::int,(m.away_score<m.home_score)::int,COALESCE(m.away_score,0),COALESCE(m.home_score,0),CASE WHEN m.away_score>m.home_score THEN settings_row.points_win WHEN m.away_score=m.home_score THEN settings_row.points_draw ELSE settings_row.points_loss END
    FROM public.matches m WHERE m.championship_id=p_championship_id AND m.status::text='finished' AND m.stage_id IS NOT DISTINCT FROM p_stage_id AND m.group_id IS NOT DISTINCT FROM p_group_id AND m.category_id IS NOT DISTINCT FROM p_category_id
  ), totals AS (
    SELECT e.team_id,COALESCE(sum(r.played),0)::int played,COALESCE(sum(r.wins),0)::int wins,COALESCE(sum(r.draws),0)::int draws,COALESCE(sum(r.losses),0)::int losses,COALESCE(sum(r.goals_for),0)::int goals_for,COALESCE(sum(r.goals_against),0)::int goals_against,COALESCE(sum(r.points),0)::int base_points
    FROM eligible e LEFT JOIN match_rows r ON r.team_id=e.team_id GROUP BY e.team_id
  ), decorated AS (
    SELECT t.*,COALESCE((SELECT sum(a.points) FROM public.standings_adjustments a WHERE a.championship_id=p_championship_id AND a.stage_id IS NOT DISTINCT FROM p_stage_id AND a.group_id IS NOT DISTINCT FROM p_group_id AND a.team_id=t.team_id),0)::int adjustment,
      COALESCE((SELECT sum(CASE WHEN e.type::text='yellow_card' THEN 1 WHEN e.type::text='red_card' THEN 3 ELSE 0 END) FROM public.match_events e JOIN public.matches m ON m.id=e.match_id WHERE m.championship_id=p_championship_id AND m.stage_id IS NOT DISTINCT FROM p_stage_id AND m.group_id IS NOT DISTINCT FROM p_group_id AND e.team_id=t.team_id AND e.deleted_at IS NULL),0)::int disciplinary_points
    FROM totals t
  ), with_h2h AS (
    SELECT d.*,COALESCE((SELECT sum(r.points) FROM match_rows r JOIN decorated opponent ON opponent.team_id=r.opponent_id WHERE r.team_id=d.team_id AND opponent.base_points=d.base_points),0)::int head_to_head_points FROM decorated d
  ), sortable AS (
    SELECT h.*,(h.base_points+h.adjustment)::int final_points,
      ARRAY(SELECT CASE criterion WHEN 'points' THEN h.base_points+h.adjustment WHEN 'wins' THEN h.wins WHEN 'goal_difference' THEN h.goals_for-h.goals_against WHEN 'goals_for' THEN h.goals_for WHEN 'head_to_head' THEN h.head_to_head_points WHEN 'fair_play' THEN -h.disciplinary_points WHEN 'draw' THEN (('x'||substr(md5(h.team_id::text||p_championship_id::text),1,8))::bit(32)::bigint%2147483647)::int ELSE 0 END FROM unnest(settings_row.tiebreakers) WITH ORDINALITY AS configured(criterion,position) ORDER BY position) sort_key
    FROM with_h2h h
  ), ranked AS (SELECT s.*,row_number() OVER(ORDER BY sort_key DESC,team_id)::int position FROM sortable s)
  INSERT INTO public.standings(organization_id,championship_id,team_id,position,played,wins,draws,losses,goals_for,goals_against,goal_difference,points,points_adjustment,disciplinary_points,stage_id,group_id,category_id,status,calculated_at,updated_at)
  SELECT target_org,p_championship_id,team_id,position,played,wins,draws,losses,goals_for,goals_against,goals_for-goals_against,final_points,adjustment,disciplinary_points,p_stage_id,p_group_id,p_category_id,'provisional',now(),now() FROM ranked;
END $$;

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
    -- Mesmo criterio da policy championship_teams_public_select, que esta RPC
    -- contorna por ser SECURITY DEFINER.
    'teams',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'short_name',t.short_name,'crest_url',t.crest_url) ORDER BY t.name),'[]'::jsonb) FROM public.championship_teams ct JOIN public.teams t ON t.id=ct.team_id WHERE ct.championship_id=target.id AND ct.status='approved' AND ct.archived_at IS NULL),
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
