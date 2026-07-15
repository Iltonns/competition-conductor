-- Etapa 2A: fundacao de campeonatos, reparo de RLS e operacoes atomicas.
-- Migration aditiva. O bloco de preflight interrompe a execucao antes de criar
-- constraints caso encontre dados legados inconsistentes.

-- ---------------------------------------------------------------------------
-- Preflight de integridade dos dados existentes (somente leitura)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  invalid_count bigint;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM public.championships
  WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % campeonato(s) com data final anterior a inicial', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.teams t
  JOIN public.championships c ON c.id = t.championship_id
  WHERE t.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % equipe(s) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.athletes a
  JOIN public.teams t ON t.id = a.team_id
  WHERE a.organization_id <> t.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % atleta(s) vinculado(s) a equipe de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.matches m
  JOIN public.championships c ON c.id = m.championship_id
  WHERE m.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % partida(s) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.matches m
  JOIN public.teams t ON t.id IN (m.home_team_id, m.away_team_id)
  WHERE m.organization_id <> t.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % vinculo(s) partida/equipe entre organizacoes distintas', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.match_events e
  JOIN public.matches m ON m.id = e.match_id
  WHERE e.organization_id <> m.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % evento(s) vinculado(s) a partida de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.match_events e
  JOIN public.teams t ON t.id = e.team_id
  WHERE e.organization_id <> t.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % evento(s) vinculado(s) a equipe de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.match_events e
  JOIN public.athletes a ON a.id = e.athlete_id
  WHERE e.organization_id <> a.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % evento(s) vinculado(s) a atleta de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.sponsors s
  JOIN public.championships c ON c.id = s.championship_id
  WHERE s.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % patrocinador(es) vinculado(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.news n
  JOIN public.championships c ON c.id = n.championship_id
  WHERE n.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % noticia(s) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Helpers de autorizacao: nenhum user_id/role confiado ao cliente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_members AS member
      WHERE member.organization_id = _org
        AND member.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(_org uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_org_member(_org)
    AND EXISTS (
      SELECT 1
      FROM public.user_roles AS user_role
      WHERE user_role.organization_id = _org
        AND user_role.user_id = auth.uid()
        AND user_role.role = _role
    );
$$;

CREATE OR REPLACE FUNCTION public.can_administer_org(_org uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND public.is_org_member(_org)
    AND EXISTS (
      SELECT 1
      FROM public.user_roles AS user_role
      WHERE user_role.organization_id = _org
        AND user_role.user_id = auth.uid()
        AND user_role.role IN ('owner'::public.app_role, 'admin'::public.app_role, 'editor'::public.app_role)
    );
$$;

-- Mantem compatibilidade com policies remotas legadas sem confiar apenas em role.
CREATE OR REPLACE FUNCTION public.can_edit_org(p_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.can_administer_org(p_organization_id);
$$;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_administer_org(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit_org(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_administer_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_org(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Auditoria no servidor
-- ---------------------------------------------------------------------------
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.championships ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.tg_set_admin_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
    NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by, NEW.created_by);
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.updated_by := COALESCE(auth.uid(), OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_set_admin_audit_fields() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_prevent_organization_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization_id:is_immutable';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.tg_prevent_organization_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'organizations', 'championships', 'teams', 'athletes', 'matches',
    'match_events', 'sponsors', 'news'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target_table || '_admin_audit', target_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields()',
      target_table || '_admin_audit', target_table
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Integridade multi-tenant para estruturas existentes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championships_id_organization_key') THEN
    ALTER TABLE public.championships
      ADD CONSTRAINT championships_id_organization_key UNIQUE (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_id_organization_key') THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT teams_id_organization_key UNIQUE (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_id_organization_key') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_id_organization_key UNIQUE (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'athletes_id_organization_key') THEN
    ALTER TABLE public.athletes
      ADD CONSTRAINT athletes_id_organization_key UNIQUE (id, organization_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_championship_same_org_fkey') THEN
    ALTER TABLE public.teams
      ADD CONSTRAINT teams_championship_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'athletes_team_same_org_fkey') THEN
    ALTER TABLE public.athletes
      ADD CONSTRAINT athletes_team_same_org_fkey
      FOREIGN KEY (team_id, organization_id)
      REFERENCES public.teams (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_championship_same_org_fkey') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_championship_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_home_team_same_org_fkey') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_home_team_same_org_fkey
      FOREIGN KEY (home_team_id, organization_id)
      REFERENCES public.teams (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_away_team_same_org_fkey') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_away_team_same_org_fkey
      FOREIGN KEY (away_team_id, organization_id)
      REFERENCES public.teams (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_events_match_same_org_fkey') THEN
    ALTER TABLE public.match_events
      ADD CONSTRAINT match_events_match_same_org_fkey
      FOREIGN KEY (match_id, organization_id)
      REFERENCES public.matches (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_events_team_same_org_fkey') THEN
    ALTER TABLE public.match_events
      ADD CONSTRAINT match_events_team_same_org_fkey
      FOREIGN KEY (team_id, organization_id)
      REFERENCES public.teams (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_events_athlete_same_org_fkey') THEN
    ALTER TABLE public.match_events
      ADD CONSTRAINT match_events_athlete_same_org_fkey
      FOREIGN KEY (athlete_id, organization_id)
      REFERENCES public.athletes (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sponsors_championship_same_org_fkey') THEN
    ALTER TABLE public.sponsors
      ADD CONSTRAINT sponsors_championship_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_championship_same_org_fkey') THEN
    ALTER TABLE public.news
      ADD CONSTRAINT news_championship_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championships_dates_check') THEN
    ALTER TABLE public.championships
      ADD CONSTRAINT championships_dates_check
      CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Estruturas consumidas pelo frontend
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.championship_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL,
  competition_format text NOT NULL DEFAULT 'round_robin',
  legs smallint NOT NULL DEFAULT 1,
  group_count integer,
  qualifiers_per_group integer,
  third_place_match boolean NOT NULL DEFAULT false,
  points_win integer NOT NULL DEFAULT 3,
  points_draw integer NOT NULL DEFAULT 1,
  points_loss integer NOT NULL DEFAULT 0,
  tiebreakers text[] NOT NULL DEFAULT ARRAY[
    'points', 'wins', 'goal_difference', 'goals_for', 'head_to_head', 'fair_play', 'draw'
  ],
  allow_draw boolean NOT NULL DEFAULT true,
  uses_extra_time boolean NOT NULL DEFAULT false,
  uses_penalties boolean NOT NULL DEFAULT true,
  wo_score_for integer NOT NULL DEFAULT 3,
  wo_score_against integer NOT NULL DEFAULT 0,
  minimum_rest_hours integer NOT NULL DEFAULT 24,
  max_athletes_per_team integer,
  yellow_cards_for_suspension integer NOT NULL DEFAULT 3,
  public_theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  custom_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT championship_settings_championship_unique UNIQUE (championship_id),
  CONSTRAINT championship_settings_same_org_fkey
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT championship_settings_points_check
    CHECK (points_win >= 0 AND points_draw >= 0 AND points_loss >= 0),
  CONSTRAINT championship_settings_competition_format_check
    CHECK (competition_format IN ('round_robin', 'groups_knockout', 'knockout', 'custom')),
  CONSTRAINT championship_settings_legs_check CHECK (legs IN (1, 2)),
  CONSTRAINT championship_settings_group_count_check CHECK (group_count IS NULL OR group_count > 0),
  CONSTRAINT championship_settings_qualifiers_per_group_check
    CHECK (qualifiers_per_group IS NULL OR qualifiers_per_group > 0),
  CONSTRAINT championship_settings_wo_score_for_check CHECK (wo_score_for >= 0),
  CONSTRAINT championship_settings_wo_score_against_check CHECK (wo_score_against >= 0),
  CONSTRAINT championship_settings_minimum_rest_hours_check CHECK (minimum_rest_hours >= 0),
  CONSTRAINT championship_settings_max_athletes_per_team_check
    CHECK (max_athletes_per_team IS NULL OR max_athletes_per_team > 0),
  CONSTRAINT championship_settings_yellow_cards_for_suspension_check
    CHECK (yellow_cards_for_suspension > 0)
);

CREATE TABLE IF NOT EXISTS public.championship_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  gender text NOT NULL DEFAULT 'open',
  minimum_age integer,
  maximum_age integer,
  status text NOT NULL DEFAULT 'active',
  starts_at date,
  ends_at date,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT championship_categories_same_org_fkey
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT championship_categories_name_unique UNIQUE (championship_id, name),
  CONSTRAINT championship_categories_status_check CHECK (status IN ('active', 'inactive', 'archived')),
  CONSTRAINT championship_categories_gender_check CHECK (gender IN ('male', 'female', 'mixed', 'open')),
  CONSTRAINT championship_categories_minimum_age_check CHECK (minimum_age IS NULL OR minimum_age >= 0),
  CONSTRAINT championship_categories_maximum_age_check
    CHECK (maximum_age IS NULL OR (maximum_age >= 0 AND (minimum_age IS NULL OR maximum_age >= minimum_age)))
);

CREATE TABLE IF NOT EXISTS public.competition_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL,
  category_id uuid REFERENCES public.championship_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  stage_type text NOT NULL,
  sequence integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at date,
  ends_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT competition_stages_same_org_fkey
    FOREIGN KEY (championship_id, organization_id)
    REFERENCES public.championships(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT competition_stages_sequence_check CHECK (sequence > 0),
  CONSTRAINT competition_stages_stage_type_check
    CHECK (stage_type IN ('league', 'groups', 'knockout', 'custom')),
  CONSTRAINT competition_stages_status_check
    CHECK (status IN ('draft', 'scheduled', 'active', 'finished', 'archived')),
  CONSTRAINT competition_stages_dates_check
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at)
);

-- CREATE TABLE IF NOT EXISTS nao reconcilia constraints de tabelas ja existentes.
-- Este bloco adiciona apenas as chaves compostas validadas pela auditoria previa.
DO $$
DECLARE
  invalid_count bigint;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM public.championship_settings s
  JOIN public.championships c ON c.id = s.championship_id
  WHERE s.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % configuracao(oes) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.championship_categories category
  JOIN public.championships c ON c.id = category.championship_id
  WHERE category.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % categoria(s) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.championship_categories
  WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % categoria(s) com data final anterior a inicial', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.competition_stages stage
  JOIN public.championships c ON c.id = stage.championship_id
  WHERE stage.organization_id <> c.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % fase(s) vinculada(s) a campeonato de outra organizacao', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.competition_stages
  WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % fase(s) com data final anterior a inicial', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.competition_stages stage
  JOIN public.championship_categories category ON category.id = stage.category_id
  WHERE stage.organization_id <> category.organization_id;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'etapa_2a: % fase(s) vinculada(s) a categoria de outra organizacao', invalid_count;
  END IF;

  IF to_regclass('public.championship_teams') IS NOT NULL THEN
    EXECUTE $query$
      SELECT count(*)
      FROM public.championship_teams registration
      JOIN public.championships c ON c.id = registration.championship_id
      JOIN public.teams team ON team.id = registration.team_id
      LEFT JOIN public.championship_categories category ON category.id = registration.category_id
      WHERE registration.organization_id <> c.organization_id
         OR registration.organization_id <> team.organization_id
         OR (category.id IS NOT NULL AND registration.organization_id <> category.organization_id)
    $query$ INTO invalid_count;
    IF invalid_count > 0 THEN
      RAISE EXCEPTION 'etapa_2a: % inscricao(oes) de equipe com vinculo entre organizacoes', invalid_count;
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_categories_id_organization_key') THEN
    ALTER TABLE public.championship_categories
      ADD CONSTRAINT championship_categories_id_organization_key UNIQUE (id, organization_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_settings_same_org_fkey') THEN
    ALTER TABLE public.championship_settings
      ADD CONSTRAINT championship_settings_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_settings_points_check') THEN
    ALTER TABLE public.championship_settings
      ADD CONSTRAINT championship_settings_points_check
      CHECK (points_win >= 0 AND points_draw >= 0 AND points_loss >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_categories_same_org_fkey') THEN
    ALTER TABLE public.championship_categories
      ADD CONSTRAINT championship_categories_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_categories_dates_check') THEN
    ALTER TABLE public.championship_categories
      ADD CONSTRAINT championship_categories_dates_check
      CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competition_stages_same_org_fkey') THEN
    ALTER TABLE public.competition_stages
      ADD CONSTRAINT competition_stages_same_org_fkey
      FOREIGN KEY (championship_id, organization_id)
      REFERENCES public.championships (id, organization_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competition_stages_dates_check') THEN
    ALTER TABLE public.competition_stages
      ADD CONSTRAINT competition_stages_dates_check
      CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'competition_stages_category_same_org_fkey') THEN
    ALTER TABLE public.competition_stages
      ADD CONSTRAINT competition_stages_category_same_org_fkey
      FOREIGN KEY (category_id, organization_id)
      REFERENCES public.championship_categories (id, organization_id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.championship_teams') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_championship_same_org_fkey') THEN
      ALTER TABLE public.championship_teams
        ADD CONSTRAINT championship_teams_championship_same_org_fkey
        FOREIGN KEY (championship_id, organization_id)
        REFERENCES public.championships (id, organization_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_team_same_org_fkey') THEN
      ALTER TABLE public.championship_teams
        ADD CONSTRAINT championship_teams_team_same_org_fkey
        FOREIGN KEY (team_id, organization_id)
        REFERENCES public.teams (id, organization_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'championship_teams_category_same_org_fkey') THEN
      ALTER TABLE public.championship_teams
        ADD CONSTRAINT championship_teams_category_same_org_fkey
        FOREIGN KEY (category_id, organization_id)
        REFERENCES public.championship_categories (id, organization_id) ON DELETE CASCADE;
    END IF;
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competition_stages TO authenticated;
GRANT SELECT ON public.championship_categories, public.competition_stages TO anon;
GRANT ALL ON public.championship_settings, public.championship_categories, public.competition_stages TO service_role;

ALTER TABLE public.championship_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_stages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS championships_organization_created_idx
  ON public.championships (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS championships_organization_status_idx
  ON public.championships (organization_id, status);
CREATE INDEX IF NOT EXISTS championships_organization_slug_idx
  ON public.championships (organization_id, slug);
CREATE INDEX IF NOT EXISTS teams_organization_championship_idx
  ON public.teams (organization_id, championship_id);
CREATE INDEX IF NOT EXISTS teams_organization_status_idx
  ON public.teams (organization_id, status);
CREATE INDEX IF NOT EXISTS athletes_organization_team_idx
  ON public.athletes (organization_id, team_id);
CREATE INDEX IF NOT EXISTS athletes_organization_status_idx
  ON public.athletes (organization_id, status);
CREATE INDEX IF NOT EXISTS matches_organization_championship_scheduled_idx
  ON public.matches (organization_id, championship_id, scheduled_at);
CREATE INDEX IF NOT EXISTS matches_organization_status_idx
  ON public.matches (organization_id, status);
CREATE INDEX IF NOT EXISTS championship_settings_organization_idx
  ON public.championship_settings (organization_id);
CREATE INDEX IF NOT EXISTS championship_categories_organization_championship_idx
  ON public.championship_categories (organization_id, championship_id);
CREATE INDEX IF NOT EXISTS competition_stages_organization_championship_status_idx
  ON public.competition_stages (organization_id, championship_id, status);

DROP TRIGGER IF EXISTS championship_settings_updated_at ON public.championship_settings;
DROP TRIGGER IF EXISTS trg_championship_settings_updated_at ON public.championship_settings;
CREATE TRIGGER trg_championship_settings_updated_at
  BEFORE UPDATE ON public.championship_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS championship_categories_updated_at ON public.championship_categories;
DROP TRIGGER IF EXISTS trg_championship_categories_updated_at ON public.championship_categories;
CREATE TRIGGER trg_championship_categories_updated_at
  BEFORE UPDATE ON public.championship_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
DROP TRIGGER IF EXISTS competition_stages_updated_at ON public.competition_stages;
DROP TRIGGER IF EXISTS trg_competition_stages_updated_at ON public.competition_stages;
CREATE TRIGGER trg_competition_stages_updated_at
  BEFORE UPDATE ON public.competition_stages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS championship_settings_admin_audit ON public.championship_settings;
CREATE TRIGGER championship_settings_admin_audit
  BEFORE INSERT OR UPDATE ON public.championship_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();
DROP TRIGGER IF EXISTS championship_categories_admin_audit ON public.championship_categories;
CREATE TRIGGER championship_categories_admin_audit
  BEFORE INSERT OR UPDATE ON public.championship_categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();
DROP TRIGGER IF EXISTS competition_stages_admin_audit ON public.competition_stages;
CREATE TRIGGER competition_stages_admin_audit
  BEFORE INSERT OR UPDATE ON public.competition_stages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'championships', 'teams', 'athletes', 'matches', 'match_events', 'sponsors',
    'news', 'championship_settings', 'championship_categories', 'competition_stages'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target_table || '_organization_immutable', target_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_organization_change()',
      target_table || '_organization_immutable', target_table
    );
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.championship_teams') IS NOT NULL THEN
    ALTER TABLE public.championship_teams ENABLE ROW LEVEL SECURITY;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.championship_teams TO authenticated;
    GRANT SELECT ON public.championship_teams TO anon;
    GRANT ALL ON public.championship_teams TO service_role;

    DROP TRIGGER IF EXISTS championship_teams_admin_audit ON public.championship_teams;
    CREATE TRIGGER championship_teams_admin_audit
      BEFORE INSERT OR UPDATE ON public.championship_teams
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_admin_audit_fields();
    DROP TRIGGER IF EXISTS championship_teams_organization_immutable ON public.championship_teams;
    CREATE TRIGGER championship_teams_organization_immutable
      BEFORE UPDATE ON public.championship_teams
      FOR EACH ROW EXECUTE FUNCTION public.tg_prevent_organization_change();
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Policies: leitura por membro/publicacao e escrita por papel administrativo
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "org read own" ON public.organizations;
DROP POLICY IF EXISTS "org insert self" ON public.organizations;
DROP POLICY IF EXISTS "org update owner" ON public.organizations;
DROP POLICY IF EXISTS "members read own org" ON public.organization_members;
DROP POLICY IF EXISTS "members owner manage" ON public.organization_members;
DROP POLICY IF EXISTS "roles read own org" ON public.user_roles;
DROP POLICY IF EXISTS "organizations_member_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_authenticated_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_admin_update" ON public.organizations;
DROP POLICY IF EXISTS "organization_members_member_select" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_owner_insert" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_owner_update" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_owner_delete" ON public.organization_members;
DROP POLICY IF EXISTS "user_roles_member_select" ON public.user_roles;

CREATE POLICY "organizations_member_select" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "organizations_authenticated_insert" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "organizations_admin_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.current_user_has_role(id, 'owner') OR public.current_user_has_role(id, 'admin'))
  WITH CHECK (public.current_user_has_role(id, 'owner') OR public.current_user_has_role(id, 'admin'));
CREATE POLICY "organization_members_member_select" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "organization_members_owner_insert" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_role(organization_id, 'owner'));
CREATE POLICY "organization_members_owner_update" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.current_user_has_role(organization_id, 'owner'))
  WITH CHECK (public.current_user_has_role(organization_id, 'owner'));
CREATE POLICY "organization_members_owner_delete" ON public.organization_members
  FOR DELETE TO authenticated USING (public.current_user_has_role(organization_id, 'owner'));
CREATE POLICY "user_roles_member_select" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

DO $$
DECLARE
  table_name text;
  old_policy text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['championships', 'teams', 'athletes', 'matches', 'match_events']
  LOOP
    FOREACH old_policy IN ARRAY ARRAY[
      CASE table_name
        WHEN 'championships' THEN 'champ member read'
        WHEN 'match_events' THEN 'events member read'
        ELSE replace(table_name, 'matches', 'matches') || ' member read'
      END,
      CASE table_name
        WHEN 'championships' THEN 'champ public read'
        WHEN 'match_events' THEN 'events public read'
        ELSE replace(table_name, 'matches', 'matches') || ' public read'
      END,
      CASE table_name
        WHEN 'championships' THEN 'champ member write'
        WHEN 'match_events' THEN 'events member write'
        ELSE replace(table_name, 'matches', 'matches') || ' member write'
      END
    ]
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', old_policy, table_name);
    END LOOP;
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "championships_member_select" ON public.championships;
DROP POLICY IF EXISTS "championships_public_select" ON public.championships;
DROP POLICY IF EXISTS "championships_admin_insert" ON public.championships;
DROP POLICY IF EXISTS "championships_admin_update" ON public.championships;
CREATE POLICY "championships_member_select" ON public.championships
  FOR SELECT TO authenticated USING (
    public.is_org_member(organization_id) OR (is_public AND status <> 'draft')
  );
CREATE POLICY "championships_public_select" ON public.championships
  FOR SELECT TO anon, authenticated USING (is_public AND status <> 'draft');
CREATE POLICY "championships_admin_insert" ON public.championships
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "championships_admin_update" ON public.championships
  FOR UPDATE TO authenticated
  USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
-- Sem policy DELETE: exclusao somente pela RPC atomica definida abaixo.

DROP POLICY IF EXISTS "teams_member_select" ON public.teams;
DROP POLICY IF EXISTS "teams_public_select" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_delete" ON public.teams;
CREATE POLICY "teams_member_select" ON public.teams
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "teams_public_select" ON public.teams
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = teams.championship_id AND c.organization_id = teams.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
CREATE POLICY "teams_admin_insert" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "teams_admin_update" ON public.teams
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "teams_admin_delete" ON public.teams
  FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));

DROP POLICY IF EXISTS "athletes_member_select" ON public.athletes;
DROP POLICY IF EXISTS "athletes_public_select" ON public.athletes;
DROP POLICY IF EXISTS "athletes_admin_insert" ON public.athletes;
DROP POLICY IF EXISTS "athletes_admin_update" ON public.athletes;
DROP POLICY IF EXISTS "athletes_admin_delete" ON public.athletes;
CREATE POLICY "athletes_member_select" ON public.athletes
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "athletes_public_select" ON public.athletes
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.championships c ON c.id = t.championship_id AND c.organization_id = t.organization_id
    WHERE t.id = athletes.team_id AND t.organization_id = athletes.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
CREATE POLICY "athletes_admin_insert" ON public.athletes
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "athletes_admin_update" ON public.athletes
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "athletes_admin_delete" ON public.athletes
  FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));

DROP POLICY IF EXISTS "matches_member_select" ON public.matches;
DROP POLICY IF EXISTS "matches_public_select" ON public.matches;
DROP POLICY IF EXISTS "matches_admin_insert" ON public.matches;
DROP POLICY IF EXISTS "matches_admin_update" ON public.matches;
CREATE POLICY "matches_member_select" ON public.matches
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "matches_public_select" ON public.matches
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = matches.championship_id AND c.organization_id = matches.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
CREATE POLICY "matches_admin_insert" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "matches_admin_update" ON public.matches
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
-- Sem DELETE direto para preservar historico e eventos.

DROP POLICY IF EXISTS "match_events_member_select" ON public.match_events;
DROP POLICY IF EXISTS "match_events_public_select" ON public.match_events;
DROP POLICY IF EXISTS "match_events_admin_insert" ON public.match_events;
DROP POLICY IF EXISTS "match_events_admin_update" ON public.match_events;
DROP POLICY IF EXISTS "match_events_admin_delete" ON public.match_events;
CREATE POLICY "match_events_member_select" ON public.match_events
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "match_events_public_select" ON public.match_events
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.championships c ON c.id = m.championship_id AND c.organization_id = m.organization_id
    WHERE m.id = match_events.match_id AND m.organization_id = match_events.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
CREATE POLICY "match_events_admin_insert" ON public.match_events
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "match_events_admin_update" ON public.match_events
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "match_events_admin_delete" ON public.match_events
  FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));

DROP POLICY IF EXISTS "sponsors member read" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors public read" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors member write" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_member_select" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_public_select" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_admin_insert" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_admin_update" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_admin_delete" ON public.sponsors;
CREATE POLICY "sponsors_member_select" ON public.sponsors
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "sponsors_public_select" ON public.sponsors
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = sponsors.championship_id AND c.organization_id = sponsors.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
CREATE POLICY "sponsors_admin_insert" ON public.sponsors
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "sponsors_admin_update" ON public.sponsors
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "sponsors_admin_delete" ON public.sponsors
  FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));

DROP POLICY IF EXISTS "news member read" ON public.news;
DROP POLICY IF EXISTS "news public read" ON public.news;
DROP POLICY IF EXISTS "news member write" ON public.news;
DROP POLICY IF EXISTS "news_member_select" ON public.news;
DROP POLICY IF EXISTS "news_public_select" ON public.news;
DROP POLICY IF EXISTS "news_admin_insert" ON public.news;
DROP POLICY IF EXISTS "news_admin_update" ON public.news;
DROP POLICY IF EXISTS "news_admin_delete" ON public.news;
CREATE POLICY "news_member_select" ON public.news
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "news_public_select" ON public.news
  FOR SELECT TO anon, authenticated USING (
    published_at IS NOT NULL AND published_at <= now() AND EXISTS (
      SELECT 1 FROM public.championships c
      WHERE c.id = news.championship_id AND c.organization_id = news.organization_id
        AND c.is_public AND c.status <> 'draft'
    )
  );
CREATE POLICY "news_admin_insert" ON public.news
  FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "news_admin_update" ON public.news
  FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id))
  WITH CHECK (public.can_administer_org(organization_id));
