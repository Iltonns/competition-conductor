-- P1 do PRD_FECHAMENTO_FINAL_PRODUCAO: correcao do defeito de severidade alta
-- encontrado pela matriz de isolamento (2c_roster_rls_verification).
--
-- championship_teams.status carregava dois vocabularios concorrentes:
--
--   constraint em producao  draft, submitted, under_review, approved,
--                           rejected, cancelled, withdrawn   (default 'draft')
--   codigo                  'active', 'archived', 'pending'
--
-- Consequencia dupla, ambas silenciosas ate esta rodada:
--
--   1. set_team_championship_archived gravava 'archived', valor que o
--      constraint rejeita. Arquivar equipe falhava sempre, em producao.
--   2. Os seis leitores que filtravam status <> 'archived' nunca casavam nada,
--      porque nenhuma linha podia conter esse valor. O filtro que deveria
--      excluir equipes arquivadas nao excluia nenhuma.
--
-- Decisao do responsavel pelo produto: o vocabulario de inscricao manda.
-- `status` descreve apenas o ciclo de inscricao; o arquivamento passa a ser
-- expresso por `archived_at`, coluna que ja existia e que a propria RPC ja
-- preenchia. Uma equipe aprovada e arquivada continua registrada como aprovada,
-- em vez de perder o registro da aprovacao.
--
-- championship_teams estava vazia em producao quando esta migration foi
-- escrita, entao nao ha dado a converter.
--
-- Os corpos abaixo sao os de producao, com o predicado trocado e nada mais.

-- ---------------------------------------------------------------------------
-- 1. Convergencia de schema
--
-- Nenhuma migration do repositorio cria o constraint que producao tem: a de
-- 20260715190000 usa `IF NOT EXISTS (... conname ...)` e foi pulada porque o
-- constraint ja existia, com outra definicao. Um banco vazio construido pelo
-- repositorio ficava com pending/approved/archived e divergia de producao.
-- Aqui a definicao de producao passa a ser a versionada.
-- ---------------------------------------------------------------------------

ALTER TABLE public.championship_teams
  DROP CONSTRAINT IF EXISTS championship_teams_status_check;

ALTER TABLE public.championship_teams
  ADD CONSTRAINT championship_teams_status_check
  CHECK (status IN (
    'draft', 'submitted', 'under_review', 'approved',
    'rejected', 'cancelled', 'withdrawn'
  ));

ALTER TABLE public.championship_teams
  ALTER COLUMN status SET DEFAULT 'draft';

COMMENT ON COLUMN public.championship_teams.status IS
  'Ciclo de inscricao da equipe no campeonato. Arquivamento nao mora aqui: use archived_at.';
COMMENT ON COLUMN public.championship_teams.archived_at IS
  'Preenchido quando a inscricao e arquivada. NULL significa nao arquivada.';

-- ---------------------------------------------------------------------------
-- 2. Escritor: arquivar deixa de mexer em status
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_team_championship_archived(
  p_championship_id uuid, p_team_id uuid, p_archived boolean
) RETURNS public.championship_teams
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target public.championship_teams%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.championship_teams
  WHERE championship_id=p_championship_id AND team_id=p_team_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='team:not_found'; END IF;
  IF NOT public.can_administer_org(target.organization_id) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:forbidden'; END IF;
  -- status preserva o ciclo de inscricao; so archived_at muda.
  UPDATE public.championship_teams
    SET archived_at=CASE WHEN p_archived THEN now() ELSE NULL END, updated_by=auth.uid()
  WHERE id=target.id RETURNING * INTO target;
  RETURN target;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Leitores
--
-- COALESCE(ct.status,'active') era codigo morto: a coluna e NOT NULL. O
-- descarte de 'rejected' e preservado como estava; se 'cancelled' e 'withdrawn'
-- tambem devem sair destas contagens, e mudanca de regra de negocio e nao entra
-- junto com a correcao do defeito.
-- ---------------------------------------------------------------------------

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
      AND ct.archived_at IS NULL
      AND ct.status <> 'rejected'
  );
$$;

