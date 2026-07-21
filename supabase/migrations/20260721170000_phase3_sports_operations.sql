-- Phase 3: official match operation, lineups, reports, referees and sanctions.

CREATE TABLE IF NOT EXISTS public.match_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','homologated','reopened')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  regular_home_score integer CHECK (regular_home_score >= 0),
  regular_away_score integer CHECK (regular_away_score >= 0),
  extra_home_score integer CHECK (extra_home_score >= 0),
  extra_away_score integer CHECK (extra_away_score >= 0),
  penalty_home_score integer CHECK (penalty_home_score >= 0),
  penalty_away_score integer CHECK (penalty_away_score >= 0),
  first_half_added_minutes integer NOT NULL DEFAULT 0 CHECK (first_half_added_minutes >= 0),
  second_half_added_minutes integer NOT NULL DEFAULT 0 CHECK (second_half_added_minutes >= 0),
  notes text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
  homologated_at timestamptz,
  homologated_by uuid REFERENCES auth.users(id),
  reopened_at timestamptz,
  reopened_by uuid REFERENCES auth.users(id),
  reopen_reason text,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(match_id)
);

CREATE TABLE IF NOT EXISTS public.referee_unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES public.referees(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CHECK (ends_at > starts_at)
);

ALTER TABLE public.sanctions
  ADD COLUMN IF NOT EXISTS team_staff_id uuid REFERENCES public.team_staff(id),
  ADD COLUMN IF NOT EXISTS source_event_id uuid REFERENCES public.match_events(id),
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS revocation_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS lineups_match_athlete_unique ON public.lineups(match_id,athlete_id);
CREATE UNIQUE INDEX IF NOT EXISTS lineups_match_team_captain_unique ON public.lineups(match_id,team_id) WHERE is_captain AND status='active';
CREATE UNIQUE INDEX IF NOT EXISTS sanctions_source_event_unique ON public.sanctions(source_event_id) WHERE source_event_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS referee_assignment_match_role_unique ON public.referee_assignments(match_id,assignment_role);
CREATE INDEX IF NOT EXISTS referee_assignment_referee_match_idx ON public.referee_assignments(referee_id,match_id);
CREATE INDEX IF NOT EXISTS sanctions_active_athlete_idx ON public.sanctions(championship_id,athlete_id) WHERE status='active';

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['match_reports','referee_unavailability','lineups','substitutions','referees','referee_assignments','sanctions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',table_name || '_member_select',table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))',table_name || '_member_select',table_name);
    EXECUTE format('REVOKE INSERT,UPDATE,DELETE ON public.%I FROM authenticated',table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon',table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.phase3_match_context(p_championship_id uuid,p_match_id uuid)
RETURNS public.matches LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public.matches%ROWTYPE;
BEGIN
  SELECT * INTO result FROM public.matches WHERE id=p_match_id AND championship_id=p_championship_id;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:match_not_found'; END IF;
  IF NOT public.can_administer_org(result.organization_id) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='sports:forbidden'; END IF;
  RETURN result;
END $$;

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
  SELECT count(*) INTO goalkeeper_count FROM jsonb_array_elements(p_entries) entry JOIN public.championship_team_athletes cta ON cta.athlete_id=(entry->>'athlete_id')::uuid AND cta.championship_id=p_championship_id WHERE cta.is_goalkeeper;
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

CREATE OR REPLACE FUNCTION public.save_match_report(p_championship_id uuid,p_match_id uuid,p_payload jsonb)
RETURNS public.match_reports LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; result public.match_reports%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated') THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_locked'; END IF;
  INSERT INTO public.match_reports(organization_id,championship_id,match_id,regular_home_score,regular_away_score,extra_home_score,extra_away_score,penalty_home_score,penalty_away_score,first_half_added_minutes,second_half_added_minutes,notes,attachments,created_by,updated_by)
  VALUES(target.organization_id,p_championship_id,p_match_id,COALESCE((p_payload->>'regular_home_score')::int,target.home_score),COALESCE((p_payload->>'regular_away_score')::int,target.away_score),(p_payload->>'extra_home_score')::int,(p_payload->>'extra_away_score')::int,(p_payload->>'penalty_home_score')::int,(p_payload->>'penalty_away_score')::int,COALESCE((p_payload->>'first_half_added_minutes')::int,0),COALESCE((p_payload->>'second_half_added_minutes')::int,0),nullif(trim(p_payload->>'notes'),''),COALESCE(p_payload->'attachments','[]'::jsonb),auth.uid(),auth.uid())
  ON CONFLICT(match_id) DO UPDATE SET regular_home_score=EXCLUDED.regular_home_score,regular_away_score=EXCLUDED.regular_away_score,extra_home_score=EXCLUDED.extra_home_score,extra_away_score=EXCLUDED.extra_away_score,penalty_home_score=EXCLUDED.penalty_home_score,penalty_away_score=EXCLUDED.penalty_away_score,first_half_added_minutes=EXCLUDED.first_half_added_minutes,second_half_added_minutes=EXCLUDED.second_half_added_minutes,notes=EXCLUDED.notes,attachments=EXCLUDED.attachments,status='draft',version=public.match_reports.version+1,updated_by=auth.uid(),updated_at=now() RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'match_report',result.id,'saved',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.homologate_match_report(p_championship_id uuid,p_match_id uuid)
RETURNS public.match_reports LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; result public.match_reports%ROWTYPE; draft public.match_reports%ROWTYPE; home_lineup int; away_lineup int; report_events jsonb;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF target.status::text<>'finished' THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:match_not_finished'; END IF;
  SELECT * INTO draft FROM public.match_reports WHERE match_id=p_match_id FOR UPDATE;
  IF draft.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_missing'; END IF;
  IF draft.regular_home_score IS DISTINCT FROM target.home_score OR draft.regular_away_score IS DISTINCT FROM target.away_score THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_score_mismatch'; END IF;
  SELECT count(*) INTO home_lineup FROM public.lineups WHERE match_id=p_match_id AND team_id=target.home_team_id AND status='active';
  SELECT count(*) INTO away_lineup FROM public.lineups WHERE match_id=p_match_id AND team_id=target.away_team_id AND status='active';
  IF home_lineup=0 OR away_lineup=0 THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:lineups_incomplete'; END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.minute,e.created_at),'[]'::jsonb) INTO report_events FROM public.match_events e WHERE e.match_id=p_match_id AND e.deleted_at IS NULL;
  UPDATE public.match_reports r SET status='homologated',homologated_at=now(),homologated_by=auth.uid(),reopened_at=NULL,reopened_by=NULL,reopen_reason=NULL,
    snapshot=jsonb_build_object('match',to_jsonb(target),'lineups',(SELECT COALESCE(jsonb_agg(to_jsonb(l)),'[]'::jsonb) FROM public.lineups l WHERE l.match_id=p_match_id),'events',report_events,'report',to_jsonb(r)),updated_by=auth.uid(),updated_at=now()
  WHERE r.match_id=p_match_id RETURNING * INTO result;
  UPDATE public.matches SET confirmed_at=now(),confirmed_by=auth.uid(),updated_by=auth.uid(),updated_at=now() WHERE id=p_match_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'match_report',result.id,'homologated',result.snapshot);
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.reopen_match_report(p_championship_id uuid,p_match_id uuid,p_reason text)
RETURNS public.match_reports LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; result public.match_reports%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:reopen_reason_required'; END IF;
  UPDATE public.match_reports SET status='reopened',reopened_at=now(),reopened_by=auth.uid(),reopen_reason=trim(p_reason),version=version+1,updated_by=auth.uid(),updated_at=now() WHERE match_id=p_match_id AND status='homologated' RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_not_homologated'; END IF;
  UPDATE public.matches SET confirmed_at=NULL,confirmed_by=NULL,updated_by=auth.uid(),updated_at=now() WHERE id=p_match_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,context) VALUES(target.organization_id,auth.uid(),'match_report',result.id,'reopened',jsonb_build_object('reason',trim(p_reason),'version',result.version));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_referee(p_championship_id uuid,p_referee_id uuid,p_payload jsonb)