CREATE POLICY "news_admin_delete" ON public.news
  FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['championship_settings', 'championship_categories', 'competition_stages']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_editor_write', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_member_select', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_admin_insert', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_admin_update', table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_admin_delete', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))',
      table_name || '_member_select', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_administer_org(organization_id))',
      table_name || '_admin_insert', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_administer_org(organization_id)) WITH CHECK (public.can_administer_org(organization_id))',
      table_name || '_admin_update', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_administer_org(organization_id))',
      table_name || '_admin_delete', table_name
    );
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.championship_teams') IS NOT NULL THEN
    DROP POLICY IF EXISTS "championship_teams_editor_write" ON public.championship_teams;
    DROP POLICY IF EXISTS "championship_teams_member_select" ON public.championship_teams;
    DROP POLICY IF EXISTS "championship_teams_public_select" ON public.championship_teams;
    DROP POLICY IF EXISTS "championship_teams_admin_insert" ON public.championship_teams;
    DROP POLICY IF EXISTS "championship_teams_admin_update" ON public.championship_teams;
    DROP POLICY IF EXISTS "championship_teams_admin_delete" ON public.championship_teams;

    CREATE POLICY "championship_teams_member_select" ON public.championship_teams
      FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
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
    CREATE POLICY "championship_teams_admin_delete" ON public.championship_teams
      FOR DELETE TO authenticated USING (public.can_administer_org(organization_id));
  END IF;
