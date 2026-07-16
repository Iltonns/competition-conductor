-- Etapa 2C: elenco, comissao tecnica e responsaveis por campeonato.
-- Migration aditiva. Interrompe em inconsistencias e nao remove dados existentes.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.athletes a
    JOIN public.teams t ON t.id = a.team_id
    WHERE a.team_id IS NOT NULL AND a.organization_id <> t.organization_id
  ) THEN
    RAISE EXCEPTION '2C bloqueada: existem atletas vinculados a equipes de outra organizacao';
  END IF;
END $$;

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS sport_name text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS document_number_normalized text,
  ADD COLUMN IF NOT EXISTS dominant_foot text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_goalkeeper boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_captain boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

ALTER TABLE public.championship_settings
  ADD COLUMN IF NOT EXISTS min_athletes_per_team integer,
  ADD COLUMN IF NOT EXISTS minimum_athlete_age integer,
  ADD COLUMN IF NOT EXISTS maximum_athlete_age integer,
  ADD COLUMN IF NOT EXISTS require_athlete_document boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_athlete_photo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_athlete_multiple_teams boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_shirt_number boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_duplicate_shirt_numbers boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_goalkeepers_per_team integer,
  ADD COLUMN IF NOT EXISTS max_staff_per_team integer,
  ADD COLUMN IF NOT EXISTS registration_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS allow_roster_changes_after_start boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS championship_teams_2c_identity_idx
  ON public.championship_teams(id, championship_id, team_id, organization_id);

CREATE TABLE public.championship_team_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL,
  championship_team_id uuid NOT NULL,
  team_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  shirt_number integer,
  position text,
  registration_status text NOT NULL DEFAULT 'registered',
  registration_date date NOT NULL DEFAULT CURRENT_DATE,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  is_captain boolean NOT NULL DEFAULT false,
  is_goalkeeper boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT championship_team_athletes_registration_status_check
    CHECK (registration_status IN ('registered','pending','approved','rejected','withdrawn')),
  CONSTRAINT championship_team_athletes_shirt_check CHECK (shirt_number IS NULL OR shirt_number BETWEEN 0 AND 999),
  CONSTRAINT championship_team_athletes_unique UNIQUE (championship_team_id, athlete_id),
  CONSTRAINT championship_team_athletes_championship_fk
    FOREIGN KEY (championship_id, organization_id) REFERENCES public.championships(id, organization_id),
  CONSTRAINT championship_team_athletes_team_fk
    FOREIGN KEY (team_id, organization_id) REFERENCES public.teams(id, organization_id),
  CONSTRAINT championship_team_athletes_athlete_fk
    FOREIGN KEY (athlete_id, organization_id) REFERENCES public.athletes(id, organization_id),
  CONSTRAINT championship_team_athletes_participation_fk
    FOREIGN KEY (championship_team_id, championship_id, team_id, organization_id)
    REFERENCES public.championship_teams(id, championship_id, team_id, organization_id)
);

CREATE TABLE public.team_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
  team_id uuid NOT NULL, full_name text NOT NULL, photo_url text, role text NOT NULL,
  custom_role text, document_type text, document_number text, document_number_normalized text,
  birth_date date, phone text, whatsapp text, email text, status text NOT NULL DEFAULT 'active',
  internal_notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  archived_at timestamptz, archived_by uuid REFERENCES auth.users(id),
  CONSTRAINT team_staff_team_fk FOREIGN KEY (team_id, organization_id) REFERENCES public.teams(id, organization_id),
  CONSTRAINT team_staff_role_check CHECK (role IN ('coach','assistant_coach','fitness_coach','goalkeeper_coach','masseur','physiotherapist','doctor','kit_manager','supervisor','director','president','other')),
  CONSTRAINT team_staff_status_check CHECK (status IN ('active','inactive','archived')),
  CONSTRAINT team_staff_custom_role_check CHECK (role <> 'other' OR nullif(btrim(custom_role),'') IS NOT NULL)
);

CREATE UNIQUE INDEX team_staff_id_organization_idx ON public.team_staff(id, organization_id);

