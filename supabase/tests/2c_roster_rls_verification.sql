-- Verificacao transacional da Etapa 2C: elenco, comissao e responsaveis.
-- Requer banco Supabase descartavel com todas as migrations aplicadas.
-- Nenhum dado permanece: o script inteiro termina em ROLLBACK.
BEGIN;

DO $$
DECLARE
  user_id uuid;
BEGIN
  FOR user_id IN SELECT unnest(ARRAY[
    '12000000-0000-0000-0000-000000000001'::uuid,
    '12000000-0000-0000-0000-000000000002'::uuid,
    '12000000-0000-0000-0000-000000000003'::uuid
  ]) LOOP
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      user_id::text || '@example.invalid', '', '{}'::jsonb, '{}'::jsonb, now(), now()
    );
  END LOOP;
END
$$;

INSERT INTO public.organizations (id, name, slug, created_by)
VALUES
  ('22000000-0000-0000-0000-000000000001', 'Org Roster A', 'org-roster-a', '12000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000002', 'Org Roster B', 'org-roster-b', '12000000-0000-0000-0000-000000000003');

INSERT INTO public.organization_members (organization_id, user_id)
VALUES
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (organization_id, user_id, role)
VALUES
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', 'owner'),
  ('22000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002', 'viewer'),
  ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000003', 'owner')
ON CONFLICT DO NOTHING;

-- Triggers de auditoria exigem auth.uid mesmo durante a montagem das fixtures.
SELECT set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

INSERT INTO public.championships (id, organization_id, name, slug, status)
VALUES
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Copa Roster A', 'copa-roster-a', 'active'),
  ('32000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'Copa Roster B', 'copa-roster-b', 'active');

INSERT INTO public.championship_settings (championship_id, organization_id)
VALUES
  ('32000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001'),
  ('32000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002')
ON CONFLICT (championship_id) DO NOTHING;

INSERT INTO public.teams (id, organization_id, name, slug)
VALUES
  ('42000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'Equipe Roster A', 'equipe-roster-a'),
  ('42000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 'Equipe Roster B', 'equipe-roster-b');

INSERT INTO public.championship_teams (
  id, organization_id, championship_id, team_id, status
) VALUES
  ('52000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'active'),
  ('52000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000002', 'active');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Owner cria atleta, comissao e responsavel por RPCs que derivam o tenant.
SELECT public.register_athlete_for_championship(
  p_championship_id => '32000000-0000-0000-0000-000000000001',
  p_team_id => '42000000-0000-0000-0000-000000000001',
  p_full_name => 'Atleta RLS',
  p_birth_date => '2000-01-01',
  p_shirt_number => 10
);
SELECT public.add_team_staff_for_championship(
  '32000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  'Tecnico RLS', 'coach'
);
SELECT public.add_team_responsible(
  '32000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  'Responsavel RLS', 'president', p_is_primary => true
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.championship_team_athletes
    WHERE championship_id = '32000000-0000-0000-0000-000000000001'
      AND organization_id = '22000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'FAIL: atleta nao foi vinculado ao campeonato correto';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.championship_team_staff
    WHERE championship_id = '32000000-0000-0000-0000-000000000001'
      AND organization_id = '22000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'FAIL: comissao nao foi vinculada ao campeonato correto';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.team_responsibles
    WHERE team_id = '42000000-0000-0000-0000-000000000001'
      AND organization_id = '22000000-0000-0000-0000-000000000001'
      AND is_primary
  ) THEN
    RAISE EXCEPTION 'FAIL: responsavel principal nao foi criado';
  END IF;
END
$$;

-- Viewer pode ler o tenant, mas nao pode executar mutacoes.
SELECT set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000002', true);
SELECT set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$
DECLARE
  blocked boolean := false;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.championship_team_athletes
    WHERE championship_id = '32000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'FAIL: viewer nao consegue ler o elenco do proprio tenant';
  END IF;
  BEGIN
    PERFORM public.add_team_responsible(
      '32000000-0000-0000-0000-000000000001',
      '42000000-0000-0000-0000-000000000001',
      'Viewer Bloqueado', 'contact'
    );
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: viewer alterou responsaveis';
  END IF;
END
$$;

-- Outro tenant nao pode ler nem mutar o elenco da organizacao A.
SELECT set_config('request.jwt.claim.sub', '12000000-0000-0000-0000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$
DECLARE
  blocked boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.championship_team_athletes
    WHERE championship_id = '32000000-0000-0000-0000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.championship_team_staff
    WHERE championship_id = '32000000-0000-0000-0000-000000000001'
  ) OR EXISTS (
    SELECT 1 FROM public.team_responsibles
    WHERE team_id = '42000000-0000-0000-0000-000000000001'
  ) THEN
    RAISE EXCEPTION 'FAIL: leitura cross-tenant no roster';
  END IF;
  BEGIN
    PERFORM public.register_athlete_for_championship(
      p_championship_id => '32000000-0000-0000-0000-000000000001',
      p_team_id => '42000000-0000-0000-0000-000000000001',
      p_full_name => 'Cross Tenant'
    );
  EXCEPTION WHEN OTHERS THEN
    blocked := true;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'FAIL: mutacao cross-tenant no roster';
  END IF;
END
$$;

RESET ROLE;

-- Anon nao recebe acesso direto a tabelas com dados pessoais.
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.athletes', 'SELECT')
    OR has_table_privilege('anon', 'public.championship_team_athletes', 'SELECT')
    OR has_table_privilege('anon', 'public.team_staff', 'SELECT')
    OR has_table_privilege('anon', 'public.championship_team_staff', 'SELECT')
    OR has_table_privilege('anon', 'public.team_responsibles', 'SELECT')
  THEN
    RAISE EXCEPTION 'FAIL: anon possui leitura direta de dados pessoais do roster';
  END IF;
END
$$;

ROLLBACK;