END
$$;

DROP POLICY IF EXISTS "championship_categories_public_select" ON public.championship_categories;
CREATE POLICY "championship_categories_public_select" ON public.championship_categories
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = championship_categories.championship_id
      AND c.organization_id = championship_categories.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));
DROP POLICY IF EXISTS "competition_stages_public_select" ON public.competition_stages;
CREATE POLICY "competition_stages_public_select" ON public.competition_stages
  FOR SELECT TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.championships c
    WHERE c.id = competition_stages.championship_id
      AND c.organization_id = competition_stages.organization_id
      AND c.is_public AND c.status <> 'draft'
  ));

-- ---------------------------------------------------------------------------
-- RPCs transacionais e contextuais
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_championship_context(p_championship_id uuid)
RETURNS public.championships
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result public.championships%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:authentication_required';
  END IF;

  SELECT * INTO result FROM public.championships WHERE id = p_championship_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship:not_found';
  END IF;
  IF NOT public.is_org_member(result.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:forbidden';
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_championship(
  p_organization_id uuid,
  p_name text,
  p_slug text,
  p_season text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_starts_at date DEFAULT NULL,
  p_ends_at date DEFAULT NULL,
  p_is_public boolean DEFAULT false,
  p_category_name text DEFAULT 'Categoria Principal',
  p_create_initial_stage boolean DEFAULT true
)
RETURNS public.championships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  created public.championships%ROWTYPE;
  candidate_slug text := lower(trim(p_slug));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:authentication_required';
  END IF;
  IF NOT public.is_org_member(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:invalid_organization';
  END IF;
  IF NOT public.can_administer_org(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:forbidden';
  END IF;
  IF char_length(trim(p_name)) < 3 OR char_length(trim(p_name)) > 160 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship:invalid_payload';
  END IF;
  IF candidate_slug = '' OR candidate_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship:invalid_slug';
  END IF;
  IF p_starts_at IS NOT NULL AND p_ends_at IS NOT NULL AND p_ends_at < p_starts_at THEN
    RAISE EXCEPTION USING ERRCODE = '22007', MESSAGE = 'championship:invalid_dates';
  END IF;

  WHILE EXISTS (SELECT 1 FROM public.championships WHERE slug = candidate_slug) LOOP
    candidate_slug := left(lower(trim(p_slug)), 91) || '-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  INSERT INTO public.championships (
    organization_id, name, slug, season, description, starts_at, ends_at,
    is_public, created_by, updated_by
  ) VALUES (
    p_organization_id, trim(p_name), candidate_slug, nullif(trim(p_season), ''),
    nullif(trim(p_description), ''), p_starts_at, p_ends_at, p_is_public,
    auth.uid(), auth.uid()
  ) RETURNING * INTO created;

  INSERT INTO public.championship_settings (
    organization_id, championship_id, created_by, updated_by
  ) VALUES (p_organization_id, created.id, auth.uid(), auth.uid())
  ON CONFLICT (championship_id) DO NOTHING;

  IF nullif(trim(p_category_name), '') IS NOT NULL THEN
    INSERT INTO public.championship_categories (
      organization_id, championship_id, name, created_by, updated_by
    ) VALUES (p_organization_id, created.id, trim(p_category_name), auth.uid(), auth.uid());
  END IF;

  IF p_create_initial_stage THEN
    INSERT INTO public.competition_stages (
      organization_id, championship_id, name, stage_type, sequence, status,
      starts_at, ends_at, created_by, updated_by
    ) VALUES (
      p_organization_id, created.id, 'Fase inicial', 'league', 1, 'draft',
      p_starts_at, p_ends_at, auth.uid(), auth.uid()
    );
  END IF;

  RETURN created;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'championship:duplicate_slug';
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_championship(p_championship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target public.championships%ROWTYPE;
  match_count bigint;
  team_count bigint;
  registration_count bigint := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:authentication_required';
  END IF;

  SELECT * INTO target
  FROM public.championships
  WHERE id = p_championship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship:not_found';
  END IF;
  IF NOT public.can_administer_org(target.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship:forbidden';
  END IF;

  SELECT count(*) INTO match_count
  FROM public.matches
  WHERE championship_id = target.id AND organization_id = target.organization_id;
  SELECT count(*) INTO team_count
  FROM public.teams
  WHERE championship_id = target.id AND organization_id = target.organization_id;

  IF to_regclass('public.championship_teams') IS NOT NULL THEN
    EXECUTE
      'SELECT count(*) FROM public.championship_teams WHERE championship_id = $1 AND organization_id = $2'
      INTO registration_count
      USING target.id, target.organization_id;
  END IF;

  IF match_count > 0 OR team_count > 0 OR registration_count > 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'championship:has_dependencies',
      DETAIL = format(
        'matches=%s;teams=%s;championship_teams=%s',
        match_count, team_count, registration_count
      ),
      HINT = 'archive_championship_instead';
  END IF;

  DELETE FROM public.championships WHERE id = target.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_championship_context(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_championship(uuid, text, text, text, text, date, date, boolean, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_championship(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_championship_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_championship(uuid, text, text, text, text, date, date, boolean, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_championship(uuid) TO authenticated;

-- Helpers internos/trigger functions nunca sao executados diretamente por clientes.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
DO $$
DECLARE
  function_signature text;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.audit_row_changes()',
    'public.ensure_championship_settings()',
    'public.recalculate_standings_after_match()'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        function_signature
      );
    END IF;
  END LOOP;
END
$$;