CREATE TABLE public.championship_team_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL, championship_team_id uuid NOT NULL, team_id uuid NOT NULL,
  staff_id uuid NOT NULL, role text NOT NULL, registration_status text NOT NULL DEFAULT 'registered',
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT championship_team_staff_unique UNIQUE (championship_team_id, staff_id),
  CONSTRAINT championship_team_staff_staff_fk FOREIGN KEY (staff_id, organization_id) REFERENCES public.team_staff(id, organization_id),
  CONSTRAINT championship_team_staff_participation_fk FOREIGN KEY (championship_team_id, championship_id, team_id, organization_id)
    REFERENCES public.championship_teams(id, championship_id, team_id, organization_id)
);

CREATE TABLE public.team_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id),
  team_id uuid NOT NULL, full_name text NOT NULL, role text NOT NULL, photo_url text,
  document_type text, document_number text, document_number_normalized text, phone text, whatsapp text, email text,
  is_primary boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'active', internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id), updated_by uuid REFERENCES auth.users(id),
  archived_at timestamptz, archived_by uuid REFERENCES auth.users(id),
  CONSTRAINT team_responsibles_team_fk FOREIGN KEY (team_id, organization_id) REFERENCES public.teams(id, organization_id),
  CONSTRAINT team_responsibles_status_check CHECK (status IN ('active','inactive','archived'))
);

CREATE UNIQUE INDEX team_responsibles_one_primary_idx ON public.team_responsibles(team_id)
  WHERE is_primary AND status = 'active' AND archived_at IS NULL;
CREATE INDEX championship_team_athletes_roster_idx ON public.championship_team_athletes(championship_team_id, active);
CREATE INDEX championship_team_athletes_athlete_idx ON public.championship_team_athletes(athlete_id);
CREATE INDEX team_staff_team_idx ON public.team_staff(team_id, status);
CREATE INDEX championship_team_staff_roster_idx ON public.championship_team_staff(championship_team_id, active);
CREATE INDEX team_responsibles_team_idx ON public.team_responsibles(team_id, status);
CREATE UNIQUE INDEX athletes_document_org_idx ON public.athletes(organization_id, document_number_normalized)
  WHERE document_number_normalized IS NOT NULL AND archived_at IS NULL;

CREATE OR REPLACE FUNCTION public.tg_roster_audit_fields() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  NEW.updated_at := now(); NEW.updated_by := auth.uid();
  IF TG_OP = 'INSERT' THEN NEW.created_by := auth.uid(); END IF;
  IF to_jsonb(NEW) ? 'document_number_normalized' THEN
    NEW.document_number_normalized := nullif(regexp_replace(coalesce(NEW.document_number, ''), '[^[:alnum:]]', '', 'g'), '');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER athletes_2c_audit BEFORE INSERT OR UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.tg_roster_audit_fields();
CREATE TRIGGER championship_team_athletes_audit BEFORE INSERT OR UPDATE ON public.championship_team_athletes FOR EACH ROW EXECUTE FUNCTION public.tg_roster_audit_fields();
CREATE TRIGGER team_staff_audit BEFORE INSERT OR UPDATE ON public.team_staff FOR EACH ROW EXECUTE FUNCTION public.tg_roster_audit_fields();
CREATE TRIGGER championship_team_staff_audit BEFORE INSERT OR UPDATE ON public.championship_team_staff FOR EACH ROW EXECUTE FUNCTION public.tg_roster_audit_fields();
CREATE TRIGGER team_responsibles_audit BEFORE INSERT OR UPDATE ON public.team_responsibles FOR EACH ROW EXECUTE FUNCTION public.tg_roster_audit_fields();

ALTER TABLE public.championship_team_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_team_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_responsibles ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['championship_team_athletes','team_staff','championship_team_staff','team_responsibles'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', t || '_member_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id))', t || '_admin_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))', t || '_admin_update', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE ON public.championship_team_athletes, public.team_staff, public.championship_team_staff, public.team_responsibles TO authenticated;
GRANT ALL ON public.championship_team_athletes, public.team_staff, public.championship_team_staff, public.team_responsibles TO service_role;
REVOKE ALL ON public.championship_team_athletes, public.team_staff, public.championship_team_staff, public.team_responsibles FROM anon;
-- `athletes` ganhou documento e contatos privados nesta etapa. RLS filtra linhas,
-- nao colunas; portanto o grant publico anterior precisa ser removido para evitar
-- exposicao de dados pessoais. Uma pagina publica futura deve usar uma view segura.
REVOKE SELECT ON public.athletes FROM anon;

