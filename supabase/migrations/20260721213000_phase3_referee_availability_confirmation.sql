-- Phase 3 continuation: referee unavailability and assignment confirmation workflow.

ALTER TABLE public.referee_assignments
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS responded_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS response_note text;

CREATE INDEX IF NOT EXISTS referee_unavailability_window_idx
  ON public.referee_unavailability(referee_id,starts_at,ends_at);

CREATE OR REPLACE FUNCTION public.save_referee_unavailability(
  p_championship_id uuid,p_unavailability_id uuid,p_referee_id uuid,
  p_starts_at timestamptz,p_ends_at timestamptz,p_reason text DEFAULT NULL
) RETURNS public.referee_unavailability
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.referee_unavailability%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at<=p_starts_at THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_unavailability_window';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.referees WHERE id=p_referee_id AND organization_id=target_org) THEN
    RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:referee_not_found';
  END IF;
  IF EXISTS(
    SELECT 1 FROM public.referee_assignments ra JOIN public.matches m ON m.id=ra.match_id
    WHERE ra.referee_id=p_referee_id AND ra.confirmation_status IN ('pending','confirmed')
      AND m.scheduled_at IS NOT NULL AND p_starts_at<m.scheduled_at+interval '2 hours' AND p_ends_at>m.scheduled_at
  ) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='sports:unavailability_assignment_conflict'; END IF;
  IF p_unavailability_id IS NULL THEN
    INSERT INTO public.referee_unavailability(organization_id,referee_id,starts_at,ends_at,reason,created_by)
    VALUES(target_org,p_referee_id,p_starts_at,p_ends_at,nullif(trim(p_reason),''),auth.uid()) RETURNING * INTO result;
  ELSE
    UPDATE public.referee_unavailability SET referee_id=p_referee_id,starts_at=p_starts_at,ends_at=p_ends_at,reason=nullif(trim(p_reason),'')
    WHERE id=p_unavailability_id AND organization_id=target_org RETURNING * INTO result;
  END IF;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:unavailability_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data)
  VALUES(target_org,auth.uid(),'referee_unavailability',result.id,CASE WHEN p_unavailability_id IS NULL THEN 'created' ELSE 'updated' END,to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.delete_referee_unavailability(
  p_championship_id uuid,p_unavailability_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; previous public.referee_unavailability%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  DELETE FROM public.referee_unavailability WHERE id=p_unavailability_id AND organization_id=target_org RETURNING * INTO previous;
  IF previous.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:unavailability_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data)
  VALUES(target_org,auth.uid(),'referee_unavailability',previous.id,'deleted',to_jsonb(previous));
END $$;

CREATE OR REPLACE FUNCTION public.set_referee_assignment_status(
  p_championship_id uuid,p_assignment_id uuid,p_status text,p_note text DEFAULT NULL
) RETURNS public.referee_assignments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; current_row public.referee_assignments%ROWTYPE; target_match public.matches%ROWTYPE; result public.referee_assignments%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO current_row FROM public.referee_assignments WHERE id=p_assignment_id AND championship_id=p_championship_id FOR UPDATE;
  IF current_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:assignment_not_found'; END IF;
  IF p_status NOT IN ('pending','confirmed','declined','cancelled') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_assignment_status'; END IF;
  IF p_status IN ('declined','cancelled') AND nullif(trim(p_note),'') IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:assignment_note_required';
  END IF;
  SELECT * INTO target_match FROM public.matches WHERE id=current_row.match_id;
  IF p_status='confirmed' THEN
    IF target_match.scheduled_at IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:match_schedule_required'; END IF;
    IF EXISTS(
      SELECT 1 FROM public.referee_unavailability u WHERE u.referee_id=current_row.referee_id
        AND target_match.scheduled_at<u.ends_at AND target_match.scheduled_at+interval '2 hours'>u.starts_at
    ) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='sports:referee_unavailable'; END IF;
    IF EXISTS(
      SELECT 1 FROM public.referee_assignments ra JOIN public.matches m ON m.id=ra.match_id
      WHERE ra.referee_id=current_row.referee_id AND ra.id<>current_row.id AND ra.confirmation_status='confirmed'
        AND m.scheduled_at IS NOT NULL AND target_match.scheduled_at<m.scheduled_at+interval '2 hours'
        AND target_match.scheduled_at+interval '2 hours'>m.scheduled_at
    ) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='sports:referee_schedule_conflict'; END IF;
  END IF;
  UPDATE public.referee_assignments SET confirmation_status=p_status,
    confirmed_at=CASE WHEN p_status='confirmed' THEN now() ELSE NULL END,
    responded_at=CASE WHEN p_status='pending' THEN NULL ELSE now() END,
    responded_by=CASE WHEN p_status='pending' THEN NULL ELSE auth.uid() END,
    response_note=nullif(trim(p_note),''),updated_at=now(),updated_by=auth.uid()
  WHERE id=current_row.id RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data,new_data,context)
  VALUES(target_org,auth.uid(),'referee_assignment',result.id,'status_changed',to_jsonb(current_row),to_jsonb(result),jsonb_build_object('status',p_status,'note',p_note));
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.save_referee_unavailability(uuid,uuid,uuid,timestamptz,timestamptz,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.delete_referee_unavailability(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.set_referee_assignment_status(uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_referee_unavailability(uuid,uuid,uuid,timestamptz,timestamptz,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_referee_unavailability(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_referee_assignment_status(uuid,uuid,text,text) TO authenticated;