RETURNS public.referees LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.referees%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF p_referee_id IS NULL THEN
    INSERT INTO public.referees(organization_id,full_name,default_role,phone,email,document_number,default_fee,status,availability,created_by,updated_by)
    VALUES(target_org,trim(p_payload->>'full_name'),COALESCE(p_payload->>'default_role','main'),nullif(trim(p_payload->>'phone'),''),nullif(trim(p_payload->>'email'),''),nullif(trim(p_payload->>'document_number'),''),COALESCE((p_payload->>'default_fee')::numeric,0),'active',COALESCE(p_payload->'availability','{}'::jsonb),auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE
    UPDATE public.referees SET full_name=trim(p_payload->>'full_name'),default_role=COALESCE(p_payload->>'default_role',default_role),phone=nullif(trim(p_payload->>'phone'),''),email=nullif(trim(p_payload->>'email'),''),document_number=nullif(trim(p_payload->>'document_number'),''),default_fee=COALESCE((p_payload->>'default_fee')::numeric,default_fee),status=COALESCE(p_payload->>'status',status),availability=COALESCE(p_payload->'availability',availability),updated_by=auth.uid(),updated_at=now() WHERE id=p_referee_id AND organization_id=target_org RETURNING * INTO result;
  END IF;
  IF result.id IS NULL OR result.full_name='' THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_referee'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target_org,auth.uid(),'referee',result.id,CASE WHEN p_referee_id IS NULL THEN 'created' ELSE 'updated' END,to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.assign_referee(p_championship_id uuid,p_match_id uuid,p_referee_id uuid,p_role text,p_fee numeric DEFAULT 0)
RETURNS public.referee_assignments LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; result public.referee_assignments%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF NOT EXISTS(SELECT 1 FROM public.referees WHERE id=p_referee_id AND organization_id=target.organization_id AND status='active') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:referee_unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM public.referee_unavailability u WHERE u.referee_id=p_referee_id AND target.scheduled_at < u.ends_at AND target.scheduled_at+interval '2 hours' > u.starts_at) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='sports:referee_unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM public.referee_assignments ra JOIN public.matches m ON m.id=ra.match_id WHERE ra.referee_id=p_referee_id AND ra.match_id<>p_match_id AND ra.confirmation_status IN ('pending','confirmed') AND target.scheduled_at < m.scheduled_at+interval '2 hours' AND target.scheduled_at+interval '2 hours' > m.scheduled_at) THEN RAISE EXCEPTION USING ERRCODE='23P01',MESSAGE='sports:referee_schedule_conflict'; END IF;
  INSERT INTO public.referee_assignments(organization_id,championship_id,match_id,referee_id,assignment_role,confirmation_status,fee_amount,payment_status,created_by,updated_by)
  VALUES(target.organization_id,p_championship_id,p_match_id,p_referee_id,p_role,'pending',COALESCE(p_fee,0),'pending',auth.uid(),auth.uid())
  ON CONFLICT(match_id,assignment_role) DO UPDATE SET referee_id=EXCLUDED.referee_id,fee_amount=EXCLUDED.fee_amount,confirmation_status='pending',confirmed_at=NULL,updated_by=auth.uid(),updated_at=now() RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'referee_assignment',result.id,'assigned',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_manual_sanction(p_championship_id uuid,p_sanction_id uuid,p_payload jsonb)
