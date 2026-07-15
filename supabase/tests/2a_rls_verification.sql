-- Verificacao transacional da Etapa 2A (sem pgTAP).
-- Requer banco Supabase descartavel com todas as migrations aplicadas.
-- Nenhum dado permanece: o script inteiro termina em ROLLBACK.
BEGIN;

DO $$
DECLARE
  user_id uuid;
BEGIN
  FOR user_id IN SELECT unnest(ARRAY[
    '10000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid
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

-- O trigger de signup cria uma organizacao por usuario; as duas abaixo sao fixtures explicitas.
INSERT INTO public.organizations (id, name, slug, created_by)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Organizacao A', 'org-a-test', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Organizacao B', 'org-b-test', '10000000-0000-0000-0000-000000000005');

INSERT INTO public.organization_members (organization_id, user_id)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (organization_id, user_id, role)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'admin'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'editor'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'viewer'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'owner')
ON CONFLICT DO NOTHING;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- 1. Owner cria campeonato e todos os registros obrigatorios atomicamente.
SELECT (public.create_championship(
  '20000000-0000-0000-0000-000000000001', 'Copa RLS', 'copa-rls-test'
)).id;

DO $$
DECLARE target_championship_id uuid;
BEGIN
  SELECT id INTO target_championship_id FROM public.championships WHERE slug = 'copa-rls-test';
  IF target_championship_id IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM public.championship_settings
      WHERE championship_id = target_championship_id
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.championship_categories
      WHERE championship_id = target_championship_id
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.competition_stages
      WHERE championship_id = target_championship_id
    )
  THEN
    RAISE EXCEPTION 'FAIL: criacao atomica nao criou a fundacao completa';
  END IF;
END
$$;

-- 2. Admin edita.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
UPDATE public.championships SET description = 'Atualizado pelo admin' WHERE slug = 'copa-rls-test';

-- 3. Editor escreve porque o enum/modelo atual autoriza editor.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
UPDATE public.championships SET season = '2026' WHERE slug = 'copa-rls-test';

-- 4. Viewer nao cria nem edita.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    PERFORM public.create_championship(
      '20000000-0000-0000-0000-000000000001', 'Bloqueado', 'viewer-bloqueado'
    );
    RAISE EXCEPTION 'FAIL: viewer criou campeonato';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$$;

-- 5/6. Usuario de outra organizacao nao le/escreve dados privados.
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}', true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.championships WHERE slug = 'copa-rls-test') THEN
    RAISE EXCEPTION 'FAIL: isolamento de leitura entre organizacoes';
  END IF;
  BEGIN
    PERFORM public.create_championship(
      '20000000-0000-0000-0000-000000000001', 'Cross tenant', 'cross-tenant-test'
    );
    RAISE EXCEPTION 'FAIL: escrita cross-tenant permitida';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$$;

RESET ROLE;

-- 7. Constraint composta impede configuracao cross-tenant.
DO $$
DECLARE target_championship_id uuid;
BEGIN
  SELECT id INTO target_championship_id FROM public.championships WHERE slug = 'copa-rls-test';
  BEGIN
    UPDATE public.championship_settings
    SET organization_id = '20000000-0000-0000-0000-000000000002'
    WHERE championship_id = target_championship_id;
    RAISE EXCEPTION 'FAIL: configuracao cross-tenant permitida';
  EXCEPTION WHEN foreign_key_violation OR insufficient_privilege THEN NULL;
  END;
END
$$;

-- 8. Falha posterior ao primeiro INSERT nao deixa campeonato parcial.
CREATE OR REPLACE FUNCTION pg_temp.fail_settings_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'forced settings failure'; END
$$;
CREATE TRIGGER force_settings_failure
  BEFORE INSERT ON public.championship_settings
  FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_settings_insert();

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
DO $$
BEGIN
  BEGIN
    PERFORM public.create_championship(
      '20000000-0000-0000-0000-000000000001', 'Falha Atomica', 'falha-atomica-test'
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.championships WHERE slug = 'falha-atomica-test') THEN
    RAISE EXCEPTION 'FAIL: transacao deixou campeonato parcial';
  END IF;
END
$$;
RESET ROLE;
DROP TRIGGER force_settings_failure ON public.championship_settings;

-- 9. Exclusao com historico/equipe vinculada e bloqueada.
INSERT INTO public.teams (organization_id, championship_id, name)
SELECT organization_id, id, 'Equipe Historica' FROM public.championships WHERE slug = 'copa-rls-test';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
SELECT set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
DO $$
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM public.championships WHERE slug = 'copa-rls-test';
  BEGIN
    PERFORM public.delete_championship(target_id);
    RAISE EXCEPTION 'FAIL: campeonato com historico excluido';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.championships WHERE id = target_id) THEN
    RAISE EXCEPTION 'FAIL: campeonato historico nao foi preservado';
  END IF;
END
$$;
RESET ROLE;

-- 10. Anon ve somente campeonato publicado e nao draft.
UPDATE public.championships SET is_public = true, status = 'active' WHERE slug = 'copa-rls-test';
INSERT INTO public.championships (organization_id, name, slug, is_public, status)
VALUES ('20000000-0000-0000-0000-000000000001', 'Privado', 'privado-rls-test', false, 'active');
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.championships WHERE slug IN ('copa-rls-test', 'privado-rls-test')) <> 1 THEN
    RAISE EXCEPTION 'FAIL: leitura publica nao respeitou publicacao';
  END IF;
END
$$;
RESET ROLE;

ROLLBACK;
