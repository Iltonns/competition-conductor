
-- 1. Extend teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS abbreviation text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS foundation_year integer,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS history text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- 2. Extend athletes
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS sport_name text,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_number text;

-- 3. championship_teams
CREATE TABLE IF NOT EXISTS public.championship_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'approved',
  registration_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(championship_id, team_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_teams TO authenticated;
GRANT SELECT ON public.championship_teams TO anon;
GRANT ALL ON public.championship_teams TO service_role;
ALTER TABLE public.championship_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ct member" ON public.championship_teams;
CREATE POLICY "ct member" ON public.championship_teams FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "ct public read" ON public.championship_teams;
CREATE POLICY "ct public read" ON public.championship_teams FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.championships c WHERE c.id = championship_id AND c.is_public));
DROP TRIGGER IF EXISTS championship_teams_updated_at ON public.championship_teams;
CREATE TRIGGER championship_teams_updated_at BEFORE UPDATE ON public.championship_teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. championship_team_athletes (roster)
CREATE TABLE IF NOT EXISTS public.championship_team_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  championship_team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  shirt_number integer,
  position text,
  registration_status text NOT NULL DEFAULT 'registered',
  is_goalkeeper boolean NOT NULL DEFAULT false,
  is_captain boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(championship_team_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_team_athletes TO authenticated;
GRANT SELECT ON public.championship_team_athletes TO anon;
GRANT ALL ON public.championship_team_athletes TO service_role;
ALTER TABLE public.championship_team_athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cta member" ON public.championship_team_athletes;
CREATE POLICY "cta member" ON public.championship_team_athletes FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "cta public read" ON public.championship_team_athletes;
CREATE POLICY "cta public read" ON public.championship_team_athletes FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.championships c WHERE c.id = championship_id AND c.is_public));
DROP TRIGGER IF EXISTS cta_updated_at ON public.championship_team_athletes;
CREATE TRIGGER cta_updated_at BEFORE UPDATE ON public.championship_team_athletes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. team_staff
CREATE TABLE IF NOT EXISTS public.team_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'coach',
  phone text,
  email text,
  photo_url text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_staff TO authenticated;