CREATE OR REPLACE FUNCTION public.publish_competition(p_championship_id uuid)
RETURNS public.championships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target_org uuid; settings_row public.championship_settings%ROWTYPE; result public.championships%ROWTYPE; team_count int; stage_count int;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  SELECT count(*) INTO team_count FROM public.championship_teams WHERE championship_id=p_championship_id AND organization_id=target_org AND archived_at IS NULL AND status<>'rejected';
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
    UNION SELECT ct.team_id FROM public.championship_teams ct WHERE p_stage_id IS NULL AND ct.championship_id=p_championship_id AND ct.organization_id=target_org AND ct.archived_at IS NULL AND ct.status<>'rejected'
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

CREATE OR REPLACE FUNCTION public.generate_team_edit_link(
  p_championship_id uuid, p_team_id uuid, p_expires_at timestamptz,
  p_permissions jsonb, p_admin_note text DEFAULT NULL::text
) RETURNS TABLE(link_id uuid, plaintext_token text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_link public.championship_teams%ROWTYPE;
  v_previous public.team_edit_links%ROWTYPE;
  v_created public.team_edit_links%ROWTYPE;
  v_permissions jsonb;
  v_token text;
  v_token_hash text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
  IF p_expires_at <= now() OR p_expires_at > now() + interval '90 days' THEN
    RAISE EXCEPTION 'invalid_expiration';
  END IF;
  IF NOT public.team_edit_permissions_are_valid(coalesce(p_permissions, '{}'::jsonb)) THEN
    RAISE EXCEPTION 'invalid_permissions';
  END IF;
  v_permissions := public.default_team_edit_permissions() || coalesce(p_permissions, '{}'::jsonb);
  v_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  SELECT * INTO v_link FROM public.championship_teams
  WHERE championship_id = p_championship_id AND team_id = p_team_id
    AND archived_at IS NULL
  FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN
    RAISE EXCEPTION 'team_link_not_found_or_forbidden';
  END IF;

  SELECT * INTO v_previous FROM public.team_edit_links
  WHERE championship_team_id = v_link.id AND status IN ('active', 'blocked')
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.team_edit_links SET
      status = 'replaced', replaced_at = now(), replaced_by = auth.uid(),
      blocked_at = NULL, blocked_by = NULL, block_reason = NULL
    WHERE id = v_previous.id;
  END IF;

  INSERT INTO public.team_edit_links (
    organization_id, championship_id, championship_team_id, team_id,
    token_hash, token_prefix, expires_at, permissions, metadata
  ) VALUES (
    v_link.organization_id, v_link.championship_id, v_link.id, v_link.team_id,
    v_token_hash, left(v_token, 8), p_expires_at, v_permissions,
    jsonb_build_object('admin_note', nullif(btrim(p_admin_note), ''))
  ) RETURNING * INTO v_created;

  IF v_previous.id IS NOT NULL THEN
    UPDATE public.team_edit_links SET replaced_by_link_id = v_created.id WHERE id = v_previous.id;
    INSERT INTO public.team_edit_link_events (
      organization_id, championship_id, team_id, link_id, event_type, actor_id,
      old_data, new_data
    ) VALUES (
      v_previous.organization_id, v_previous.championship_id, v_previous.team_id,
      v_previous.id, 'replaced', auth.uid(),
      jsonb_build_object('status', v_previous.status),
      jsonb_build_object('status', 'replaced', 'replacement_link_id', v_created.id)
    );
  END IF;

  INSERT INTO public.team_edit_link_events (
    organization_id, championship_id, team_id, link_id, event_type, actor_id, new_data
  ) VALUES (
    v_created.organization_id, v_created.championship_id, v_created.team_id,
    v_created.id, 'generated', auth.uid(),
    jsonb_build_object('expires_at', v_created.expires_at, 'permissions', v_created.permissions)
  );
  RETURN QUERY SELECT v_created.id, v_token;
END
$$;

CREATE OR REPLACE FUNCTION public.consume_team_edit_token(
  p_token_hash text, p_session_hash text, p_fingerprint_hash text
) RETURNS TABLE(
  access_state text, session_expires_at timestamptz, championship_name text,
  championship_logo_url text, team_name text, team_crest_url text,
  link_expires_at timestamptz, effective_permissions jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v public.team_edit_links%ROWTYPE;
  v_championship public.championships%ROWTYPE;
  v_team public.teams%ROWTYPE;
  v_participation public.championship_teams%ROWTYPE;
  v_session public.team_edit_link_sessions%ROWTYPE;
  v_session_expires timestamptz;
  v_count_access boolean := false;
  v_rate public.team_access_rate_limits%ROWTYPE;
  v_event text;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_token_hash !~ '^[0-9a-f]{64}$'
    OR p_session_hash !~ '^[0-9a-f]{64}$'
    OR p_fingerprint_hash !~ '^[0-9a-f]{64}$'
  THEN
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  INSERT INTO public.team_access_rate_limits(fingerprint_hash)
  VALUES (p_fingerprint_hash)
  ON CONFLICT (fingerprint_hash) DO UPDATE SET
    attempts = CASE
      WHEN public.team_access_rate_limits.window_started_at < now() - interval '5 minutes'
        THEN 1
      ELSE public.team_access_rate_limits.attempts + 1
    END,
    window_started_at = CASE
      WHEN public.team_access_rate_limits.window_started_at < now() - interval '5 minutes'
        THEN now()
      ELSE public.team_access_rate_limits.window_started_at
    END,
    blocked_until = CASE
      WHEN public.team_access_rate_limits.window_started_at >= now() - interval '5 minutes'
        AND public.team_access_rate_limits.attempts >= 29
        THEN now() + interval '15 minutes'
      ELSE public.team_access_rate_limits.blocked_until
    END,
    updated_at = now()
  RETURNING * INTO v_rate;

  IF v_rate.blocked_until IS NOT NULL AND v_rate.blocked_until > now() THEN
    INSERT INTO public.team_access_security_events(event_type, fingerprint_hash)
    VALUES ('rate_limited', p_fingerprint_hash);
    RETURN QUERY SELECT
      'rate_limited'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  SELECT * INTO v
  FROM public.team_edit_links
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.team_access_security_events(event_type, fingerprint_hash)
    VALUES ('invalid_token', p_fingerprint_hash);
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  SELECT * INTO v_championship
  FROM public.championships
  WHERE id = v.championship_id AND organization_id = v.organization_id;

  SELECT * INTO v_team
  FROM public.teams
  WHERE id = v.team_id AND organization_id = v.organization_id;

  SELECT * INTO v_participation
  FROM public.championship_teams
  WHERE id = v.championship_team_id
    AND championship_id = v.championship_id
    AND team_id = v.team_id
    AND organization_id = v.organization_id;

  IF v_championship.id IS NULL OR v_team.id IS NULL OR v_participation.id IS NULL THEN
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  SELECT * INTO v_session
  FROM public.team_edit_link_sessions
  WHERE session_hash = p_session_hash
  FOR UPDATE;

  IF v_session.id IS NOT NULL AND v_session.link_id <> v.id THEN
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  access_state := CASE
    WHEN v.status = 'blocked' THEN 'blocked'
    WHEN v.status = 'revoked' THEN 'revoked'
    WHEN v.status = 'replaced' THEN 'replaced'
    WHEN v.expires_at <= now() THEN 'expired'
    WHEN v.max_access_count IS NOT NULL
      AND v.access_count >= v.max_access_count
      AND (v_session.id IS NULL OR v_session.expires_at <= now())
      THEN 'access_limit'
    WHEN v_championship.status IN ('suspended', 'archived')
      OR v_participation.archived_at IS NOT NULL
      OR v_team.status = 'archived'
      THEN 'unavailable'
    ELSE 'valid'
  END;

  IF access_state <> 'valid' THEN
    v_event := CASE access_state
      WHEN 'blocked' THEN 'blocked_attempt'
      WHEN 'revoked' THEN 'revoked_attempt'
      WHEN 'replaced' THEN 'replaced_attempt'
      WHEN 'expired' THEN 'expired_attempt'
      WHEN 'access_limit' THEN 'access_limit_attempt'
      ELSE 'unavailable_attempt'
    END;
    INSERT INTO public.team_edit_link_events(
      organization_id, championship_id, team_id, link_id, event_type, context
    )
    VALUES (
      v.organization_id, v.championship_id, v.team_id, v.id, v_event,
      jsonb_build_object('source', 'public_exchange')
    );
    RETURN QUERY SELECT
      access_state, NULL::timestamptz, v_championship.name,
      v_championship.logo_url, v_team.name, v_team.crest_url,
      v.expires_at, v.permissions;
    RETURN;
  END IF;

  v_session_expires := least(now() + interval '15 minutes', v.expires_at);

  IF v_session.id IS NULL THEN
    INSERT INTO public.team_edit_link_sessions(link_id, session_hash, expires_at)
    VALUES (v.id, p_session_hash, v_session_expires);
    v_count_access := true;
  ELSIF v_session.expires_at <= now() THEN
    UPDATE public.team_edit_link_sessions
    SET created_at = now(), expires_at = v_session_expires, last_seen_at = now()
    WHERE id = v_session.id;
    v_count_access := true;
  ELSE
    v_session_expires := v_session.expires_at;
    UPDATE public.team_edit_link_sessions
    SET last_seen_at = now()
    WHERE id = v_session.id;
  END IF;

  IF v_count_access THEN
    UPDATE public.team_edit_links
    SET last_accessed_at = now(), access_count = access_count + 1
    WHERE id = v.id
    RETURNING * INTO v;

    INSERT INTO public.team_edit_link_events(
      organization_id, championship_id, team_id, link_id, event_type, context
    )
    VALUES (
      v.organization_id, v.championship_id, v.team_id, v.id, 'valid_access',
      jsonb_build_object('session_created', true)
    );
  END IF;

  RETURN QUERY SELECT
    'valid'::text, v_session_expires, v_championship.name,
    v_championship.logo_url, v_team.name, v_team.crest_url,
    v.expires_at, v.permissions;
END
$$;

CREATE OR REPLACE FUNCTION public.get_team_edit_session(p_session_hash text)
RETURNS TABLE(
  access_state text, session_expires_at timestamptz, championship_name text,
  championship_logo_url text, team_name text, team_crest_url text,
  link_expires_at timestamptz, effective_permissions jsonb
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_session public.team_edit_link_sessions%ROWTYPE;
  v public.team_edit_links%ROWTYPE;
  c public.championships%ROWTYPE;
  t public.teams%ROWTYPE;
  ct public.championship_teams%ROWTYPE;
  v_state text;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  SELECT * INTO v_session
  FROM public.team_edit_link_sessions
  WHERE session_hash = p_session_hash AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  SELECT * INTO v FROM public.team_edit_links WHERE id = v_session.link_id;
  SELECT * INTO c FROM public.championships
    WHERE id = v.championship_id AND organization_id = v.organization_id;
  SELECT * INTO t FROM public.teams
    WHERE id = v.team_id AND organization_id = v.organization_id;
  SELECT * INTO ct FROM public.championship_teams
    WHERE id = v.championship_team_id
      AND championship_id = v.championship_id
      AND team_id = v.team_id
      AND organization_id = v.organization_id;

  IF v.id IS NULL OR c.id IS NULL OR t.id IS NULL OR ct.id IS NULL THEN
    DELETE FROM public.team_edit_link_sessions WHERE id = v_session.id;
    RETURN QUERY SELECT
      'invalid'::text, NULL::timestamptz, NULL::text, NULL::text,
      NULL::text, NULL::text, NULL::timestamptz, NULL::jsonb;
    RETURN;
  END IF;

  v_state := CASE
    WHEN v.status = 'blocked' THEN 'blocked'
    WHEN v.status = 'revoked' THEN 'revoked'
    WHEN v.status = 'replaced' THEN 'replaced'
    WHEN v.expires_at <= now() THEN 'expired'
    WHEN c.status IN ('suspended', 'archived')
      OR ct.archived_at IS NOT NULL
      OR t.status = 'archived'
      THEN 'unavailable'
    ELSE 'valid'
  END;

  IF v_state <> 'valid' THEN
    DELETE FROM public.team_edit_link_sessions WHERE id = v_session.id;
  ELSE
    UPDATE public.team_edit_link_sessions
    SET last_seen_at = now()
    WHERE id = v_session.id;
  END IF;

  RETURN QUERY SELECT
    v_state, v_session.expires_at, c.name, c.logo_url, t.name,
    t.crest_url, v.expires_at, v.permissions;
END
$$;
