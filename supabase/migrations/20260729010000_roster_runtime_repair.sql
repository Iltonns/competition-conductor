-- Repara os RPCs da Etapa 2C que foram sobrecarregados posteriormente por
-- assinaturas legadas incompatíveis com as colunas canônicas.

DROP FUNCTION IF EXISTS public.register_athlete_for_championship(
  uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean
);
DROP FUNCTION IF EXISTS public.add_team_staff_for_championship(
  uuid,uuid,text,text,text,text
);

CREATE OR REPLACE FUNCTION public.register_athlete_for_championship(
  p_championship_id uuid, p_team_id uuid, p_athlete_id uuid DEFAULT NULL,
  p_full_name text DEFAULT NULL, p_birth_date date DEFAULT NULL,
  p_document_type text DEFAULT NULL, p_document_number text DEFAULT NULL,
  p_photo_url text DEFAULT NULL, p_shirt_number integer DEFAULT NULL,
  p_position text DEFAULT NULL, p_is_goalkeeper boolean DEFAULT false,
  p_is_captain boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_link public.championship_teams%ROWTYPE;
  v_settings public.championship_settings%ROWTYPE;
  v_athlete uuid;
  v_count integer;
  v_normalized text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória';
  END IF;

  SELECT * INTO v_link
  FROM public.championship_teams
  WHERE championship_id = p_championship_id
    AND team_id = p_team_id
    AND status <> 'archived'
  FOR UPDATE;

  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN
    RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato';
  END IF;

  SELECT * INTO v_settings
  FROM public.championship_settings
  WHERE championship_id = p_championship_id;

  SELECT count(*) INTO v_count
  FROM public.championship_team_athletes
  WHERE championship_team_id = v_link.id AND active;

  IF v_settings.max_athletes_per_team IS NOT NULL
     AND v_count >= v_settings.max_athletes_per_team THEN
    RAISE EXCEPTION 'Limite de atletas atingido';
  END IF;
  IF (v_settings.registration_starts_at IS NOT NULL
      AND now() < v_settings.registration_starts_at)
     OR (v_settings.registration_ends_at IS NOT NULL
         AND now() > v_settings.registration_ends_at) THEN
    RAISE EXCEPTION 'Inscrições fora do período permitido';
  END IF;

  v_normalized := nullif(
    regexp_replace(coalesce(p_document_number, ''), '[^[:alnum:]]', '', 'g'),
    ''
  );

  IF p_athlete_id IS NULL THEN
    IF nullif(btrim(p_full_name), '') IS NULL THEN
      RAISE EXCEPTION 'Nome obrigatório';
    END IF;
    IF coalesce(v_settings.require_athlete_document, false)
       AND v_normalized IS NULL THEN
      RAISE EXCEPTION 'Documento obrigatório';
    END IF;
    IF coalesce(v_settings.require_athlete_photo, false)
       AND p_photo_url IS NULL THEN
      RAISE EXCEPTION 'Foto obrigatória';
    END IF;

    IF v_normalized IS NOT NULL THEN
      SELECT id INTO v_athlete
      FROM public.athletes
      WHERE organization_id = v_link.organization_id
        AND document_number_normalized = v_normalized
        AND archived_at IS NULL;
    END IF;

    IF v_athlete IS NULL AND p_birth_date IS NOT NULL THEN
      SELECT id INTO v_athlete
      FROM public.athletes
      WHERE organization_id = v_link.organization_id
        AND lower(full_name) = lower(btrim(p_full_name))
        AND birth_date = p_birth_date
        AND archived_at IS NULL
      LIMIT 1;
    END IF;

    IF v_athlete IS NULL THEN
      INSERT INTO public.athletes(
        organization_id, team_id, full_name, birth_date, document_type,
        document_number, photo_url, status, is_goalkeeper, is_captain
      ) VALUES (
        v_link.organization_id, p_team_id, btrim(p_full_name), p_birth_date,
        p_document_type, p_document_number, p_photo_url, 'active',
        coalesce(p_is_goalkeeper, false), coalesce(p_is_captain, false)
      )
      RETURNING id INTO v_athlete;
    END IF;
  ELSE
    SELECT id INTO v_athlete
    FROM public.athletes
    WHERE id = p_athlete_id
      AND organization_id = v_link.organization_id
      AND archived_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Atleta inválido para a organização';
    END IF;
  END IF;

  IF NOT coalesce(v_settings.allow_athlete_multiple_teams, false)
     AND EXISTS (
       SELECT 1
       FROM public.championship_team_athletes
       WHERE championship_id = p_championship_id
         AND athlete_id = v_athlete
         AND team_id <> p_team_id
         AND active
     ) THEN
    RAISE EXCEPTION 'Atleta já inscrito por outra equipe';
  END IF;
  IF coalesce(v_settings.require_shirt_number, false)
     AND p_shirt_number IS NULL THEN
    RAISE EXCEPTION 'Número da camisa obrigatório';
  END IF;
  IF NOT coalesce(v_settings.allow_duplicate_shirt_numbers, false)
     AND p_shirt_number IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.championship_team_athletes
       WHERE championship_team_id = v_link.id
         AND shirt_number = p_shirt_number
         AND active
     ) THEN
    RAISE EXCEPTION 'Número da camisa já utilizado';
  END IF;

  INSERT INTO public.championship_team_athletes(
    organization_id, championship_id, championship_team_id, team_id,
    athlete_id, shirt_number, position, is_goalkeeper, is_captain
  ) VALUES (
    v_link.organization_id, p_championship_id, v_link.id, p_team_id,
    v_athlete, p_shirt_number, nullif(btrim(p_position), ''),
    coalesce(p_is_goalkeeper, false), coalesce(p_is_captain, false)
  );

  RETURN v_athlete;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_team_staff_for_championship(
  p_championship_id uuid, p_team_id uuid, p_full_name text, p_role text,
  p_custom_role text DEFAULT NULL, p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_link public.championship_teams%ROWTYPE;
  v_staff uuid;
  v_limit integer;
  v_count integer;
BEGIN
  SELECT * INTO v_link
  FROM public.championship_teams
  WHERE championship_id = p_championship_id
    AND team_id = p_team_id
    AND status <> 'archived'
  FOR UPDATE;

  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN
    RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato';
  END IF;
  IF nullif(btrim(p_full_name), '') IS NULL OR nullif(btrim(p_role), '') IS NULL THEN
    RAISE EXCEPTION 'Nome e função são obrigatórios';
  END IF;

  SELECT max_staff_per_team INTO v_limit
  FROM public.championship_settings
  WHERE championship_id = p_championship_id;
  SELECT count(*) INTO v_count
  FROM public.championship_team_staff
  WHERE championship_team_id = v_link.id AND active;
  IF v_limit IS NOT NULL AND v_count >= v_limit THEN
    RAISE EXCEPTION 'Limite da comissão atingido';
  END IF;

  INSERT INTO public.team_staff(
    organization_id, team_id, full_name, role, custom_role, phone, email
  ) VALUES (
    v_link.organization_id, p_team_id, btrim(p_full_name), btrim(p_role),
    nullif(btrim(p_custom_role), ''), nullif(btrim(p_phone), ''),
    nullif(lower(btrim(p_email)), '')
  )
  RETURNING id INTO v_staff;

  INSERT INTO public.championship_team_staff(
    organization_id, championship_id, championship_team_id, team_id,
    staff_id, role
  ) VALUES (
    v_link.organization_id, p_championship_id, v_link.id, p_team_id,
    v_staff, btrim(p_role)
  );
  RETURN v_staff;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_team_responsible(
  p_championship_id uuid, p_team_id uuid, p_full_name text, p_role text,
  p_phone text DEFAULT NULL, p_email text DEFAULT NULL,
  p_is_primary boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_link public.championship_teams%ROWTYPE;
  v_id uuid;
BEGIN
  SELECT * INTO v_link
  FROM public.championship_teams
  WHERE championship_id = p_championship_id
    AND team_id = p_team_id
    AND status <> 'archived'
  FOR UPDATE;

  IF NOT FOUND OR NOT public.can_edit_org(v_link.organization_id) THEN
    RAISE EXCEPTION 'Acesso negado ou equipe fora do campeonato';
  END IF;
  IF nullif(btrim(p_full_name), '') IS NULL OR nullif(btrim(p_role), '') IS NULL THEN
    RAISE EXCEPTION 'Nome e função são obrigatórios';
  END IF;

  IF coalesce(p_is_primary, false) THEN
    UPDATE public.team_responsibles
    SET is_primary = false
    WHERE team_id = p_team_id AND is_primary;
  END IF;

  INSERT INTO public.team_responsibles(
    organization_id, team_id, full_name, role, phone, email, is_primary
  ) VALUES (
    v_link.organization_id, p_team_id, btrim(p_full_name), btrim(p_role),
    nullif(btrim(p_phone), ''), nullif(lower(btrim(p_email)), ''),
    coalesce(p_is_primary, false)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Remove permissões e políticas legadas reintroduzidas depois da fundação 2C.
DROP POLICY IF EXISTS "cta member" ON public.championship_team_athletes;
DROP POLICY IF EXISTS "cta public read" ON public.championship_team_athletes;
DROP POLICY IF EXISTS "team_staff member" ON public.team_staff;
DROP POLICY IF EXISTS "cts member" ON public.championship_team_staff;
DROP POLICY IF EXISTS "tr member" ON public.team_responsibles;

REVOKE ALL ON FUNCTION public.register_athlete_for_championship(
  uuid,uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_athlete_for_championship(
  uuid,uuid,uuid,text,date,text,text,text,integer,text,boolean,boolean
) TO authenticated;
REVOKE ALL ON FUNCTION public.add_team_staff_for_championship(
  uuid,uuid,text,text,text,text,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_team_staff_for_championship(
  uuid,uuid,text,text,text,text,text
) TO authenticated;
REVOKE ALL ON FUNCTION public.add_team_responsible(
  uuid,uuid,text,text,text,text,boolean
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_team_responsible(
  uuid,uuid,text,text,text,text,boolean
) TO authenticated;

REVOKE SELECT, INSERT, UPDATE, DELETE
  ON public.championship_team_athletes, public.team_staff,
     public.championship_team_staff, public.team_responsibles
  FROM anon;
REVOKE DELETE
  ON public.championship_team_athletes, public.team_staff,
     public.championship_team_staff, public.team_responsibles
  FROM authenticated;