CREATE OR REPLACE FUNCTION public.register_athlete_for_championship(
  p_championship_id uuid, p_team_id uuid, p_athlete_id uuid DEFAULT NULL,
  p_full_name text DEFAULT NULL, p_birth_date date DEFAULT NULL, p_document_type text DEFAULT NULL,
  p_document_number text DEFAULT NULL, p_photo_url text DEFAULT NULL, p_shirt_number integer DEFAULT NULL,
  p_position text DEFAULT NULL, p_is_goalkeeper boolean DEFAULT false, p_is_captain boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_link public.championship_teams%ROWTYPE; v_settings public.championship_settings%ROWTYPE;
  v_athlete uuid; v_count integer; v_normalized text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticacao obrigatoria'; END IF;
  SELECT * INTO v_link FROM public.championship_teams
    WHERE championship_id=p_championship_id AND team_id=p_team_id AND status <> 'archived' FOR UPDATE;
  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato'; END IF;
  SELECT * INTO v_settings FROM public.championship_settings WHERE championship_id=p_championship_id;
  SELECT count(*) INTO v_count FROM public.championship_team_athletes WHERE championship_team_id=v_link.id AND active;
  IF v_settings.max_athletes_per_team IS NOT NULL AND v_count >= v_settings.max_athletes_per_team THEN RAISE EXCEPTION 'Limite de atletas atingido'; END IF;
  IF v_settings.registration_starts_at IS NOT NULL AND now() < v_settings.registration_starts_at OR v_settings.registration_ends_at IS NOT NULL AND now() > v_settings.registration_ends_at THEN RAISE EXCEPTION 'Inscricoes fora do periodo permitido'; END IF;
  v_normalized := nullif(regexp_replace(coalesce(p_document_number,''), '[^[:alnum:]]', '', 'g'), '');
  IF p_athlete_id IS NULL THEN
    IF nullif(btrim(p_full_name),'') IS NULL THEN RAISE EXCEPTION 'Nome obrigatorio'; END IF;
    IF v_settings.require_athlete_document AND v_normalized IS NULL THEN RAISE EXCEPTION 'Documento obrigatorio'; END IF;
    IF v_settings.require_athlete_photo AND p_photo_url IS NULL THEN RAISE EXCEPTION 'Foto obrigatoria'; END IF;
    IF v_normalized IS NOT NULL THEN SELECT id INTO v_athlete FROM public.athletes WHERE organization_id=v_link.organization_id AND document_number_normalized=v_normalized AND archived_at IS NULL; END IF;
    IF v_athlete IS NULL AND p_birth_date IS NOT NULL THEN SELECT id INTO v_athlete FROM public.athletes WHERE organization_id=v_link.organization_id AND lower(full_name)=lower(btrim(p_full_name)) AND birth_date=p_birth_date AND archived_at IS NULL LIMIT 1; END IF;
    IF v_athlete IS NULL THEN
      INSERT INTO public.athletes(organization_id,team_id,full_name,birth_date,document_type,document_number,photo_url,status,is_goalkeeper,is_captain)
      VALUES(v_link.organization_id,p_team_id,btrim(p_full_name),p_birth_date,p_document_type,p_document_number,p_photo_url,'active',p_is_goalkeeper,p_is_captain) RETURNING id INTO v_athlete;
    END IF;
  ELSE
    SELECT id INTO v_athlete FROM public.athletes WHERE id=p_athlete_id AND organization_id=v_link.organization_id AND archived_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Atleta invalido para a organizacao'; END IF;
  END IF;
  IF NOT v_settings.allow_athlete_multiple_teams AND EXISTS(SELECT 1 FROM public.championship_team_athletes WHERE championship_id=p_championship_id AND athlete_id=v_athlete AND team_id<>p_team_id AND active) THEN RAISE EXCEPTION 'Atleta ja inscrito por outra equipe'; END IF;
  IF v_settings.require_shirt_number AND p_shirt_number IS NULL THEN RAISE EXCEPTION 'Numero da camisa obrigatorio'; END IF;
  IF NOT v_settings.allow_duplicate_shirt_numbers AND p_shirt_number IS NOT NULL AND EXISTS(SELECT 1 FROM public.championship_team_athletes WHERE championship_team_id=v_link.id AND shirt_number=p_shirt_number AND active) THEN RAISE EXCEPTION 'Numero da camisa ja utilizado'; END IF;
  INSERT INTO public.championship_team_athletes(organization_id,championship_id,championship_team_id,team_id,athlete_id,shirt_number,position,is_goalkeeper,is_captain)
  VALUES(v_link.organization_id,p_championship_id,v_link.id,p_team_id,v_athlete,p_shirt_number,p_position,p_is_goalkeeper,p_is_captain);
  RETURN v_athlete;
END $$;

CREATE OR REPLACE FUNCTION public.set_primary_team_responsible(p_team_id uuid, p_responsible_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_org uuid; BEGIN
  SELECT organization_id INTO v_org FROM public.teams WHERE id=p_team_id FOR UPDATE;
  IF v_org IS NULL OR NOT public.can_edit_org(v_org) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.team_responsibles WHERE id=p_responsible_id AND team_id=p_team_id AND status='active' AND archived_at IS NULL) THEN RAISE EXCEPTION 'Responsavel invalido'; END IF;
  UPDATE public.team_responsibles SET is_primary=false WHERE team_id=p_team_id AND is_primary;
  UPDATE public.team_responsibles SET is_primary=true WHERE id=p_responsible_id;
END $$;

REVOKE ALL ON FUNCTION public.register_athlete_for_championship(uuid,uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_athlete_for_championship(uuid,uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.set_primary_team_responsible(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_primary_team_responsible(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_team_staff_for_championship(p_championship_id uuid,p_team_id uuid,p_full_name text,p_role text,p_custom_role text DEFAULT NULL,p_phone text DEFAULT NULL,p_email text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_link public.championship_teams%ROWTYPE; v_staff uuid; v_limit integer; v_count integer; BEGIN
 SELECT * INTO v_link FROM public.championship_teams WHERE championship_id=p_championship_id AND team_id=p_team_id AND status<>'archived' FOR UPDATE;
 IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato'; END IF;
 SELECT max_staff_per_team INTO v_limit FROM public.championship_settings WHERE championship_id=p_championship_id;
 SELECT count(*) INTO v_count FROM public.championship_team_staff WHERE championship_team_id=v_link.id AND active;
 IF v_limit IS NOT NULL AND v_count>=v_limit THEN RAISE EXCEPTION 'Limite da comissao atingido'; END IF;
 INSERT INTO public.team_staff(organization_id,team_id,full_name,role,custom_role,phone,email) VALUES(v_link.organization_id,p_team_id,btrim(p_full_name),p_role,p_custom_role,p_phone,p_email) RETURNING id INTO v_staff;
 INSERT INTO public.championship_team_staff(organization_id,championship_id,championship_team_id,team_id,staff_id,role) VALUES(v_link.organization_id,p_championship_id,v_link.id,p_team_id,v_staff,p_role);
 RETURN v_staff;
END $$;
REVOKE ALL ON FUNCTION public.add_team_staff_for_championship(uuid,uuid,text,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_team_staff_for_championship(uuid,uuid,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_team_responsible(p_championship_id uuid,p_team_id uuid,p_full_name text,p_role text,p_phone text DEFAULT NULL,p_email text DEFAULT NULL,p_is_primary boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_link public.championship_teams%ROWTYPE; v_id uuid; BEGIN
 SELECT * INTO v_link FROM public.championship_teams WHERE championship_id=p_championship_id AND team_id=p_team_id AND status<>'archived' FOR UPDATE;
 IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato'; END IF;
 IF p_is_primary THEN UPDATE public.team_responsibles SET is_primary=false WHERE team_id=p_team_id AND is_primary; END IF;
 INSERT INTO public.team_responsibles(organization_id,team_id,full_name,role,phone,email,is_primary) VALUES(v_link.organization_id,p_team_id,btrim(p_full_name),p_role,p_phone,p_email,p_is_primary) RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.add_team_responsible(uuid,uuid,text,text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.add_team_responsible(uuid,uuid,text,text,text,text,boolean) TO authenticated;
