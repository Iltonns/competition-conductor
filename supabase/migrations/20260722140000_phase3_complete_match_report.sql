-- Phase 3 completion: match staff, structured substitutions and private report attachments.

CREATE TABLE IF NOT EXISTS public.match_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_staff_id uuid NOT NULL REFERENCES public.team_staff(id) ON DELETE RESTRICT,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (match_id, team_staff_id)
);

CREATE TABLE IF NOT EXISTS public.match_report_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  object_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT match_report_attachments_mime_check CHECK (
    mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')
  )
);

CREATE INDEX IF NOT EXISTS match_staff_match_team_idx
  ON public.match_staff(match_id, team_id);
CREATE INDEX IF NOT EXISTS match_report_attachments_match_idx
  ON public.match_report_attachments(match_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS substitutions_match_athlete_in_unique
  ON public.substitutions(match_id, athlete_in_id);
CREATE UNIQUE INDEX IF NOT EXISTS substitutions_match_athlete_out_unique
  ON public.substitutions(match_id, athlete_out_id);

ALTER TABLE public.match_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_report_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS match_staff_member_select ON public.match_staff;
CREATE POLICY match_staff_member_select ON public.match_staff
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS match_report_attachments_member_select ON public.match_report_attachments;
CREATE POLICY match_report_attachments_member_select ON public.match_report_attachments
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

REVOKE ALL ON public.match_staff, public.match_report_attachments FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE ON public.match_staff, public.match_report_attachments FROM authenticated;
GRANT SELECT ON public.match_staff, public.match_report_attachments TO authenticated;
GRANT ALL ON public.match_staff, public.match_report_attachments TO service_role;

DROP TRIGGER IF EXISTS match_staff_updated_at ON public.match_staff;
CREATE TRIGGER match_staff_updated_at BEFORE UPDATE ON public.match_staff
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-report-attachments',
  'match-report-attachments',
  false,
  10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS match_report_attachments_member_read ON storage.objects;
CREATE POLICY match_report_attachments_member_read ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'match-report-attachments'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.is_org_member(o.id)
    )
  );

DROP POLICY IF EXISTS match_report_attachments_admin_insert ON storage.objects;
CREATE POLICY match_report_attachments_admin_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'match-report-attachments'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.can_administer_org(o.id)
    )
  );

DROP POLICY IF EXISTS match_report_attachments_admin_delete ON storage.objects;
CREATE POLICY match_report_attachments_admin_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'match-report-attachments'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id::text = (storage.foldername(name))[1]
        AND public.can_administer_org(o.id)
    )
  );

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
      JOIN public.championship_team_staff cts ON cts.team_staff_id=ts.id AND cts.active
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

