-- Fase 2: motor de competição, regulamento, estrutura, gerações e avanço.
-- Migration aditiva; preserva toda partida e histórico já existente.

ALTER TYPE public.championship_status ADD VALUE IF NOT EXISTS 'published';

ALTER TABLE public.championship_settings
  ADD COLUMN IF NOT EXISTS min_athletes_per_team integer,
  ADD COLUMN IF NOT EXISTS max_goalkeepers_per_team integer,
  ADD COLUMN IF NOT EXISTS max_staff_per_team integer,
  ADD COLUMN IF NOT EXISTS minimum_athlete_age integer,
  ADD COLUMN IF NOT EXISTS maximum_athlete_age integer,
  ADD COLUMN IF NOT EXISTS registration_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS require_athlete_document boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_athlete_photo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_shirt_number boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_duplicate_shirt_numbers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_athlete_multiple_teams boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_roster_changes_after_start boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rules_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS round_id uuid,
  ADD COLUMN IF NOT EXISTS leg integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sequence integer,
  ADD COLUMN IF NOT EXISTS match_number integer;

ALTER TABLE public.standings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'provisional',
  ADD COLUMN IF NOT EXISTS homologated_at timestamptz,
  ADD COLUMN IF NOT EXISTS homologated_by uuid REFERENCES auth.users(id);

