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

-- 'approved' e o vocabulario real da coluna. 'active' nunca foi aceito pelo
-- check constraint; a fixture so nao acusava porque este script nunca rodou.
INSERT INTO public.championship_teams (
  id, organization_id, championship_id, team_id, status
) VALUES
  ('52000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-000000000001', '42000000-0000-0000-0000-000000000001', 'approved'),
  ('52000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', '32000000-0000-0000-0000-000000000002', '42000000-0000-0000-0000-000000000002', 'approved');

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

-- Arquivar nao pode destruir o estado de inscricao nem violar o constraint.
-- Guarda de regressao do defeito que este script encontrou: a RPC gravava
-- status='archived', valor que championship_teams_status_check rejeita.
DO $$
DECLARE arquivada public.championship_teams%ROWTYPE;
BEGIN
  arquivada := public.set_team_championship_archived(
    '32000000-0000-0000-0000-000000000001',
    '42000000-0000-0000-0000-000000000001',
    true
  );
  IF arquivada.archived_at IS NULL THEN
    RAISE EXCEPTION 'FAIL: arquivar nao preencheu archived_at';
  END IF;
  IF arquivada.status <> 'approved' THEN
    RAISE EXCEPTION 'FAIL: arquivar sobrescreveu o estado de inscricao (%)', arquivada.status;
  END IF;

  arquivada := public.set_team_championship_archived(
    '32000000-0000-0000-0000-000000000001',
    '42000000-0000-0000-0000-000000000001',
    false
  );
  IF arquivada.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: desarquivar nao limpou archived_at';
  END IF;
  IF arquivada.status <> 'approved' THEN
    RAISE EXCEPTION 'FAIL: desarquivar reescreveu o estado de inscricao (%)', arquivada.status;
  END IF;
END
$$;

-- Nenhuma funcao pode voltar a tratar 'archived' como estado de inscricao:
-- e exatamente o valor que championship_teams_status_check rejeita. Os apelidos
-- abaixo sao os que o schema usa para linhas de championship_teams.
DO $$
DECLARE ofensora text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ' ORDER BY p.oid::regprocedure::text)
  INTO ofensora
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND pg_get_functiondef(p.oid) ~
      '\m(ct|v_link|v_participation)\.status\s*(=|<>|IN|NOT IN)[^;]{0,30}''archived''';
  IF ofensora IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: vocabulario de arquivamento voltou a championship_teams.status em %', ofensora;
  END IF;

  IF pg_get_functiondef(
       'public.set_team_championship_archived(uuid,uuid,boolean)'::regprocedure
     ) LIKE '%''archived''%' THEN
    RAISE EXCEPTION 'FAIL: set_team_championship_archived voltou a gravar status=archived';
  END IF;
END
$$;

-- O cliente escreve championship_teams direto por PostgREST, sem passar pelas
-- RPCs. teams.ts gravava 'active' e 'archived' — vocabulario de `teams`, nao de
-- `championship_teams` — e criar, editar e arquivar equipe falhavam com 23514.
-- Aqui o constraint e verificado pelo mesmo caminho que o cliente usa: como
-- authenticated, escrita direta na tabela.
DO $$
DECLARE
  definicao text;
  aceitou text := NULL;
  valor text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definicao
  FROM pg_constraint WHERE conname = 'championship_teams_status_check';
  IF definicao IS NULL THEN
    RAISE EXCEPTION 'FAIL: championship_teams_status_check nao existe';
  END IF;

  -- O vocabulario e contrato: se algum valor sair, os leitores param de casar.
  FOREACH valor IN ARRAY ARRAY[
    'draft','submitted','under_review','approved','rejected','cancelled','withdrawn'
  ] LOOP
    IF position('''' || valor || '''' IN definicao) = 0 THEN
      RAISE EXCEPTION 'FAIL: % saiu do vocabulario de championship_teams.status', valor;
    END IF;
  END LOOP;

  -- Nenhum valor do vocabulario de `teams` pode ser aceito aqui.
  FOREACH valor IN ARRAY ARRAY['active','inactive','archived','pending'] LOOP
    BEGIN
      UPDATE public.championship_teams SET status = valor
      WHERE id = '52000000-0000-0000-0000-000000000001';
      aceitou := valor;
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    IF aceitou IS NOT NULL THEN
      RAISE EXCEPTION 'FAIL: championship_teams.status aceitou o valor % , que nao e do vocabulario de inscricao', aceitou;
    END IF;
  END LOOP;

  -- E o valor correto continua aceito, junto com archived_at.
  UPDATE public.championship_teams
     SET status = 'approved', archived_at = now()
   WHERE id = '52000000-0000-0000-0000-000000000001';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: escrita direta do vocabulario correto nao alcancou a linha';
  END IF;
  UPDATE public.championship_teams
     SET archived_at = NULL
   WHERE id = '52000000-0000-0000-0000-000000000001';
END
$$;

-- Um criterio so para "esta equipe participa": status='approved' e nao
-- arquivada. A policy championship_teams_public_select e a view
-- public_team_profiles ja diziam isso; as quatro funcoes abaixo diziam outra
-- coisa, e get_public_championship_portal e SECURITY DEFINER, entao entregava a
-- anon inscricao que a policy recusa.
DO $$
DECLARE
  assinatura regprocedure;
  corpo text;
BEGIN
  FOREACH assinatura IN ARRAY ARRAY[
    'public.phase1_team_in_championship(uuid,uuid,uuid)'::regprocedure,
    'public.publish_competition(uuid)'::regprocedure,
    'public.recalculate_standings(uuid,uuid,uuid,uuid)'::regprocedure,
    'public.get_public_championship_portal(text)'::regprocedure
  ] LOOP
    corpo := pg_get_functiondef(assinatura);
    IF corpo !~ 'status\s*=\s*''approved''' THEN
      RAISE EXCEPTION 'FAIL: % deixou de exigir inscricao aprovada', assinatura;
    END IF;
    IF corpo ~ 'status\s*(<>|NOT IN)[^;]{0,30}''rejected''' THEN
      RAISE EXCEPTION 'FAIL: % voltou ao criterio "tudo menos rejected"', assinatura;
    END IF;
  END LOOP;

  -- A policy e a view sao a referencia; se mudarem, as funcoes precisam mudar junto.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='championship_teams'
      AND policyname='championship_teams_public_select'
      AND qual LIKE '%''approved''%'
  ) THEN
    RAISE EXCEPTION 'FAIL: a policy de leitura publica deixou de exigir approved';
  END IF;
  IF pg_get_viewdef('public.public_team_profiles'::regclass, true) NOT LIKE '%''approved''%' THEN
    RAISE EXCEPTION 'FAIL: public_team_profiles deixou de exigir approved';
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
