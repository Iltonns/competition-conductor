-- Remove the last column/variable ambiguity reported by plpgsql_check.

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
  selected_staff_id uuid;
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
  FOREACH selected_staff_id IN ARRAY COALESCE(p_staff_ids,'{}'::uuid[]) LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM public.team_staff ts
      JOIN public.championship_team_staff cts ON cts.staff_id=ts.id AND cts.active
      JOIN public.championship_teams ct ON ct.id=cts.championship_team_id
      WHERE ts.id=selected_staff_id AND ts.team_id=p_team_id AND ts.organization_id=target.organization_id
        AND ts.archived_at IS NULL AND ts.status='active'
        AND ct.championship_id=p_championship_id AND ct.team_id=p_team_id
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:staff_ineligible';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.sanctions s
      WHERE s.championship_id=p_championship_id AND s.team_staff_id=selected_staff_id
        AND s.status='active' AND s.revoked_at IS NULL
        AND (s.ends_at IS NULL OR s.ends_at>=COALESCE(target.scheduled_at,now()))
    ) THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:staff_suspended';
    END IF;
    INSERT INTO public.match_staff(
      organization_id,match_id,team_id,team_staff_id,role,created_by,updated_by
    )
    SELECT target.organization_id,p_match_id,p_team_id,ts.id,COALESCE(NULLIF(ts.custom_role,''),ts.role),auth.uid(),auth.uid()
    FROM public.team_staff ts WHERE ts.id=selected_staff_id;
  END LOOP;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data)
  VALUES(target.organization_id,auth.uid(),'match_staff',p_match_id,'saved',jsonb_build_object('team_id',p_team_id,'staff_ids',p_staff_ids));
  RETURN QUERY SELECT ms.* FROM public.match_staff ms
    WHERE ms.match_id=p_match_id AND ms.team_id=p_team_id ORDER BY ms.role;
END $$;
