-- Etapa 2B: fundacao administrativa e CRUD seguro de equipes.
-- A coluna teams.championship_id e legada e permanece apenas por compatibilidade.

-- ---------------------------------------------------------------------------
-- Evolucao aditiva do cadastro de equipes
-- ---------------------------------------------------------------------------
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
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.teams.championship_id IS
  'LEGADO: novas funcionalidades devem usar public.championship_teams.';

-- Reconciliacao aditiva: a tabela pode existir no remoto mesmo sem baseline local.
CREATE TABLE IF NOT EXISTS public.championship_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id),
  team_id uuid NOT NULL REFERENCES public.teams(id),
  status text NOT NULL DEFAULT 'approved',
  registration_number text,
  seed integer,
  joined_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.championship_teams
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Diagnosticos bloqueantes: nenhum dado inconsistente e alterado silenciosamente.
DO $$
DECLARE invalid_count bigint;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM public.teams t
  JOIN public.championships c ON c.id = t.championship_id
  WHERE t.championship_id IS NOT NULL AND t.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'teams_admin_foundation: % equipe(s) legada(s) em campeonato de outro tenant', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.championship_teams ct
  JOIN public.championships c ON c.id = ct.championship_id
  JOIN public.teams t ON t.id = ct.team_id
  WHERE ct.organization_id IS DISTINCT FROM c.organization_id
     OR ct.organization_id IS DISTINCT FROM t.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'teams_admin_foundation: % vinculo(s) de equipe entre tenants', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count FROM (
    SELECT championship_id, team_id FROM public.championship_teams
    GROUP BY championship_id, team_id HAVING count(*) > 1
  ) duplicates;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'teams_admin_foundation: % vinculo(s) duplicado(s) devem ser reconciliados manualmente', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count FROM public.teams
  WHERE foundation_year IS NOT NULL
    AND (foundation_year < 1800 OR foundation_year > 2200);
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'teams_admin_foundation: % ano(s) de fundacao fora do intervalo aceito', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count FROM public.teams
  WHERE (abbreviation IS NOT NULL AND char_length(abbreviation) > 10)
     OR (primary_color IS NOT NULL AND primary_color !~ '^#[0-9A-Fa-f]{6}$')
     OR (secondary_color IS NOT NULL AND secondary_color !~ '^#[0-9A-Fa-f]{6}$')
     OR status NOT IN ('active', 'inactive', 'archived');
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'teams_admin_foundation: % equipe(s) violam as novas validacoes', invalid_count;
  END IF;
END
$$;

-- Backfill idempotente do relacionamento legado. A coluna nao e removida nesta etapa.
INSERT INTO public.championship_teams (
  organization_id, championship_id, team_id, status, joined_at, approved_at,
  created_at, updated_at, created_by, updated_by
)
SELECT
  t.organization_id, t.championship_id, t.id,
  CASE WHEN t.status = 'archived' THEN 'archived' ELSE 'approved' END,
  t.created_at,
  CASE WHEN t.status = 'archived' THEN NULL ELSE t.created_at END,
  t.created_at, t.updated_at, t.created_by, t.updated_by
