-- Fase 1: partidas, sumulas, placar e classificacao atomicos.
-- Migration aditiva e idempotente para reconciliar o schema local com o remoto.

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS stage_id uuid;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS occurred_at timestamptz;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS score_home_after integer;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS score_away_after integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_distinct_teams_check') THEN
    ALTER TABLE public.matches ADD CONSTRAINT matches_distinct_teams_check
      CHECK (home_team_id IS NULL OR away_team_id IS NULL OR home_team_id <> away_team_id) NOT VALID;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS match_events_client_request_unique
  ON public.match_events (match_id, ((metadata ->> 'client_request_id')))
  WHERE metadata ? 'client_request_id';
CREATE INDEX IF NOT EXISTS matches_championship_schedule_idx
  ON public.matches (championship_id, scheduled_at);
CREATE INDEX IF NOT EXISTS match_events_match_active_idx
  ON public.match_events (match_id, created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  goals_for integer NOT NULL DEFAULT 0,
  goals_against integer NOT NULL DEFAULT 0,
  goal_difference integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  points_adjustment integer NOT NULL DEFAULT 0,
  disciplinary_points integer NOT NULL DEFAULT 0,
  form text[] NOT NULL DEFAULT '{}',
  stage_id uuid,
  group_id uuid,
  category_id uuid,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS standings_championship_team_base_unique
  ON public.standings (championship_id, team_id)
  WHERE stage_id IS NULL AND group_id IS NULL AND category_id IS NULL;
CREATE INDEX IF NOT EXISTS standings_championship_position_idx
  ON public.standings (championship_id, position);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_match_idx
  ON public.audit_logs (organization_id, entity_type, entity_id, created_at DESC);

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS standings_member_select ON public.standings;
CREATE POLICY standings_member_select ON public.standings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
CREATE POLICY audit_logs_admin_select ON public.audit_logs FOR SELECT TO authenticated
  USING (public.can_administer_org(organization_id));

GRANT SELECT ON public.standings TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.matches FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.match_events FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.standings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

CREATE OR REPLACE FUNCTION public.phase1_assert_editor(p_organization_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'match:authentication_required';
  END IF;
  IF NOT public.can_edit_org(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'match:forbidden';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.phase1_team_in_championship(
  p_organization_id uuid, p_championship_id uuid, p_team_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
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
      AND COALESCE(ct.status, 'active') NOT IN ('archived', 'rejected')
  );
$$;

CREATE OR REPLACE FUNCTION public.recalculate_match_score(p_match_id uuid)
RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.matches%ROWTYPE;
  new_home integer;
  new_away integer;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'match:not_found';
  END IF;

  SELECT
    count(*) FILTER (WHERE (e.type::text IN ('goal', 'penalty_goal') AND e.team_id = target.home_team_id)
                           OR (e.type::text = 'own_goal' AND e.team_id = target.away_team_id)),
    count(*) FILTER (WHERE (e.type::text IN ('goal', 'penalty_goal') AND e.team_id = target.away_team_id)
                           OR (e.type::text = 'own_goal' AND e.team_id = target.home_team_id))
  INTO new_home, new_away
  FROM public.match_events e
  WHERE e.match_id = target.id AND e.deleted_at IS NULL;

  UPDATE public.matches
  SET home_score = COALESCE(new_home, 0), away_score = COALESCE(new_away, 0), updated_at = now()
  WHERE id = target.id
  RETURNING * INTO target;
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_standings(
  p_championship_id uuid,
  p_stage_id uuid DEFAULT NULL,
  p_group_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_org uuid;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id = p_championship_id;
  IF target_org IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship:not_found';
  END IF;

  DELETE FROM public.standings s
  WHERE s.championship_id = p_championship_id
    AND s.stage_id IS NOT DISTINCT FROM p_stage_id
    AND s.group_id IS NOT DISTINCT FROM p_group_id
    AND s.category_id IS NOT DISTINCT FROM p_category_id;

  WITH eligible_teams AS (
    SELECT t.id, t.organization_id FROM public.teams t
    WHERE t.organization_id = target_org AND t.championship_id = p_championship_id
    UNION
    SELECT t.id, t.organization_id
    FROM public.championship_teams ct
    JOIN public.teams t ON t.id = ct.team_id AND t.organization_id = ct.organization_id
    WHERE ct.organization_id = target_org AND ct.championship_id = p_championship_id
      AND COALESCE(ct.status, 'active') NOT IN ('archived', 'rejected')
  ), match_rows AS (
    SELECT m.home_team_id team_id, 1 played,
      (m.home_score > m.away_score)::int wins, (m.home_score = m.away_score)::int draws,
      (m.home_score < m.away_score)::int losses, COALESCE(m.home_score,0) goals_for,
      COALESCE(m.away_score,0) goals_against,
      CASE WHEN m.home_score > m.away_score THEN 3 WHEN m.home_score = m.away_score THEN 1 ELSE 0 END points
    FROM public.matches m WHERE m.championship_id = p_championship_id AND m.organization_id = target_org
      AND m.status::text = 'finished' AND m.home_team_id IS NOT NULL AND m.away_team_id IS NOT NULL
      AND m.stage_id IS NOT DISTINCT FROM p_stage_id AND m.group_id IS NOT DISTINCT FROM p_group_id
      AND m.category_id IS NOT DISTINCT FROM p_category_id
    UNION ALL
    SELECT m.away_team_id, 1, (m.away_score > m.home_score)::int, (m.away_score = m.home_score)::int,
      (m.away_score < m.home_score)::int, COALESCE(m.away_score,0), COALESCE(m.home_score,0),
      CASE WHEN m.away_score > m.home_score THEN 3 WHEN m.away_score = m.home_score THEN 1 ELSE 0 END
    FROM public.matches m WHERE m.championship_id = p_championship_id AND m.organization_id = target_org
      AND m.status::text = 'finished' AND m.home_team_id IS NOT NULL AND m.away_team_id IS NOT NULL
      AND m.stage_id IS NOT DISTINCT FROM p_stage_id AND m.group_id IS NOT DISTINCT FROM p_group_id
      AND m.category_id IS NOT DISTINCT FROM p_category_id
  ), totals AS (
    SELECT e.id team_id, COALESCE(sum(r.played),0)::int played, COALESCE(sum(r.wins),0)::int wins,
      COALESCE(sum(r.draws),0)::int draws, COALESCE(sum(r.losses),0)::int losses,
      COALESCE(sum(r.goals_for),0)::int goals_for, COALESCE(sum(r.goals_against),0)::int goals_against,
      COALESCE(sum(r.points),0)::int points
    FROM eligible_teams e LEFT JOIN match_rows r ON r.team_id = e.id GROUP BY e.id
  ), ranked AS (
    SELECT *, row_number() OVER (ORDER BY points DESC, (goals_for-goals_against) DESC, goals_for DESC, team_id)::int position
    FROM totals
  )
  INSERT INTO public.standings (
    organization_id, championship_id, team_id, position, played, wins, draws, losses,
    goals_for, goals_against, goal_difference, points, stage_id, group_id, category_id,
    calculated_at, updated_at
  ) SELECT target_org, p_championship_id, team_id, position, played, wins, draws, losses,
      goals_for, goals_against, goals_for-goals_against, points, p_stage_id, p_group_id, p_category_id,
      now(), now() FROM ranked;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_championship_match(
  p_championship_id uuid, p_home_team_id uuid, p_away_team_id uuid,
  p_scheduled_at timestamptz DEFAULT NULL, p_venue text DEFAULT NULL,
  p_phase text DEFAULT NULL, p_round text DEFAULT NULL
) RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE target_org uuid; created public.matches%ROWTYPE;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id = p_championship_id;
  IF target_org IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='championship:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target_org);
  IF p_home_team_id = p_away_team_id THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='match:teams_must_differ'; END IF;
  IF NOT public.phase1_team_in_championship(target_org,p_championship_id,p_home_team_id)
     OR NOT public.phase1_team_in_championship(target_org,p_championship_id,p_away_team_id) THEN
    RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='match:team_outside_championship';
  END IF;
  INSERT INTO public.matches (organization_id,championship_id,home_team_id,away_team_id,scheduled_at,venue,phase,round,status,home_score,away_score,created_by,updated_by)
  VALUES (target_org,p_championship_id,p_home_team_id,p_away_team_id,p_scheduled_at,NULLIF(trim(p_venue),''),NULLIF(trim(p_phase),''),NULLIF(trim(p_round),''),'scheduled',0,0,auth.uid(),auth.uid())
  RETURNING * INTO created;
  RETURN created;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_championship_match(
  p_championship_id uuid, p_match_id uuid, p_scheduled_at timestamptz,
  p_venue text, p_phase text, p_round text
) RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE target public.matches%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target.organization_id);
  IF target.status::text NOT IN ('scheduled','preparing','postponed') THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:cannot_reschedule_in_status'; END IF;
  UPDATE public.matches SET scheduled_at=p_scheduled_at,venue=NULLIF(trim(p_venue),''),phase=NULLIF(trim(p_phase),''),round=NULLIF(trim(p_round),''),updated_by=auth.uid(),updated_at=now()
  WHERE id=target.id RETURNING * INTO target;
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_championship_match_status(
  p_championship_id uuid, p_match_id uuid, p_status text, p_reason text DEFAULT NULL
) RETURNS public.matches
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE target public.matches%ROWTYPE; old_status text;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target.organization_id);
  old_status := target.status::text;
  IF NOT ((old_status IN ('scheduled','preparing') AND p_status IN ('live','postponed','cancelled'))
       OR (old_status='postponed' AND p_status IN ('scheduled','cancelled'))
       OR (old_status='live' AND p_status IN ('finished','postponed','cancelled'))
       OR (old_status='finished' AND p_status='live' AND public.can_administer_org(target.organization_id))) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:invalid_status_transition';
  END IF;
  IF p_status IN ('postponed','cancelled') AND NULLIF(trim(p_reason),'') IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='match:reason_required';
  END IF;
  UPDATE public.matches SET status=p_status::public.match_status,
    started_at=CASE WHEN p_status='live' AND old_status<>'finished' THEN COALESCE(started_at,now()) ELSE started_at END,
    ended_at=CASE WHEN p_status='finished' THEN now() WHEN old_status='finished' THEN NULL ELSE ended_at END,
    metadata=metadata || CASE WHEN p_reason IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('status_reason',trim(p_reason)) END,
    updated_by=auth.uid(),updated_at=now() WHERE id=target.id RETURNING * INTO target;
  INSERT INTO public.audit_logs (organization_id,user_id,entity_type,entity_id,action,old_data,new_data,context)
  VALUES (target.organization_id,auth.uid(),'match',target.id,CASE WHEN old_status='finished' THEN 'reopened' ELSE 'status_changed' END,
    jsonb_build_object('status',old_status),jsonb_build_object('status',p_status),jsonb_build_object('reason',p_reason));
  IF p_status='finished' OR old_status='finished' THEN PERFORM public.recalculate_standings(p_championship_id); END IF;
  RETURN target;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_championship_match(p_championship_id uuid,p_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE target public.matches%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target.organization_id);
  IF target.status::text NOT IN ('scheduled','preparing','postponed','cancelled') OR EXISTS (SELECT 1 FROM public.match_events WHERE match_id=target.id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:cannot_delete';
  END IF;
  DELETE FROM public.matches WHERE id=target.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_match_event(
  p_championship_id uuid,p_match_id uuid,p_client_request_id uuid,p_team_id uuid,
  p_athlete_id uuid,p_type public.event_type,p_minute integer DEFAULT NULL,
  p_period text DEFAULT NULL,p_note text DEFAULT NULL
) RETURNS public.match_events
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE target public.matches%ROWTYPE; existing public.match_events%ROWTYPE; created public.match_events%ROWTYPE; athlete_ok boolean;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target.organization_id);
  SELECT * INTO existing FROM public.match_events WHERE match_id=target.id AND metadata->>'client_request_id'=p_client_request_id::text;
  IF FOUND THEN RETURN existing; END IF;
  IF target.status::text <> 'live' THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:event_requires_live'; END IF;
  IF p_team_id IS NOT NULL AND p_team_id NOT IN (target.home_team_id,target.away_team_id) THEN RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='match:event_team_invalid'; END IF;
  IF p_minute IS NOT NULL AND (p_minute < 0 OR p_minute > 200) THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='match:event_minute_invalid'; END IF;
  IF p_athlete_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM public.athletes a WHERE a.id=p_athlete_id AND a.organization_id=target.organization_id AND a.team_id=p_team_id)
      OR EXISTS (SELECT 1 FROM public.championship_team_athletes ca WHERE ca.athlete_id=p_athlete_id AND ca.team_id=p_team_id AND ca.championship_id=p_championship_id AND ca.organization_id=target.organization_id AND ca.active AND ca.registration_status IN ('registered','approved'))
    INTO athlete_ok;
    IF NOT athlete_ok THEN RAISE EXCEPTION USING ERRCODE='23503', MESSAGE='match:event_athlete_invalid'; END IF;
  END IF;
  INSERT INTO public.match_events (organization_id,match_id,team_id,athlete_id,type,minute,period,note,metadata,occurred_at,created_by,updated_by)
  VALUES (target.organization_id,target.id,p_team_id,p_athlete_id,p_type,p_minute,NULLIF(trim(p_period),''),NULLIF(trim(p_note),''),jsonb_build_object('client_request_id',p_client_request_id),now(),auth.uid(),auth.uid())
  RETURNING * INTO created;
  IF p_type::text IN ('goal','penalty_goal','own_goal') THEN
    target := public.recalculate_match_score(target.id);
    UPDATE public.match_events SET score_home_after=target.home_score,score_away_after=target.away_score WHERE id=created.id RETURNING * INTO created;
  END IF;
  RETURN created;
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO created FROM public.match_events WHERE match_id=p_match_id AND metadata->>'client_request_id'=p_client_request_id::text;
  RETURN created;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_match_event(p_championship_id uuid,p_match_id uuid,p_event_id uuid,p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE target public.matches%ROWTYPE; event_row public.match_events%ROWTYPE;
BEGIN
  SELECT * INTO target FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:not_found'; END IF;
  PERFORM public.phase1_assert_editor(target.organization_id);
  IF target.status::text <> 'live' THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='match:event_requires_live'; END IF;
  SELECT * INTO event_row FROM public.match_events WHERE id=p_event_id AND match_id=target.id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='match:event_not_found'; END IF;
  UPDATE public.match_events SET deleted_at=now(),updated_at=now(),updated_by=auth.uid(),metadata=metadata || jsonb_build_object('deletion_reason',p_reason) WHERE id=event_row.id;
  IF event_row.type::text IN ('goal','penalty_goal','own_goal') THEN PERFORM public.recalculate_match_score(target.id); END IF;
  INSERT INTO public.audit_logs (organization_id,user_id,entity_type,entity_id,action,old_data,context)
  VALUES (target.organization_id,auth.uid(),'match_event',event_row.id,'removed',to_jsonb(event_row),jsonb_build_object('reason',p_reason,'match_id',target.id));
END;
$$;

REVOKE ALL ON FUNCTION public.phase1_assert_editor(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.phase1_team_in_championship(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.recalculate_match_score(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.recalculate_standings(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_championship_match(uuid,uuid,uuid,timestamptz,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.update_championship_match(uuid,uuid,timestamptz,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.set_championship_match_status(uuid,uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.delete_championship_match(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.record_match_event(uuid,uuid,uuid,uuid,uuid,public.event_type,integer,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.remove_match_event(uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_championship_match(uuid,uuid,uuid,timestamptz,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_championship_match(uuid,uuid,timestamptz,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_championship_match_status(uuid,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_championship_match(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_match_event(uuid,uuid,uuid,uuid,uuid,public.event_type,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_match_event(uuid,uuid,uuid,text) TO authenticated;
