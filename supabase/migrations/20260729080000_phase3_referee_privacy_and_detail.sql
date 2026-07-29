-- Fase 3 / F3-RF04: restringe dados pessoais de arbitros e fornece detalhe
-- administrativo contextual ao campeonato.

REVOKE SELECT ON TABLE public.referees FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  organization_id,
  full_name,
  default_role,
  photo_url,
  status
) ON TABLE public.referees TO authenticated;

CREATE OR REPLACE FUNCTION public.get_referee_management_detail(
  p_championship_id uuid,
  p_referee_id uuid
)
RETURNS public.referees
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_organization_id uuid;
  result public.referees%ROWTYPE;
BEGIN
  IF p_referee_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'sports:invalid_referee';
  END IF;

  target_organization_id := public.phase2_championship_org(p_championship_id);

  SELECT referee.*
  INTO result
  FROM public.referees referee
  WHERE referee.id = p_referee_id
    AND referee.organization_id = target_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'sports:referee_not_found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_referee_management_detail(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referee_management_detail(uuid, uuid)
  TO authenticated;