FROM public.teams t
WHERE t.championship_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.championship_teams ct
    WHERE ct.championship_id = t.championship_id AND ct.team_id = t.id
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_foundation_year_check') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_foundation_year_check
      CHECK (foundation_year IS NULL OR foundation_year BETWEEN 1800 AND 2200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_abbreviation_length_check') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_abbreviation_length_check
      CHECK (abbreviation IS NULL OR char_length(abbreviation) <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_colors_check') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_colors_check CHECK (
      (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$') AND
      (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_email_check') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_email_check CHECK (
      email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_status_check') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_status_check
      CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_status_check') THEN
    ALTER TABLE public.championship_teams ADD CONSTRAINT championship_teams_status_check
      CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'withdrawn', 'archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_seed_check') THEN
    ALTER TABLE public.championship_teams ADD CONSTRAINT championship_teams_seed_check
      CHECK (seed IS NULL OR seed > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_slug_organization_key') THEN
    ALTER TABLE public.teams ADD CONSTRAINT teams_slug_organization_key UNIQUE (organization_id, slug);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.championship_teams'::regclass AND contype = 'u'
      AND pg_get_constraintdef(oid) ~* 'UNIQUE \(championship_id, team_id\)'
  ) THEN
    ALTER TABLE public.championship_teams ADD CONSTRAINT championship_teams_championship_team_key
      UNIQUE (championship_id, team_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_championship_same_org_fkey') THEN
    ALTER TABLE public.championship_teams ADD CONSTRAINT championship_teams_championship_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships(id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_team_same_org_fkey') THEN
    ALTER TABLE public.championship_teams ADD CONSTRAINT championship_teams_team_same_org_fkey
      FOREIGN KEY (team_id, organization_id) REFERENCES public.teams(id, organization_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS teams_status_idx ON public.teams(status);
CREATE INDEX IF NOT EXISTS championship_teams_organization_idx ON public.championship_teams(organization_id);
CREATE INDEX IF NOT EXISTS championship_teams_team_idx ON public.championship_teams(team_id);
CREATE INDEX IF NOT EXISTS championship_teams_status_idx ON public.championship_teams(status);
-- Busca contem `%termo%`; sem pg_trgm preexistente, nao e criada extensao/indice especializado.

DROP TRIGGER IF EXISTS championship_teams_updated_at ON public.championship_teams;
CREATE TRIGGER championship_teams_updated_at BEFORE UPDATE ON public.championship_teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS championship_teams_admin_audit ON public.championship_teams;
CREATE TRIGGER championship_teams_admin_audit BEFORE INSERT OR UPDATE ON public.championship_teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();
DROP TRIGGER IF EXISTS championship_teams_organization_immutable ON public.championship_teams;
CREATE TRIGGER championship_teams_organization_immutable BEFORE UPDATE ON public.championship_teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_organization_change();

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_teams ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.teams TO authenticated;
REVOKE DELETE ON public.teams FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_teams TO authenticated;
GRANT ALL ON public.teams, public.championship_teams TO service_role;

DROP POLICY IF EXISTS "teams_admin_delete" ON public.teams;
DROP POLICY IF EXISTS "championship_teams_member_select" ON public.championship_teams;
DROP POLICY IF EXISTS "championship_teams_public_select" ON public.championship_teams;
DROP POLICY IF EXISTS "championship_teams_admin_insert" ON public.championship_teams;
DROP POLICY IF EXISTS "championship_teams_admin_update" ON public.championship_teams;
DROP POLICY IF EXISTS "championship_teams_admin_delete" ON public.championship_teams;
CREATE POLICY "championship_teams_member_select" ON public.championship_teams
  FOR SELECT TO authenticated USING (
    public.is_org_member(organization_id) AND EXISTS (
      SELECT 1 FROM public.championships c
      WHERE c.id = championship_teams.championship_id
        AND c.organization_id = championship_teams.organization_id
    )
  );
CREATE POLICY "championship_teams_public_select" ON public.championship_teams
  FOR SELECT TO anon, authenticated USING (
    status = 'approved' AND EXISTS (
      SELECT 1 FROM public.championships c
      WHERE c.id = championship_teams.championship_id
        AND c.organization_id = championship_teams.organization_id
        AND c.is_public AND c.status <> 'draft'
    )
  );
CREATE POLICY "championship_teams_admin_insert" ON public.championship_teams
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "championship_teams_admin_update" ON public.championship_teams
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
-- DELETE somente via RPC, que verifica historico sob lock.

-- ---------------------------------------------------------------------------
-- Operacoes transacionais. O tenant sempre deriva do campeonato autorizado.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_team_for_championship(
  p_championship_id uuid, p_name text, p_short_name text DEFAULT NULL,
  p_abbreviation text DEFAULT NULL, p_slug text DEFAULT NULL, p_crest_url text DEFAULT NULL,
  p_cover_url text DEFAULT NULL, p_primary_color text DEFAULT NULL,
  p_secondary_color text DEFAULT NULL, p_city text DEFAULT NULL, p_state text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL, p_foundation_year integer DEFAULT NULL,
  p_category text DEFAULT NULL, p_gender text DEFAULT NULL, p_description text DEFAULT NULL,
  p_history text DEFAULT NULL, p_phone text DEFAULT NULL, p_whatsapp text DEFAULT NULL,
  p_email text DEFAULT NULL, p_instagram text DEFAULT NULL, p_facebook text DEFAULT NULL,
  p_website text DEFAULT NULL, p_registration_number text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL
) RETURNS public.teams
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target_championship public.championships%ROWTYPE; created_team public.teams%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:authentication_required'; END IF;
  SELECT * INTO target_championship FROM public.championships WHERE id=p_championship_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='team:championship_not_found'; END IF;
  IF NOT public.can_administer_org(target_championship.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:forbidden';
  END IF;
  IF nullif(btrim(p_name),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='team:invalid_payload'; END IF;

  INSERT INTO public.teams (
    organization_id, name, short_name, abbreviation, slug, crest_url, cover_url,
    primary_color, secondary_color, city, state, neighborhood, foundation_year,
    category, gender, description, history, phone, whatsapp, email, instagram,
    facebook, website, status, registration_number, internal_notes, created_by, updated_by
  ) VALUES (
    target_championship.organization_id, btrim(p_name), nullif(btrim(p_short_name),''),
    upper(nullif(btrim(p_abbreviation),'')), nullif(btrim(p_slug),''), nullif(btrim(p_crest_url),''),
    nullif(btrim(p_cover_url),''), nullif(btrim(p_primary_color),''), nullif(btrim(p_secondary_color),''),
    nullif(btrim(p_city),''), upper(nullif(btrim(p_state),'')), nullif(btrim(p_neighborhood),''),
    p_foundation_year, nullif(btrim(p_category),''), nullif(btrim(p_gender),''),
    nullif(btrim(p_description),''), nullif(btrim(p_history),''), nullif(btrim(p_phone),''),
    nullif(btrim(p_whatsapp),''), lower(nullif(btrim(p_email),'')), nullif(btrim(p_instagram),''),
    nullif(btrim(p_facebook),''), nullif(btrim(p_website),''), 'active',
    nullif(btrim(p_registration_number),''), nullif(btrim(p_internal_notes),''), auth.uid(), auth.uid()
  ) RETURNING * INTO created_team;

  INSERT INTO public.championship_teams (
    organization_id, championship_id, team_id, status, registration_number,
    joined_at, approved_at, created_by, updated_by
  ) VALUES (
    target_championship.organization_id, target_championship.id, created_team.id, 'approved',
    nullif(btrim(p_registration_number),''), now(), now(), auth.uid(), auth.uid()
  );
  RETURN created_team;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='team:duplicate';
END
$$;

CREATE OR REPLACE FUNCTION public.update_team_for_championship(
  p_championship_id uuid, p_team_id uuid, p_name text, p_short_name text DEFAULT NULL,
  p_abbreviation text DEFAULT NULL, p_slug text DEFAULT NULL, p_crest_url text DEFAULT NULL,
  p_cover_url text DEFAULT NULL, p_primary_color text DEFAULT NULL,
  p_secondary_color text DEFAULT NULL, p_city text DEFAULT NULL, p_state text DEFAULT NULL,
  p_neighborhood text DEFAULT NULL, p_foundation_year integer DEFAULT NULL,
  p_category text DEFAULT NULL, p_gender text DEFAULT NULL, p_description text DEFAULT NULL,
  p_history text DEFAULT NULL, p_phone text DEFAULT NULL, p_whatsapp text DEFAULT NULL,
  p_email text DEFAULT NULL, p_instagram text DEFAULT NULL, p_facebook text DEFAULT NULL,
  p_website text DEFAULT NULL, p_registration_number text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL
) RETURNS public.teams
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target_link public.championship_teams%ROWTYPE; updated_team public.teams%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:authentication_required'; END IF;
  SELECT * INTO target_link FROM public.championship_teams
  WHERE championship_id=p_championship_id AND team_id=p_team_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='team:not_found'; END IF;
  IF NOT public.can_administer_org(target_link.organization_id) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:forbidden'; END IF;
  IF nullif(btrim(p_name),'') IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='team:invalid_payload'; END IF;

  UPDATE public.teams SET
    name=btrim(p_name), short_name=nullif(btrim(p_short_name),''), abbreviation=upper(nullif(btrim(p_abbreviation),'')),
    slug=nullif(btrim(p_slug),''), crest_url=nullif(btrim(p_crest_url),''), cover_url=nullif(btrim(p_cover_url),''),
    primary_color=nullif(btrim(p_primary_color),''), secondary_color=nullif(btrim(p_secondary_color),''),
    city=nullif(btrim(p_city),''), state=upper(nullif(btrim(p_state),'')), neighborhood=nullif(btrim(p_neighborhood),''),
    foundation_year=p_foundation_year, category=nullif(btrim(p_category),''), gender=nullif(btrim(p_gender),''),
    description=nullif(btrim(p_description),''), history=nullif(btrim(p_history),''), phone=nullif(btrim(p_phone),''),
    whatsapp=nullif(btrim(p_whatsapp),''), email=lower(nullif(btrim(p_email),'')), instagram=nullif(btrim(p_instagram),''),
    facebook=nullif(btrim(p_facebook),''), website=nullif(btrim(p_website),''),
    registration_number=nullif(btrim(p_registration_number),''), internal_notes=nullif(btrim(p_internal_notes),''), updated_by=auth.uid()
  WHERE id=p_team_id AND organization_id=target_link.organization_id RETURNING * INTO updated_team;
  UPDATE public.championship_teams SET registration_number=nullif(btrim(p_registration_number),''), updated_by=auth.uid()
  WHERE id=target_link.id;
  RETURN updated_team;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='team:duplicate';
END
$$;

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
  UPDATE public.championship_teams SET status=CASE WHEN p_archived THEN 'archived' ELSE 'approved' END,
    archived_at=CASE WHEN p_archived THEN now() ELSE NULL END, updated_by=auth.uid()
  WHERE id=target.id RETURNING * INTO target;
  RETURN target;
END
$$;

CREATE OR REPLACE FUNCTION public.remove_team_from_championship(
  p_championship_id uuid, p_team_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE target public.championship_teams%ROWTYPE; history_count bigint;
BEGIN
  SELECT * INTO target FROM public.championship_teams
  WHERE championship_id=p_championship_id AND team_id=p_team_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='team:not_found'; END IF;
  IF NOT public.can_administer_org(target.organization_id) THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='team:forbidden'; END IF;
  SELECT count(*) INTO history_count FROM public.matches
  WHERE championship_id=p_championship_id AND organization_id=target.organization_id
    AND p_team_id IN (home_team_id, away_team_id);
  IF history_count > 0 THEN
    -- audit_logs ainda nao existe; a tentativa bloqueada permanece como pendencia documentada.
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='team:has_history', HINT='archive_team_instead';
  END IF;
  DELETE FROM public.championship_teams WHERE id=target.id;
END
$$;

REVOKE ALL ON FUNCTION public.create_team_for_championship(uuid,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_team_for_championship(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_team_championship_archived(uuid,uuid,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_team_from_championship(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_team_for_championship(uuid,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_for_championship(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_team_championship_archived(uuid,uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_from_championship(uuid,uuid) TO authenticated;
