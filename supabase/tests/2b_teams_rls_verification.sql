-- Verificacao transacional da Etapa 2B. Requer migrations aplicadas em banco descartavel.
BEGIN;

DO $$
DECLARE user_id uuid;
BEGIN
  FOR user_id IN SELECT unnest(ARRAY[
    '11000000-0000-0000-0000-000000000001'::uuid,
    '11000000-0000-0000-0000-000000000002'::uuid,
    '11000000-0000-0000-0000-000000000003'::uuid
  ]) LOOP
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', user_id::text || '@example.invalid', '', '{}', '{}', now(), now());
  END LOOP;
END
$$;

INSERT INTO public.organizations (id, name, slug, created_by) VALUES
  ('21000000-0000-0000-0000-000000000001', 'Org Teams A', 'org-teams-a', '11000000-0000-0000-0000-000000000001'),
  ('21000000-0000-0000-0000-000000000002', 'Org Teams B', 'org-teams-b', '11000000-0000-0000-0000-000000000003');
INSERT INTO public.organization_members (organization_id, user_id) VALUES
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002'),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (organization_id, user_id, role) VALUES
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'owner'),
  ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', 'viewer'),
  ('21000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000003', 'owner') ON CONFLICT DO NOTHING;
INSERT INTO public.championships (id, organization_id, name, slug, status) VALUES
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'Copa Teams A', 'copa-teams-a', 'active'),
  ('31000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000002', 'Copa Teams B', 'copa-teams-b', 'active');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Owner cria equipe e vinculo atomicamente; tenant e autoria derivam no servidor.
SELECT (public.create_team_for_championship(
  p_championship_id => '31000000-0000-0000-0000-000000000001',
  p_name => 'Equipe RLS', p_slug => 'equipe-rls'
)).id;
DO $$
DECLARE target_team_id uuid;
BEGIN
  SELECT id INTO target_team_id FROM public.teams WHERE slug='equipe-rls';
  IF target_team_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.championship_teams ct WHERE ct.team_id=target_team_id
      AND championship_id='31000000-0000-0000-0000-000000000001'
  ) THEN RAISE EXCEPTION 'FAIL: criacao atomica incompleta'; END IF;
  IF EXISTS (SELECT 1 FROM public.teams WHERE id=target_team_id AND (organization_id <> '21000000-0000-0000-0000-000000000001' OR created_by <> auth.uid()))
  THEN RAISE EXCEPTION 'FAIL: tenant/autoria nao derivados no servidor'; END IF;
END
$$;

-- Falha no segundo INSERT nao deixa equipe parcial.
RESET ROLE;
CREATE OR REPLACE FUNCTION pg_temp.fail_team_link() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced link failure'; END $$;
CREATE TRIGGER force_link_failure BEFORE INSERT ON public.championship_teams FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_team_link();
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
DO $$ BEGIN
  BEGIN PERFORM public.create_team_for_championship('31000000-0000-0000-0000-000000000001', 'Equipe Parcial', p_slug => 'equipe-parcial'); EXCEPTION WHEN OTHERS THEN NULL; END;
  IF EXISTS (SELECT 1 FROM public.teams WHERE slug='equipe-parcial') THEN RAISE EXCEPTION 'FAIL: equipe parcial persistiu'; END IF;
END $$;
RESET ROLE;
DROP TRIGGER force_link_failure ON public.championship_teams;

-- Viewer le, mas nao cria nem edita.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000002', true);
SELECT set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE slug='equipe-rls') THEN RAISE EXCEPTION 'FAIL: viewer nao le'; END IF;
  BEGIN PERFORM public.create_team_for_championship('31000000-0000-0000-0000-000000000001', 'Bloqueada'); RAISE EXCEPTION 'FAIL: viewer criou'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- Outro tenant nao le nem altera.
SELECT set_config('request.jwt.claim.sub', '11000000-0000-0000-0000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.teams WHERE slug='equipe-rls') THEN RAISE EXCEPTION 'FAIL: isolamento de leitura'; END IF;
  BEGIN PERFORM public.update_team_for_championship('31000000-0000-0000-0000-000000000001', (SELECT id FROM public.teams WHERE slug='equipe-rls'), 'Ataque'); RAISE EXCEPTION 'FAIL: escrita cross-tenant'; EXCEPTION WHEN no_data_found OR insufficient_privilege THEN NULL; END;
END $$;

RESET ROLE;
ROLLBACK;