RETURNS public.sanctions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.sanctions%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF nullif(trim(p_payload->>'reason'),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:sanction_reason_required'; END IF;
  IF p_sanction_id IS NULL THEN
    INSERT INTO public.sanctions(organization_id,championship_id,athlete_id,team_staff_id,team_id,sanction_type,reason,starts_at,ends_at,matches_suspended,points_deducted,fine_amount,status,metadata,created_by,updated_by)
    VALUES(target_org,p_championship_id,(p_payload->>'athlete_id')::uuid,(p_payload->>'team_staff_id')::uuid,(p_payload->>'team_id')::uuid,COALESCE(p_payload->>'sanction_type','suspension'),trim(p_payload->>'reason'),(p_payload->>'starts_at')::timestamptz,(p_payload->>'ends_at')::timestamptz,COALESCE((p_payload->>'matches_suspended')::int,0),COALESCE((p_payload->>'points_deducted')::int,0),COALESCE((p_payload->>'fine_amount')::numeric,0),'active',COALESCE(p_payload->'metadata','{}'::jsonb),auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE
    UPDATE public.sanctions SET sanction_type=COALESCE(p_payload->>'sanction_type',sanction_type),reason=trim(p_payload->>'reason'),starts_at=(p_payload->>'starts_at')::timestamptz,ends_at=(p_payload->>'ends_at')::timestamptz,matches_suspended=COALESCE((p_payload->>'matches_suspended')::int,matches_suspended),updated_by=auth.uid(),updated_at=now() WHERE id=p_sanction_id AND championship_id=p_championship_id AND status='active' RETURNING * INTO result;
  END IF;
  IF result.id IS NULL OR (result.athlete_id IS NULL AND result.team_staff_id IS NULL AND result.team_id IS NULL) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:sanction_subject_required'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target_org,auth.uid(),'sanction',result.id,'saved',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.revoke_sanction(p_championship_id uuid,p_sanction_id uuid,p_reason text)
RETURNS public.sanctions LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.sanctions%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:revocation_reason_required'; END IF;
  UPDATE public.sanctions SET status='revoked',revoked_at=now(),revoked_by=auth.uid(),revocation_reason=trim(p_reason),updated_by=auth.uid(),updated_at=now() WHERE id=p_sanction_id AND championship_id=p_championship_id AND status='active' RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:sanction_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,context) VALUES(target_org,auth.uid(),'sanction',result.id,'revoked',jsonb_build_object('reason',trim(p_reason)));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.phase3_automatic_card_sanction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE championship uuid; threshold int; card_count int;
BEGIN
  IF NEW.deleted_at IS NOT NULL OR NEW.athlete_id IS NULL OR NEW.type::text NOT IN ('yellow_card','red_card') THEN RETURN NEW; END IF;
  SELECT m.championship_id,COALESCE(cs.yellow_cards_for_suspension,3) INTO championship,threshold FROM public.matches m LEFT JOIN public.championship_settings cs ON cs.championship_id=m.championship_id WHERE m.id=NEW.match_id;
  IF NEW.type::text='yellow_card' THEN
    SELECT count(*) INTO card_count FROM public.match_events e JOIN public.matches m ON m.id=e.match_id WHERE m.championship_id=championship AND e.athlete_id=NEW.athlete_id AND e.type::text='yellow_card' AND e.deleted_at IS NULL;
    IF card_count % threshold <> 0 THEN RETURN NEW; END IF;
  END IF;
  INSERT INTO public.sanctions(organization_id,championship_id,match_id,team_id,athlete_id,sanction_type,reason,matches_suspended,status,source_event_id,metadata,created_by,updated_by)
  VALUES(NEW.organization_id,championship,NEW.match_id,NEW.team_id,NEW.athlete_id,'automatic_suspension',CASE WHEN NEW.type::text='red_card' THEN 'Suspensao automatica por cartao vermelho' ELSE format('Suspensao automatica por %s cartoes amarelos',threshold) END,1,'active',NEW.id,jsonb_build_object('automatic',true,'card_type',NEW.type::text,'card_count',card_count),NEW.created_by,NEW.created_by) ON CONFLICT(source_event_id) DO NOTHING;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS phase3_automatic_card_sanction ON public.match_events;
CREATE TRIGGER phase3_automatic_card_sanction AFTER INSERT ON public.match_events FOR EACH ROW EXECUTE FUNCTION public.phase3_automatic_card_sanction();

CREATE OR REPLACE FUNCTION public.phase3_revoke_removed_card_sanction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE public.sanctions SET status='revoked',revoked_at=now(),revocation_reason='Evento de cartao removido',updated_at=now(),updated_by=NEW.updated_by WHERE source_event_id=NEW.id AND status='active';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS phase3_revoke_removed_card_sanction ON public.match_events;
CREATE TRIGGER phase3_revoke_removed_card_sanction AFTER UPDATE OF deleted_at ON public.match_events FOR EACH ROW EXECUTE FUNCTION public.phase3_revoke_removed_card_sanction();

DO $$ DECLARE signature text; BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.phase3_match_context(uuid,uuid)','public.save_match_lineup(uuid,uuid,uuid,jsonb)','public.save_match_report(uuid,uuid,jsonb)',
    'public.homologate_match_report(uuid,uuid)','public.reopen_match_report(uuid,uuid,text)','public.save_referee(uuid,uuid,jsonb)',
    'public.assign_referee(uuid,uuid,uuid,text,numeric)','public.save_manual_sanction(uuid,uuid,jsonb)','public.revoke_sanction(uuid,uuid,text)'
  ] LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',signature); EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',signature); END LOOP;
END $$;