GRANT ALL ON public.team_staff TO service_role;
ALTER TABLE public.team_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_staff member" ON public.team_staff;
CREATE POLICY "team_staff member" ON public.team_staff FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
DROP TRIGGER IF EXISTS team_staff_updated_at ON public.team_staff;
CREATE TRIGGER team_staff_updated_at BEFORE UPDATE ON public.team_staff
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. championship_team_staff
CREATE TABLE IF NOT EXISTS public.championship_team_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  team_staff_id uuid NOT NULL REFERENCES public.team_staff(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(championship_team_id, team_staff_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_team_staff TO authenticated;
GRANT ALL ON public.championship_team_staff TO service_role;
ALTER TABLE public.championship_team_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cts member" ON public.championship_team_staff;
CREATE POLICY "cts member" ON public.championship_team_staff FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

-- 7. team_responsibles
CREATE TABLE IF NOT EXISTS public.team_responsibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  phone text,
  email text,
  document text,
  is_primary boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_responsibles TO authenticated;
GRANT ALL ON public.team_responsibles TO service_role;
ALTER TABLE public.team_responsibles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr member" ON public.team_responsibles;
CREATE POLICY "tr member" ON public.team_responsibles FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
DROP TRIGGER IF EXISTS team_responsibles_updated_at ON public.team_responsibles;
CREATE TRIGGER team_responsibles_updated_at BEFORE UPDATE ON public.team_responsibles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 8. referees
CREATE TABLE IF NOT EXISTS public.referees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'main',
  license_number text,
  phone text,
  email text,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referees TO authenticated;
GRANT SELECT ON public.referees TO anon;
GRANT ALL ON public.referees TO service_role;
ALTER TABLE public.referees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referees member" ON public.referees;
CREATE POLICY "referees member" ON public.referees FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
DROP TRIGGER IF EXISTS referees_updated_at ON public.referees;
CREATE TRIGGER referees_updated_at BEFORE UPDATE ON public.referees
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 9. Backfill championship_teams from existing teams.championship_id
INSERT INTO public.championship_teams (organization_id, championship_id, team_id, status)
SELECT t.organization_id, t.championship_id, t.id, COALESCE(t.status, 'approved')
FROM public.teams t
WHERE t.championship_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 10. RPCs
CREATE OR REPLACE FUNCTION public.register_athlete_for_championship(
  p_championship_id uuid, p_team_id uuid, p_full_name text,
  p_birth_date date, p_document_type text, p_document_number text,
  p_photo_url text, p_shirt_number integer, p_position text,
  p_is_goalkeeper boolean, p_is_captain boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid; v_ct uuid; v_athlete uuid;
BEGIN
  SELECT organization_id INTO v_org FROM public.championships WHERE id = p_championship_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'championship_not_found'; END IF;
  IF NOT public.is_org_member(v_org) THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.championship_teams (organization_id, championship_id, team_id)
    VALUES (v_org, p_championship_id, p_team_id)
    ON CONFLICT (championship_id, team_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_ct;

  INSERT INTO public.athletes (organization_id, team_id, full_name, birth_date, document_type, document_number, photo_url, position, jersey_number)
    VALUES (v_org, p_team_id, p_full_name, p_birth_date, p_document_type, p_document_number, p_photo_url, p_position, p_shirt_number)
    RETURNING id INTO v_athlete;

  INSERT INTO public.championship_team_athletes (organization_id, championship_id, championship_team_id, athlete_id, shirt_number, position, is_goalkeeper, is_captain)
    VALUES (v_org, p_championship_id, v_ct, v_athlete, p_shirt_number, p_position, COALESCE(p_is_goalkeeper, false), COALESCE(p_is_captain, false));

  RETURN v_athlete;
END; $$;

CREATE OR REPLACE FUNCTION public.add_team_staff_for_championship(
  p_championship_id uuid, p_team_id uuid, p_full_name text, p_role text,
  p_phone text, p_email text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid; v_ct uuid; v_staff uuid;
BEGIN
  SELECT organization_id INTO v_org FROM public.championships WHERE id = p_championship_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'championship_not_found'; END IF;
  IF NOT public.is_org_member(v_org) THEN RAISE EXCEPTION 'forbidden'; END IF;

  INSERT INTO public.championship_teams (organization_id, championship_id, team_id)
    VALUES (v_org, p_championship_id, p_team_id)
    ON CONFLICT (championship_id, team_id) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_ct;

  INSERT INTO public.team_staff (organization_id, team_id, full_name, role, phone, email)
    VALUES (v_org, p_team_id, p_full_name, COALESCE(p_role, 'coach'), p_phone, p_email)
    RETURNING id INTO v_staff;

  INSERT INTO public.championship_team_staff (organization_id, championship_team_id, team_staff_id)
    VALUES (v_org, v_ct, v_staff);

  RETURN v_staff;
END; $$;

CREATE OR REPLACE FUNCTION public.add_team_responsible(
  p_championship_id uuid, p_team_id uuid, p_full_name text, p_role text,
  p_phone text DEFAULT NULL, p_email text DEFAULT NULL, p_is_primary boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org uuid; v_id uuid;
BEGIN
  SELECT organization_id INTO v_org FROM public.championships WHERE id = p_championship_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'championship_not_found'; END IF;
  IF NOT public.is_org_member(v_org) THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF COALESCE(p_is_primary, false) THEN
    UPDATE public.team_responsibles SET is_primary = false WHERE team_id = p_team_id;
  END IF;

  INSERT INTO public.team_responsibles (organization_id, team_id, full_name, role, phone, email, is_primary)
    VALUES (v_org, p_team_id, p_full_name, COALESCE(p_role, 'manager'), p_phone, p_email, COALESCE(p_is_primary, false))
    RETURNING id INTO v_id;

  RETURN v_id;
END; $$;