ALTER TABLE public.championship_settings DROP CONSTRAINT IF EXISTS championship_settings_competition_format_check;
ALTER TABLE public.championship_settings ADD CONSTRAINT championship_settings_competition_format_check
  CHECK (competition_format IN ('round_robin','groups','knockout','groups_knockout')) NOT VALID;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='championship_settings_roster_range_check') THEN
    ALTER TABLE public.championship_settings ADD CONSTRAINT championship_settings_roster_range_check CHECK(min_athletes_per_team IS NULL OR max_athletes_per_team IS NULL OR min_athletes_per_team<=max_athletes_per_team) NOT VALID;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='championship_settings_age_range_check') THEN
    ALTER TABLE public.championship_settings ADD CONSTRAINT championship_settings_age_range_check CHECK(minimum_athlete_age IS NULL OR maximum_athlete_age IS NULL OR minimum_athlete_age<=maximum_athlete_age) NOT VALID;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='championship_settings_registration_dates_check') THEN
    ALTER TABLE public.championship_settings ADD CONSTRAINT championship_settings_registration_dates_check CHECK(registration_starts_at IS NULL OR registration_ends_at IS NULL OR registration_starts_at<=registration_ends_at) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.competition_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.competition_stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  sequence integer NOT NULL DEFAULT 1,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.competition_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.competition_stages(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.competition_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  round_number integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.competition_stage_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.competition_stages(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.competition_groups(id) ON DELETE SET NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  seed integer,
  source_stage_id uuid REFERENCES public.competition_stages(id),
  source_group_id uuid REFERENCES public.competition_groups(id),
  source_position integer,
  assignment_method text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT competition_stage_teams_unique UNIQUE (stage_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.competition_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.competition_stages(id),
  group_id uuid REFERENCES public.competition_groups(id),
  generation_type text NOT NULL,
  client_request_id uuid NOT NULL,
  version integer NOT NULL,
  input_data jsonb NOT NULL,
  result_data jsonb NOT NULL,
  result_hash text NOT NULL,
  status text NOT NULL DEFAULT 'committed',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT competition_generations_request_unique UNIQUE (championship_id, client_request_id),
  CONSTRAINT competition_generations_version_unique UNIQUE (championship_id, generation_type, stage_id, group_id, version)
);

CREATE TABLE IF NOT EXISTS public.standings_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.competition_stages(id),
  group_id uuid REFERENCES public.competition_groups(id),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.competition_advancements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  source_stage_id uuid NOT NULL REFERENCES public.competition_stages(id),
  target_stage_id uuid NOT NULL REFERENCES public.competition_stages(id),
  client_request_id uuid NOT NULL,
  qualified_teams jsonb NOT NULL,
  result_hash text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  reopened_at timestamptz,
  reopened_by uuid REFERENCES auth.users(id),
  reopen_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT competition_advancements_request_unique UNIQUE (championship_id, client_request_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS competition_stages_active_sequence_unique
  ON public.competition_stages (championship_id, sequence) WHERE status <> 'archived';
CREATE UNIQUE INDEX IF NOT EXISTS competition_groups_stage_sequence_unique
  ON public.competition_groups (stage_id, sequence);
CREATE UNIQUE INDEX IF NOT EXISTS competition_groups_stage_name_unique
  ON public.competition_groups (stage_id, lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS competition_rounds_scope_number_unique
  ON public.competition_rounds (stage_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), round_number);
DROP INDEX IF EXISTS public.matches_generated_fixture_unique;
CREATE UNIQUE INDEX matches_generated_fixture_unique
  ON public.matches (stage_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), leg, LEAST(home_team_id,away_team_id), GREATEST(home_team_id,away_team_id))
  WHERE stage_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS competition_generations_scope_version_unique
  ON public.competition_generations(championship_id,generation_type,COALESCE(stage_id,'00000000-0000-0000-0000-000000000000'::uuid),COALESCE(group_id,'00000000-0000-0000-0000-000000000000'::uuid),version);
CREATE INDEX IF NOT EXISTS competition_stage_teams_group_idx ON public.competition_stage_teams(stage_id, group_id, seed);
CREATE UNIQUE INDEX IF NOT EXISTS competition_advancements_confirmed_stage_unique
  ON public.competition_advancements(source_stage_id,target_stage_id) WHERE status='confirmed';

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'competition_groups','competition_rounds','competition_stage_teams',
    'competition_generations','standings_adjustments','competition_advancements'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_member_select', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', table_name || '_member_select', table_name);
    EXECUTE format('REVOKE INSERT,UPDATE,DELETE ON public.%I FROM authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
  END LOOP;
END
$$;
REVOKE ALL ON public.competition_groups,public.competition_rounds,public.competition_stage_teams,public.competition_generations,public.standings_adjustments,public.competition_advancements FROM anon;
GRANT ALL ON public.competition_groups,public.competition_rounds,public.competition_stage_teams,public.competition_generations,public.standings_adjustments,public.competition_advancements TO service_role;

REVOKE INSERT,UPDATE,DELETE ON public.championship_settings FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.competition_stages FROM authenticated;

CREATE OR REPLACE FUNCTION public.phase2_championship_org(p_championship_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id=p_championship_id;
  IF target_org IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:championship_not_found'; END IF;
  IF NOT public.can_administer_org(target_org) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='competition:forbidden'; END IF;
  RETURN target_org;
END $$;

CREATE OR REPLACE FUNCTION public.save_competition_settings(
  p_championship_id uuid,p_settings jsonb,p_exception_reason text DEFAULT NULL
) RETURNS public.championship_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; current_settings public.championship_settings%ROWTYPE; result public.championship_settings%ROWTYPE; started boolean;
  requested_format text; requested_tiebreakers text[];
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO current_settings FROM public.championship_settings WHERE championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN INSERT INTO public.championship_settings(organization_id,championship_id) VALUES(target_org,p_championship_id) RETURNING * INTO current_settings; END IF;
  requested_format:=COALESCE(p_settings->>'competition_format',current_settings.competition_format);
  SELECT COALESCE(array_agg(value),current_settings.tiebreakers) INTO requested_tiebreakers FROM jsonb_array_elements_text(COALESCE(p_settings->'tiebreakers',to_jsonb(current_settings.tiebreakers))) value;
  IF requested_format NOT IN ('round_robin','groups','knockout','groups_knockout') THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:invalid_format'; END IF;
  IF EXISTS(SELECT 1 FROM unnest(requested_tiebreakers) criterion WHERE criterion NOT IN ('points','wins','goal_difference','goals_for','head_to_head','fair_play','draw')) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:invalid_tiebreaker'; END IF;
  IF cardinality(requested_tiebreakers)=0 OR cardinality(requested_tiebreakers)<>(SELECT count(DISTINCT criterion) FROM unnest(requested_tiebreakers) criterion) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:duplicate_tiebreaker'; END IF;
  IF requested_format IN('groups','groups_knockout') AND (COALESCE((p_settings->>'group_count')::int,current_settings.group_count,0)<1 OR COALESCE((p_settings->>'qualifiers_per_group')::int,current_settings.qualifiers_per_group,0)<1) THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:group_settings_incomplete'; END IF;
  IF COALESCE((p_settings->>'allow_draw')::boolean,current_settings.allow_draw)=false AND COALESCE((p_settings->>'uses_extra_time')::boolean,current_settings.uses_extra_time)=false AND COALESCE((p_settings->>'uses_penalties')::boolean,current_settings.uses_penalties)=false THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:tied_match_without_decider'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.matches WHERE championship_id=p_championship_id AND (started_at IS NOT NULL OR status::text IN ('live','finished'))) INTO started;
  IF started AND (requested_format<>current_settings.competition_format OR COALESCE((p_settings->>'legs')::int,current_settings.legs)<>current_settings.legs OR COALESCE((p_settings->>'group_count')::int,current_settings.group_count) IS DISTINCT FROM current_settings.group_count) AND nullif(trim(p_exception_reason),'') IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:locked_settings';
  END IF;
  UPDATE public.championship_settings SET
    competition_format=requested_format,legs=COALESCE((p_settings->>'legs')::smallint,legs),
    group_count=CASE WHEN p_settings?'group_count' THEN (p_settings->>'group_count')::int ELSE group_count END,
    qualifiers_per_group=CASE WHEN p_settings?'qualifiers_per_group' THEN (p_settings->>'qualifiers_per_group')::int ELSE qualifiers_per_group END,
    third_place_match=COALESCE((p_settings->>'third_place_match')::boolean,third_place_match),
    points_win=COALESCE((p_settings->>'points_win')::int,points_win),points_draw=COALESCE((p_settings->>'points_draw')::int,points_draw),points_loss=COALESCE((p_settings->>'points_loss')::int,points_loss),
    tiebreakers=requested_tiebreakers,allow_draw=COALESCE((p_settings->>'allow_draw')::boolean,allow_draw),uses_extra_time=COALESCE((p_settings->>'uses_extra_time')::boolean,uses_extra_time),uses_penalties=COALESCE((p_settings->>'uses_penalties')::boolean,uses_penalties),
    wo_score_for=COALESCE((p_settings->>'wo_score_for')::int,wo_score_for),wo_score_against=COALESCE((p_settings->>'wo_score_against')::int,wo_score_against),minimum_rest_hours=COALESCE((p_settings->>'minimum_rest_hours')::int,minimum_rest_hours),
    min_athletes_per_team=CASE WHEN p_settings?'min_athletes_per_team' THEN (p_settings->>'min_athletes_per_team')::int ELSE min_athletes_per_team END,max_athletes_per_team=CASE WHEN p_settings?'max_athletes_per_team' THEN (p_settings->>'max_athletes_per_team')::int ELSE max_athletes_per_team END,
    max_goalkeepers_per_team=CASE WHEN p_settings?'max_goalkeepers_per_team' THEN (p_settings->>'max_goalkeepers_per_team')::int ELSE max_goalkeepers_per_team END,max_staff_per_team=CASE WHEN p_settings?'max_staff_per_team' THEN (p_settings->>'max_staff_per_team')::int ELSE max_staff_per_team END,
    minimum_athlete_age=CASE WHEN p_settings?'minimum_athlete_age' THEN (p_settings->>'minimum_athlete_age')::int ELSE minimum_athlete_age END,maximum_athlete_age=CASE WHEN p_settings?'maximum_athlete_age' THEN (p_settings->>'maximum_athlete_age')::int ELSE maximum_athlete_age END,
    registration_starts_at=CASE WHEN p_settings?'registration_starts_at' THEN (p_settings->>'registration_starts_at')::timestamptz ELSE registration_starts_at END,registration_ends_at=CASE WHEN p_settings?'registration_ends_at' THEN (p_settings->>'registration_ends_at')::timestamptz ELSE registration_ends_at END,
    require_athlete_document=COALESCE((p_settings->>'require_athlete_document')::boolean,require_athlete_document),require_athlete_photo=COALESCE((p_settings->>'require_athlete_photo')::boolean,require_athlete_photo),require_shirt_number=COALESCE((p_settings->>'require_shirt_number')::boolean,require_shirt_number),
    allow_duplicate_shirt_numbers=COALESCE((p_settings->>'allow_duplicate_shirt_numbers')::boolean,allow_duplicate_shirt_numbers),allow_athlete_multiple_teams=COALESCE((p_settings->>'allow_athlete_multiple_teams')::boolean,allow_athlete_multiple_teams),allow_roster_changes_after_start=COALESCE((p_settings->>'allow_roster_changes_after_start')::boolean,allow_roster_changes_after_start),
    yellow_cards_for_suspension=COALESCE((p_settings->>'yellow_cards_for_suspension')::int,yellow_cards_for_suspension),custom_rules=COALESCE(p_settings->'custom_rules',custom_rules),
    rules_version=rules_version+1,locked_at=CASE WHEN started THEN COALESCE(locked_at,now()) ELSE locked_at END,updated_by=auth.uid(),updated_at=now()
  WHERE championship_id=p_championship_id RETURNING * INTO result;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data,new_data,context)
  VALUES(target_org,auth.uid(),'championship_settings',result.id,CASE WHEN started THEN 'exceptional_update' ELSE 'updated' END,to_jsonb(current_settings),to_jsonb(result),jsonb_build_object('reason',p_exception_reason));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.publish_competition(p_championship_id uuid)
RETURNS public.championships LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; settings_row public.championship_settings%ROWTYPE; result public.championships%ROWTYPE; team_count int; stage_count int;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  SELECT count(*) INTO team_count FROM public.championship_teams WHERE championship_id=p_championship_id AND organization_id=target_org AND status NOT IN ('archived','rejected');
  SELECT count(*) INTO stage_count FROM public.competition_stages WHERE championship_id=p_championship_id AND organization_id=target_org AND status<>'archived';
  IF settings_row.id IS NULL OR team_count<2 OR stage_count<1 THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:publication_checklist_incomplete'; END IF;
  IF settings_row.competition_format IN ('groups','groups_knockout') AND (settings_row.group_count IS NULL OR settings_row.qualifiers_per_group IS NULL) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:group_settings_incomplete'; END IF;
  PERFORM set_config('app.phase2_publish','true',true);
  UPDATE public.championships SET status='published'::public.championship_status,updated_by=auth.uid(),updated_at=now() WHERE id=p_championship_id RETURNING * INTO result;
  UPDATE public.championship_settings SET published_at=now(),published_by=auth.uid(),updated_at=now() WHERE championship_id=p_championship_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target_org,auth.uid(),'championship',p_championship_id,'published',jsonb_build_object('checklist',true));
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.phase2_guard_championship_publication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.status::text='published' AND (TG_OP='INSERT' OR OLD.status::text<>'published') AND current_setting('app.phase2_publish',true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='competition:publication_requires_checklist';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS phase2_championship_publication_guard ON public.championships;
CREATE TRIGGER phase2_championship_publication_guard BEFORE INSERT OR UPDATE OF status ON public.championships
FOR EACH ROW EXECUTE FUNCTION public.phase2_guard_championship_publication();

CREATE OR REPLACE FUNCTION public.save_competition_stage(p_championship_id uuid,p_stage_id uuid,p_payload jsonb)
RETURNS public.competition_stages LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.competition_stages%ROWTYPE; current_row public.competition_stages%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF p_stage_id IS NULL THEN
    INSERT INTO public.competition_stages(organization_id,championship_id,name,stage_type,sequence,status,starts_at,ends_at,settings,created_by,updated_by)
    VALUES(target_org,p_championship_id,trim(p_payload->>'name'),p_payload->>'stage_type',(p_payload->>'sequence')::int,'draft',(p_payload->>'starts_at')::date,(p_payload->>'ends_at')::date,COALESCE(p_payload->'settings','{}'),auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE
    SELECT * INTO current_row FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:stage_not_found'; END IF;
    IF COALESCE(p_payload->>'status',current_row.status)<>current_row.status AND NOT ((current_row.status='draft' AND p_payload->>'status' IN('scheduled','active')) OR (current_row.status='scheduled' AND p_payload->>'status' IN('draft','active')) OR (current_row.status='active' AND p_payload->>'status'='finished')) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:invalid_stage_transition'; END IF;
    IF EXISTS(SELECT 1 FROM public.matches WHERE stage_id=p_stage_id AND (started_at IS NOT NULL OR status::text IN ('live','finished'))) AND ((p_payload->>'stage_type') IS DISTINCT FROM current_row.stage_type OR (p_payload->>'sequence')::int IS DISTINCT FROM current_row.sequence) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:stage_locked'; END IF;
    UPDATE public.competition_stages SET name=trim(p_payload->>'name'),stage_type=p_payload->>'stage_type',sequence=(p_payload->>'sequence')::int,status=COALESCE(p_payload->>'status',status),starts_at=(p_payload->>'starts_at')::date,ends_at=(p_payload->>'ends_at')::date,settings=COALESCE(p_payload->'settings',settings),updated_by=auth.uid(),updated_at=now() WHERE id=p_stage_id RETURNING * INTO result;
  END IF;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.archive_competition_stage(p_championship_id uuid,p_stage_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; target public.competition_stages%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO target FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:stage_not_found'; END IF;
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='competition:reason_required'; END IF;
  UPDATE public.competition_stages SET status='archived',updated_by=auth.uid(),updated_at=now() WHERE id=p_stage_id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data,context) VALUES(target_org,auth.uid(),'competition_stage',p_stage_id,'archived',to_jsonb(target),jsonb_build_object('reason',p_reason));
END $$;

CREATE OR REPLACE FUNCTION public.save_competition_group(p_championship_id uuid,p_stage_id uuid,p_group_id uuid,p_name text,p_sequence int)
RETURNS public.competition_groups LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; stage_row public.competition_stages%ROWTYPE; result public.competition_groups%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO stage_row FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id AND organization_id=target_org;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:stage_not_found'; END IF;
  IF p_group_id IS NULL THEN INSERT INTO public.competition_groups(organization_id,championship_id,stage_id,name,sequence,created_by,updated_by) VALUES(target_org,p_championship_id,p_stage_id,trim(p_name),p_sequence,auth.uid(),auth.uid()) RETURNING * INTO result;
  ELSE UPDATE public.competition_groups SET name=trim(p_name),sequence=p_sequence,updated_by=auth.uid(),updated_at=now() WHERE id=p_group_id AND stage_id=p_stage_id AND championship_id=p_championship_id RETURNING * INTO result; END IF;
  IF result.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:group_not_found'; END IF;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.generate_competition_groups(p_championship_id uuid,p_stage_id uuid,p_client_request_id uuid,p_group_count int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result_id uuid; generation_version int; group_index int; generated jsonb:='[]'::jsonb;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT id INTO result_id FROM public.competition_generations WHERE championship_id=p_championship_id AND client_request_id=p_client_request_id;
  IF result_id IS NOT NULL THEN RETURN result_id; END IF;
  IF p_group_count<1 OR p_group_count>26 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:invalid_group_count'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id AND organization_id=target_org AND stage_type IN('groups','custom')) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:stage_does_not_support_groups'; END IF;
  IF EXISTS(SELECT 1 FROM public.matches WHERE stage_id=p_stage_id AND (started_at IS NOT NULL OR status::text IN('live','finished'))) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:stage_locked'; END IF;
  FOR group_index IN 1..p_group_count LOOP
    INSERT INTO public.competition_groups(organization_id,championship_id,stage_id,name,code,sequence,created_by,updated_by)
    VALUES(target_org,p_championship_id,p_stage_id,'Grupo '||chr(64+group_index),chr(64+group_index),group_index,auth.uid(),auth.uid())
    ON CONFLICT(stage_id,sequence) DO UPDATE SET updated_by=auth.uid(),updated_at=now();
    generated:=generated||jsonb_build_array(jsonb_build_object('name','Grupo '||chr(64+group_index),'sequence',group_index));
  END LOOP;
  SELECT COALESCE(max(version),0)+1 INTO generation_version FROM public.competition_generations WHERE championship_id=p_championship_id AND generation_type='groups' AND stage_id=p_stage_id;
  INSERT INTO public.competition_generations(organization_id,championship_id,stage_id,generation_type,client_request_id,version,input_data,result_data,result_hash,created_by)
  VALUES(target_org,p_championship_id,p_stage_id,'groups',p_client_request_id,generation_version,jsonb_build_object('group_count',p_group_count),generated,md5(generated::text),auth.uid()) RETURNING id INTO result_id;
  RETURN result_id;
END $$;

CREATE OR REPLACE FUNCTION public.assign_team_to_stage(p_championship_id uuid,p_stage_id uuid,p_team_id uuid,p_group_id uuid DEFAULT NULL,p_seed int DEFAULT NULL)
RETURNS public.competition_stage_teams LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result public.competition_stage_teams%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF NOT public.phase1_team_in_championship(target_org,p_championship_id,p_team_id) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='competition:team_outside_championship'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id AND organization_id=target_org) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='competition:stage_not_found'; END IF;
  IF p_group_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.competition_groups WHERE id=p_group_id AND stage_id=p_stage_id AND championship_id=p_championship_id AND organization_id=target_org) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='competition:group_not_found'; END IF;
  INSERT INTO public.competition_stage_teams(organization_id,championship_id,stage_id,group_id,team_id,seed,created_by,updated_by) VALUES(target_org,p_championship_id,p_stage_id,p_group_id,p_team_id,p_seed,auth.uid(),auth.uid())
  ON CONFLICT(stage_id,team_id) DO UPDATE SET group_id=excluded.group_id,seed=excluded.seed,updated_by=auth.uid(),updated_at=now() RETURNING * INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.get_competition_stage_teams(p_championship_id uuid,p_stage_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result jsonb;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id=p_championship_id;
  IF target_org IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:championship_not_found'; END IF;
  IF NOT public.is_org_member(target_org) THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='competition:forbidden'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',st.id,'team_id',st.team_id,'group_id',st.group_id,'seed',st.seed,'source_stage_id',st.source_stage_id,'source_group_id',st.source_group_id,'source_position',st.source_position,'assignment_method',st.assignment_method,'team_name',t.name,'team_short_name',t.short_name) ORDER BY st.seed NULLS LAST,t.name),'[]'::jsonb)
  INTO result FROM public.competition_stage_teams st JOIN public.teams t ON t.id=st.team_id AND t.organization_id=st.organization_id
  WHERE st.championship_id=p_championship_id AND st.stage_id=p_stage_id AND st.organization_id=target_org;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.commit_fixture_generation(
  p_championship_id uuid,p_stage_id uuid,p_group_id uuid,p_client_request_id uuid,p_fixtures jsonb,p_first_kickoff timestamptz,p_round_interval_hours int
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; generation_id uuid; generation_version int; fixture jsonb; round_row public.competition_rounds%ROWTYPE; kickoff timestamptz; settings_row public.championship_settings%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT id INTO generation_id FROM public.competition_generations WHERE championship_id=p_championship_id AND client_request_id=p_client_request_id;
  IF generation_id IS NOT NULL THEN RETURN generation_id; END IF;
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  IF p_round_interval_hours<settings_row.minimum_rest_hours THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='competition:minimum_rest_violation'; END IF;
  IF jsonb_array_length(p_fixtures)=0 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='competition:empty_generation'; END IF;
  SELECT COALESCE(max(version),0)+1 INTO generation_version FROM public.competition_generations WHERE championship_id=p_championship_id AND generation_type='fixtures' AND stage_id=p_stage_id AND group_id IS NOT DISTINCT FROM p_group_id;
  INSERT INTO public.competition_generations(organization_id,championship_id,stage_id,group_id,generation_type,client_request_id,version,input_data,result_data,result_hash,created_by)
  VALUES(target_org,p_championship_id,p_stage_id,p_group_id,'fixtures',p_client_request_id,generation_version,jsonb_build_object('first_kickoff',p_first_kickoff,'round_interval_hours',p_round_interval_hours),p_fixtures,md5(p_fixtures::text),auth.uid()) RETURNING id INTO generation_id;
  FOR fixture IN SELECT value FROM jsonb_array_elements(p_fixtures) LOOP
    IF (fixture->>'homeTeamId')=(fixture->>'awayTeamId') OR NOT EXISTS(SELECT 1 FROM public.competition_stage_teams st WHERE st.stage_id=p_stage_id AND st.team_id=(fixture->>'homeTeamId')::uuid AND st.group_id IS NOT DISTINCT FROM p_group_id) OR NOT EXISTS(SELECT 1 FROM public.competition_stage_teams st WHERE st.stage_id=p_stage_id AND st.team_id=(fixture->>'awayTeamId')::uuid AND st.group_id IS NOT DISTINCT FROM p_group_id) THEN RAISE EXCEPTION USING ERRCODE='23503',MESSAGE='competition:invalid_fixture_team'; END IF;
    kickoff:=p_first_kickoff+make_interval(hours=>((fixture->>'roundNumber')::int-1)*p_round_interval_hours);
    INSERT INTO public.competition_rounds(organization_id,championship_id,stage_id,group_id,name,round_number,status,starts_at,created_by,updated_by)
    VALUES(target_org,p_championship_id,p_stage_id,p_group_id,'Rodada '||(fixture->>'roundNumber'),(fixture->>'roundNumber')::int,'scheduled',kickoff,auth.uid(),auth.uid())
    ON CONFLICT(stage_id,(COALESCE(group_id,'00000000-0000-0000-0000-000000000000'::uuid)),round_number) DO UPDATE SET starts_at=excluded.starts_at,updated_by=auth.uid(),updated_at=now() RETURNING * INTO round_row;
    INSERT INTO public.matches(organization_id,championship_id,stage_id,group_id,round_id,home_team_id,away_team_id,round,scheduled_at,leg,status,home_score,away_score,metadata,created_by,updated_by)
    VALUES(target_org,p_championship_id,p_stage_id,p_group_id,round_row.id,(fixture->>'homeTeamId')::uuid,(fixture->>'awayTeamId')::uuid,'Rodada '||(fixture->>'roundNumber'),kickoff,(fixture->>'leg')::int,'scheduled',0,0,jsonb_build_object('generation_id',generation_id),auth.uid(),auth.uid())
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN generation_id;
END $$;

CREATE OR REPLACE FUNCTION public.add_standings_adjustment(p_championship_id uuid,p_stage_id uuid,p_group_id uuid,p_team_id uuid,p_points int,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result_id uuid;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='competition:reason_required'; END IF;
  INSERT INTO public.standings_adjustments(organization_id,championship_id,stage_id,group_id,team_id,points,reason,created_by) VALUES(target_org,p_championship_id,p_stage_id,p_group_id,p_team_id,p_points,trim(p_reason),auth.uid()) RETURNING id INTO result_id;
  PERFORM public.recalculate_standings(p_championship_id,p_stage_id,p_group_id,NULL);
  RETURN result_id;
END $$;

CREATE OR REPLACE FUNCTION public.homologate_standings(p_championship_id uuid,p_stage_id uuid,p_group_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; affected int;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  IF p_stage_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.competition_stages WHERE id=p_stage_id AND championship_id=p_championship_id AND status='finished') THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:stage_not_finished'; END IF;
  UPDATE public.standings SET status='homologated',homologated_at=now(),homologated_by=auth.uid(),updated_at=now()
  WHERE championship_id=p_championship_id AND stage_id IS NOT DISTINCT FROM p_stage_id AND group_id IS NOT DISTINCT FROM p_group_id;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected=0 THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:standings_not_found'; END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,context) VALUES(target_org,auth.uid(),'standings',p_stage_id,'homologated',jsonb_build_object('group_id',p_group_id,'rows',affected));
END $$;

CREATE OR REPLACE FUNCTION public.recalculate_standings(
  p_championship_id uuid,p_stage_id uuid DEFAULT NULL,p_group_id uuid DEFAULT NULL,p_category_id uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; settings_row public.championship_settings%ROWTYPE;
BEGIN
  SELECT organization_id INTO target_org FROM public.championships WHERE id=p_championship_id;
  IF target_org IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='championship:not_found'; END IF;
  SELECT * INTO settings_row FROM public.championship_settings WHERE championship_id=p_championship_id;
  IF settings_row.id IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:settings_not_found'; END IF;
  DELETE FROM public.standings s WHERE s.championship_id=p_championship_id AND s.stage_id IS NOT DISTINCT FROM p_stage_id AND s.group_id IS NOT DISTINCT FROM p_group_id AND s.category_id IS NOT DISTINCT FROM p_category_id;
  WITH eligible AS (
    SELECT st.team_id FROM public.competition_stage_teams st WHERE p_stage_id IS NOT NULL AND st.stage_id=p_stage_id AND st.group_id IS NOT DISTINCT FROM p_group_id
    UNION SELECT ct.team_id FROM public.championship_teams ct WHERE p_stage_id IS NULL AND ct.championship_id=p_championship_id AND ct.organization_id=target_org AND ct.status NOT IN('archived','rejected')
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

CREATE OR REPLACE FUNCTION public.confirm_stage_advancement(p_championship_id uuid,p_source_stage_id uuid,p_target_stage_id uuid,p_client_request_id uuid,p_qualified_teams jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; result_id uuid; item jsonb; target_type text; team_count int; pair_index int; round_id uuid; home_id uuid; away_id uuid;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT id INTO result_id FROM public.competition_advancements WHERE championship_id=p_championship_id AND client_request_id=p_client_request_id;
  IF result_id IS NOT NULL THEN RETURN result_id; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.competition_stages WHERE id=p_source_stage_id AND championship_id=p_championship_id AND status='finished') THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:source_stage_not_finished'; END IF;
  SELECT stage_type INTO target_type FROM public.competition_stages WHERE id=p_target_stage_id AND championship_id=p_championship_id AND status IN('draft','scheduled');
  IF target_type IS NULL THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:target_stage_unavailable'; END IF;
  INSERT INTO public.competition_advancements(organization_id,championship_id,source_stage_id,target_stage_id,client_request_id,qualified_teams,result_hash,created_by)
  VALUES(target_org,p_championship_id,p_source_stage_id,p_target_stage_id,p_client_request_id,p_qualified_teams,md5(p_qualified_teams::text),auth.uid()) RETURNING id INTO result_id;
  FOR item IN SELECT value FROM jsonb_array_elements(p_qualified_teams) LOOP
    INSERT INTO public.competition_stage_teams(organization_id,championship_id,stage_id,team_id,seed,source_stage_id,source_group_id,source_position,assignment_method,created_by,updated_by)
    VALUES(target_org,p_championship_id,p_target_stage_id,(item->>'teamId')::uuid,(item->>'seed')::int,p_source_stage_id,(item->>'sourceGroupId')::uuid,(item->>'sourcePosition')::int,'advancement',auth.uid(),auth.uid());
  END LOOP;
  IF target_type='knockout' THEN
    team_count:=jsonb_array_length(p_qualified_teams);
    IF team_count<2 OR team_count%2<>0 THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='competition:knockout_requires_even_teams'; END IF;
    INSERT INTO public.competition_rounds(organization_id,championship_id,stage_id,name,round_number,status,created_by,updated_by)
    VALUES(target_org,p_championship_id,p_target_stage_id,'Rodada eliminatória 1',1,'draft',auth.uid(),auth.uid())
    ON CONFLICT(stage_id,(COALESCE(group_id,'00000000-0000-0000-0000-000000000000'::uuid)),round_number) DO UPDATE SET updated_by=auth.uid(),updated_at=now() RETURNING id INTO round_id;
    FOR pair_index IN 0..(team_count/2-1) LOOP
      home_id:=(p_qualified_teams->pair_index->>'teamId')::uuid;
      away_id:=(p_qualified_teams->(team_count-1-pair_index)->>'teamId')::uuid;
      INSERT INTO public.matches(organization_id,championship_id,stage_id,round_id,home_team_id,away_team_id,round,leg,status,home_score,away_score,metadata,created_by,updated_by)
      VALUES(target_org,p_championship_id,p_target_stage_id,round_id,home_id,away_id,'Rodada eliminatória 1',1,'scheduled',0,0,jsonb_build_object('advancement_id',result_id,'seeding','high_low'),auth.uid(),auth.uid())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,new_data) VALUES(target_org,auth.uid(),'competition_advancement',result_id,'confirmed',p_qualified_teams);
  RETURN result_id;
END $$;

CREATE OR REPLACE FUNCTION public.reopen_stage_advancement(p_championship_id uuid,p_advancement_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target_org uuid; target public.competition_advancements%ROWTYPE;
BEGIN
  target_org:=public.phase2_championship_org(p_championship_id);
  SELECT * INTO target FROM public.competition_advancements WHERE id=p_advancement_id AND championship_id=p_championship_id AND status='confirmed' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='competition:advancement_not_found'; END IF;
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='competition:reason_required'; END IF;
  IF EXISTS(SELECT 1 FROM public.matches m WHERE m.stage_id=target.target_stage_id AND (m.status::text IN('live','finished') OR EXISTS(SELECT 1 FROM public.match_events e WHERE e.match_id=m.id AND e.deleted_at IS NULL))) THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='competition:advancement_has_history'; END IF;
  DELETE FROM public.matches WHERE stage_id=target.target_stage_id AND metadata->>'advancement_id'=target.id::text;
  DELETE FROM public.competition_stage_teams WHERE stage_id=target.target_stage_id AND assignment_method='advancement' AND source_stage_id=target.source_stage_id;
  UPDATE public.competition_advancements SET status='reopened',reopened_at=now(),reopened_by=auth.uid(),reopen_reason=trim(p_reason) WHERE id=target.id;
  INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data,context) VALUES(target_org,auth.uid(),'competition_advancement',target.id,'reopened',to_jsonb(target),jsonb_build_object('reason',p_reason));
END $$;

CREATE OR REPLACE FUNCTION public.phase2_recalculate_scoped_standings_after_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.status::text='finished' OR OLD.status::text='finished' THEN
    PERFORM public.recalculate_standings(NEW.championship_id,NEW.stage_id,NEW.group_id,NEW.category_id);
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id OR OLD.group_id IS DISTINCT FROM NEW.group_id OR OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      PERFORM public.recalculate_standings(OLD.championship_id,OLD.stage_id,OLD.group_id,OLD.category_id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS phase2_matches_standings ON public.matches;
CREATE TRIGGER phase2_matches_standings AFTER UPDATE OF status,home_score,away_score,stage_id,group_id,category_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.phase2_recalculate_scoped_standings_after_match();

CREATE OR REPLACE FUNCTION public.phase2_audit_match_structure_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at OR NEW.venue IS DISTINCT FROM OLD.venue OR NEW.stage_id IS DISTINCT FROM OLD.stage_id OR NEW.group_id IS DISTINCT FROM OLD.group_id OR NEW.round_id IS DISTINCT FROM OLD.round_id OR NEW.home_team_id IS DISTINCT FROM OLD.home_team_id OR NEW.away_team_id IS DISTINCT FROM OLD.away_team_id THEN
    INSERT INTO public.audit_logs(organization_id,user_id,entity_type,entity_id,action,old_data,new_data)
    VALUES(NEW.organization_id,auth.uid(),'match',NEW.id,'structure_adjusted',jsonb_build_object('scheduled_at',OLD.scheduled_at,'venue',OLD.venue,'stage_id',OLD.stage_id,'group_id',OLD.group_id,'round_id',OLD.round_id,'home_team_id',OLD.home_team_id,'away_team_id',OLD.away_team_id),jsonb_build_object('scheduled_at',NEW.scheduled_at,'venue',NEW.venue,'stage_id',NEW.stage_id,'group_id',NEW.group_id,'round_id',NEW.round_id,'home_team_id',NEW.home_team_id,'away_team_id',NEW.away_team_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS phase2_matches_structure_audit ON public.matches;
CREATE TRIGGER phase2_matches_structure_audit AFTER UPDATE OF scheduled_at,venue,stage_id,group_id,round_id,home_team_id,away_team_id ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.phase2_audit_match_structure_change();

DO $$
DECLARE signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.phase2_championship_org(uuid)',
    'public.save_competition_settings(uuid,jsonb,text)',
    'public.publish_competition(uuid)',
    'public.save_competition_stage(uuid,uuid,jsonb)',
    'public.archive_competition_stage(uuid,uuid,text)',
    'public.save_competition_group(uuid,uuid,uuid,text,integer)',
    'public.generate_competition_groups(uuid,uuid,uuid,integer)',
    'public.assign_team_to_stage(uuid,uuid,uuid,uuid,integer)',
    'public.get_competition_stage_teams(uuid,uuid)',
    'public.commit_fixture_generation(uuid,uuid,uuid,uuid,jsonb,timestamptz,integer)',
    'public.add_standings_adjustment(uuid,uuid,uuid,uuid,integer,text)',
    'public.homologate_standings(uuid,uuid,uuid)',
    'public.confirm_stage_advancement(uuid,uuid,uuid,uuid,jsonb)'
    ,'public.reopen_stage_advancement(uuid,uuid,text)'
  ] LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',signature); END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.phase2_recalculate_scoped_standings_after_match() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.phase2_audit_match_structure_change() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.phase2_guard_championship_publication() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.phase2_championship_org(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.save_competition_settings(uuid,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_competition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_competition_stage(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_competition_stage(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_competition_group(uuid,uuid,uuid,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_competition_groups(uuid,uuid,uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_team_to_stage(uuid,uuid,uuid,uuid,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_competition_stage_teams(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_fixture_generation(uuid,uuid,uuid,uuid,jsonb,timestamptz,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_standings_adjustment(uuid,uuid,uuid,uuid,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.homologate_standings(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_stage_advancement(uuid,uuid,uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_stage_advancement(uuid,uuid,text) TO authenticated;