CREATE OR REPLACE FUNCTION public.save_match_substitution(
  p_championship_id uuid,
  p_match_id uuid,
  p_substitution_id uuid,
  p_team_id uuid,
  p_athlete_out_id uuid,
  p_athlete_in_id uuid,
  p_minute integer,
  p_period text,
  p_note text DEFAULT NULL
)
RETURNS public.substitutions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; result public.substitutions%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated') THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_locked';
  END IF;
  IF p_team_id IS DISTINCT FROM target.home_team_id AND p_team_id IS DISTINCT FROM target.away_team_id THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:team_not_in_match';
  END IF;
  IF p_athlete_in_id=p_athlete_out_id OR p_minute IS NULL OR p_minute<0 OR p_minute>180
     OR p_period NOT IN ('first_half','second_half','extra_time','penalties') THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_substitution';
  END IF;
  IF NOT EXISTS(
    SELECT 1 FROM public.lineups WHERE match_id=p_match_id AND team_id=p_team_id
      AND athlete_id=p_athlete_out_id AND status='active' AND lineup_role='starter'
  ) OR NOT EXISTS(
    SELECT 1 FROM public.lineups WHERE match_id=p_match_id AND team_id=p_team_id
      AND athlete_id=p_athlete_in_id AND status='active' AND lineup_role='substitute'
  ) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:substitution_requires_lineup';
  END IF;
  IF p_substitution_id IS NULL THEN
    INSERT INTO public.substitutions(organization_id,match_id,team_id,athlete_out_id,athlete_in_id,minute,period,note,created_by)
    VALUES(target.organization_id,p_match_id,p_team_id,p_athlete_out_id,p_athlete_in_id,p_minute,p_period,NULLIF(trim(p_note),''),auth.uid())
    RETURNING * INTO result;
  ELSE
    UPDATE public.substitutions SET athlete_out_id=p_athlete_out_id,athlete_in_id=p_athlete_in_id,
      minute=p_minute,period=p_period,note=NULLIF(trim(p_note),'')
    WHERE id=p_substitution_id AND match_id=p_match_id AND team_id=p_team_id RETURNING * INTO result;
  END IF;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:substitution_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data)
  VALUES(target.organization_id,auth.uid(),'substitution',result.id,'saved',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.delete_match_substitution(
  p_championship_id uuid,p_match_id uuid,p_substitution_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; removed public.substitutions%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated') THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_locked';
  END IF;
  DELETE FROM public.substitutions WHERE id=p_substitution_id AND match_id=p_match_id RETURNING * INTO removed;
  IF removed.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:substitution_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data)
  VALUES(target.organization_id,auth.uid(),'substitution',removed.id,'deleted',to_jsonb(removed));
END $$;

CREATE OR REPLACE FUNCTION public.register_match_report_attachment(
  p_championship_id uuid,p_match_id uuid,p_object_path text,p_file_name text,p_mime_type text,p_size_bytes bigint
)
RETURNS public.match_report_attachments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,storage AS $$
DECLARE target public.matches%ROWTYPE; result public.match_report_attachments%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated') THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_locked';
  END IF;
  IF p_size_bytes<=0 OR p_size_bytes>10485760
     OR p_mime_type NOT IN ('application/pdf','image/jpeg','image/png','image/webp')
     OR p_object_path NOT LIKE target.organization_id::text||'/'||p_championship_id::text||'/'||p_match_id::text||'/%'
     OR NOT EXISTS(
       SELECT 1 FROM storage.objects o
       WHERE o.bucket_id='match-report-attachments' AND o.name=p_object_path
     ) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='sports:invalid_attachment';
  END IF;
  INSERT INTO public.match_report_attachments(
    organization_id,championship_id,match_id,object_path,file_name,mime_type,size_bytes,created_by
  ) VALUES(
    target.organization_id,p_championship_id,p_match_id,p_object_path,trim(p_file_name),p_mime_type,p_size_bytes,auth.uid()
  ) RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data)
  VALUES(target.organization_id,auth.uid(),'match_report_attachment',result.id,'created',to_jsonb(result));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.delete_match_report_attachment(
  p_championship_id uuid,p_match_id uuid,p_attachment_id uuid
)
RETURNS public.match_report_attachments
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target public.matches%ROWTYPE; removed public.match_report_attachments%ROWTYPE;
BEGIN
  target:=public.phase3_match_context(p_championship_id,p_match_id);
  IF EXISTS(SELECT 1 FROM public.match_reports WHERE match_id=p_match_id AND status='homologated') THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='sports:report_locked';
  END IF;
  DELETE FROM public.match_report_attachments
    WHERE id=p_attachment_id AND match_id=p_match_id RETURNING * INTO removed;
  IF removed.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='sports:attachment_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data)
  VALUES(target.organization_id,auth.uid(),'match_report_attachment',removed.id,'deleted',to_jsonb(removed));
  RETURN removed;
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
    attachments=(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at),'[]'::jsonb) FROM public.match_report_attachments a WHERE a.match_id=p_match_id),
    snapshot=jsonb_build_object(
      'match',to_jsonb(target),
      'lineups',(SELECT COALESCE(jsonb_agg(to_jsonb(l)),'[]'::jsonb) FROM public.lineups l WHERE l.match_id=p_match_id),
      'staff',(SELECT COALESCE(jsonb_agg(to_jsonb(ms)),'[]'::jsonb) FROM public.match_staff ms WHERE ms.match_id=p_match_id),
      'substitutions',(SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.minute,s.created_at),'[]'::jsonb) FROM public.substitutions s WHERE s.match_id=p_match_id),
      'referees',(SELECT COALESCE(jsonb_agg(to_jsonb(ra)),'[]'::jsonb) FROM public.referee_assignments ra WHERE ra.match_id=p_match_id),
      'attachments',(SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at),'[]'::jsonb) FROM public.match_report_attachments a WHERE a.match_id=p_match_id),
      'events',report_events,'report',to_jsonb(r)
    ),updated_by=auth.uid(),updated_at=now()
  WHERE r.match_id=p_match_id RETURNING * INTO result;
  UPDATE public.matches SET confirmed_at=now(),confirmed_by=auth.uid(),updated_by=auth.uid(),updated_at=now() WHERE id=p_match_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target.organization_id,auth.uid(),'match_report',result.id,'homologated',result.snapshot);
  RETURN result;
END $$;

DO $$ DECLARE signature text; BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.save_match_staff(uuid,uuid,uuid,uuid[])',
    'public.save_match_substitution(uuid,uuid,uuid,uuid,uuid,uuid,integer,text,text)',
    'public.delete_match_substitution(uuid,uuid,uuid)',
    'public.register_match_report_attachment(uuid,uuid,text,text,text,bigint)',
    'public.delete_match_report_attachment(uuid,uuid,uuid)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',signature);
  END LOOP;
END $$;
