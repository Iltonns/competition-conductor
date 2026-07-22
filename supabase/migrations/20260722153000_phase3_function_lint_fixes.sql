-- Fix runtime errors found by plpgsql_check after the Phase 3 completion rollout.

CREATE OR REPLACE FUNCTION public.save_match_lineup(p_championship_id uuid,p_match_id uuid,p_team_id uuid,p_entries jsonb)
RETURNS SETOF public.lineups LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; entry jsonb; athlete uuid; role text; athlete_count int; goalkeeper_count int; captain_count int; settings_row public.championship_settings%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF p_team_id IS DISTINCT FROM target.home_team_id AND p_team_id IS DISTINCT FROM target.away_team_id THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:team_not_in_match'; END IF;
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated')
     OR (target.status::text IN ('live','finished','confirmed') AND NOT EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='reopened')) THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:lineup_locked';
  END IF;
  IF jsonb_typeof(p_entries)<>'array' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_lineup'; END IF;
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  SELECT count(*),count(*) FILTER(WHERE COALESCE((value->>'is_captain')::boolean,false)) INTO athlete_count,captain_count FROM jsonb_array_elements(p_entries);
  SELECT count(*) INTO goalkeeper_count
  FROM jsonb_array_elements(p_entries) AS lineup_item(value)
  JOIN public.championship_team_athletes cta
    ON cta.athlete_id=(lineup_item.value->>'athlete_id')::uuid
   AND cta.championship_id=p_championship_id
  WHERE cta.is_goalkeeper;
  IF settings_row.min_athletes_per_team IS NOT NULL AND athlete_count<settings_row.min_athletes_per_team THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:lineup_minimum_not_met'; END IF;
  IF settings_row.max_athletes_per_team IS NOT NULL AND athlete_count>settings_row.max_athletes_per_team THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:lineup_limit_exceeded'; END IF;
  IF settings_row.max_goalkeepers_per_team IS NOT NULL AND goalkeeper_count>settings_row.max_goalkeepers_per_team THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:goalkeeper_limit_exceeded'; END IF;
  IF captain_count>1 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:multiple_captains'; END IF;
  DELETE FROM public.lineups WHERE match_id=p_match_id AND team_id=p_team_id;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_entries) LOOP
    athlete:=(entry->>'athlete_id')::uuid; role:=COALESCE(entry->>'role','substitute');
    IF role NOT IN ('starter','substitute') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_lineup_role'; END IF;
    IF NOT EXISTS(
      SELECT 1 FROM public.championship_team_athletes cta JOIN public.championship_teams ct ON ct.id=cta.championship_team_id
      JOIN public.athletes a ON a.id=cta.athlete_id
      WHERE cta.championship_id=p_championship_id AND ct.team_id=p_team_id AND cta.athlete_id=athlete AND cta.active
        AND cta.registration_status IN ('registered','approved') AND a.archived_at IS NULL AND a.status<>'archived'
    ) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:athlete_ineligible'; END IF;
    IF EXISTS(SELECT 1 FROM public.sanctions s WHERE s.championship_id=p_championship_id AND s.athlete_id=athlete AND s.status='active' AND s.revoked_at IS NULL AND (s.ends_at IS NULL OR s.ends_at>=COALESCE(target.scheduled_at,now()))) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:athlete_suspended';
    END IF;
    INSERT INTO public.lineups(organization_id,match_id,team_id,athlete_id,lineup_role,is_captain,jersey_number,position,status,created_by,updated_by)
    SELECT target.organization_id,p_match_id,p_team_id,a.id,role,COALESCE((entry->>'is_captain')::boolean,false),COALESCE((entry->>'jersey_number')::int,a.jersey_number),COALESCE(entry->>'position',a.position),'active',auth.uid(),auth.uid() FROM public.athletes a WHERE a.id=athlete;
  END LOOP;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'match_lineup',p_match_id,'saved',jsonb_build_object('team_id',p_team_id,'entries',p_entries));
  RETURN QUERY SELECT * FROM public.lineups WHERE match_id=p_match_id AND team_id=p_team_id ORDER BY lineup_role,jersey_number NULLS LAST;
END $$;

CREATE OR REPLACE FUNCTION public.save_match_staff(
  p_championship_id uuid,
  p_match_id uuid,
  p_team_id uuid,
  p_staff_ids uuid[]
)
RETURNS SETOF public.match_staff
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  target public.matches%ROWTYPE;
  staff_id uuid;
  staff_count integer;
  settings_row public.championship_settings%ROWTYPE;
BEGIN
  target := public.phase3_match_context(p_championship_id,p_match_id);
  IF p_team_id IS DISTINCT FROM target.home_team_id AND p_team_id IS DISTINCT FROM target.away_team_id THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:team_not_in_match';
  END IF;
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated')
     OR (target.status::text IN ('live','finished','confirmed') AND NOT EXISTS(
       SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='reopened'
     )) THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:lineup_locked';
  END IF;
  IF cardinality(COALESCE(p_staff_ids,'{}'::uuid[])) <> cardinality(ARRAY(
    SELECT DISTINCT value FROM unnest(COALESCE(p_staff_ids,'{}'::uuid[])) value
  )) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:duplicate_staff';
  END IF;
  staff_count := cardinality(COALESCE(p_staff_ids,'{}'::uuid[]));
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  IF settings_row.max_staff_per_team IS NOT NULL AND staff_count > settings_row.max_staff_per_team THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:staff_limit_exceeded';
  END IF;

  DELETE FROM public.match_staff WHERE match_id=p_match_id AND team_id=p_team_id;
  FOREACH staff_id IN ARRAY COALESCE(p_staff_ids,'{}'::uuid[]) LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.team_staff ts
      JOIN public.championship_team_staff cts ON cts.staff_id=ts.id AND cts.active
      JOIN public.championship_teams ct ON ct.id=cts.championship_team_id
      WHERE ts.id=staff_id AND ts.team_id=p_team_id AND ts.organization_id=target.organization_id
        AND ts.archived_at IS NULL AND ts.status='active'
        AND ct.championship_id=p_championship_id AND ct.team_id=p_team_id
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:staff_ineligible';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.sanctions s
      WHERE s.championship_id=p_championship_id AND s.team_staff_id=staff_id
        AND s.status='active' AND s.revoked_at IS NULL
        AND (s.ends_at IS NULL OR s.ends_at>=COALESCE(target.scheduled_at,now()))
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:staff_suspended';
    END IF;
    INSERT INTO public.match_staff(
      organization_id,match_id,team_id,team_staff_id,role,created_by,updated_by
    )
    SELECT target.organization_id,p_match_id,p_team_id,ts.id,COALESCE(NULLIF(ts.custom_role,''),ts.role),auth.uid(),auth.uid()
    FROM public.team_staff ts WHERE ts.id=staff_id;
  END LOOP;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data)
  VALUES(target.organization_id,auth.uid(),'match_staff',p_match_id,'saved',jsonb_build_object('team_id',p_team_id,'staff_ids',p_staff_ids));
  RETURN QUERY SELECT ms.* FROM public.match_staff ms
    WHERE ms.match_id=p_match_id AND ms.team_id=p_team_id ORDER BY ms.role;
END $$;
