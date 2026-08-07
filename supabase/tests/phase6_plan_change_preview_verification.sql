-- Run after 20260729040000_phase6_plan_change_preview.sql.
--
-- A migration seguinte (20260729050000_phase6_owner_authorization_hardening)
-- partiu a RPC em duas: o ponto de entrada publico virou um invólucro fino que
-- so chama assert_organization_owner e delega, e o corpo original passou a se
-- chamar preview_organization_plan_change_owner_checked_source, revogado de
-- anon e de authenticated. Este arquivo asseria o corpo inteiro no ponto de
-- entrada, contrato que aquela migration moveu de proposito. As assercoes
-- abaixo cobrem o par: autorizacao no invólucro, preservacao no source.
BEGIN;

DO $$
DECLARE
  entrada regprocedure := to_regprocedure('public.preview_organization_plan_change(uuid,uuid)');
  fonte   regprocedure := to_regprocedure(
    'public.preview_organization_plan_change_owner_checked_source(uuid,uuid)'
  );
  assinatura regprocedure;
BEGIN
  IF entrada IS NULL OR fonte IS NULL THEN
    RAISE EXCEPTION 'plan_change_preview:rpc_missing';
  END IF;

  -- Somente o ponto de entrada e alcancavel, e so por authenticated.
  IF has_function_privilege('anon', entrada, 'EXECUTE')
     OR NOT has_function_privilege('authenticated', entrada, 'EXECUTE')
     OR has_function_privilege('anon', fonte, 'EXECUTE')
     OR has_function_privilege('authenticated', fonte, 'EXECUTE') THEN
    RAISE EXCEPTION 'plan_change_preview:invalid_privileges';
  END IF;

  -- O invólucro autoriza antes de delegar.
  IF pg_get_functiondef(entrada) NOT ILIKE '%assert_organization_owner%'
     OR pg_get_functiondef(entrada)
        NOT ILIKE '%preview_organization_plan_change_owner_checked_source%' THEN
    RAISE EXCEPTION 'plan_change_preview:authorization_or_delegation_contract_missing';
  END IF;

  -- O source mantem a checagem de papel e o contrato de preservacao de dados.
  IF pg_get_functiondef(fonte) NOT ILIKE '%organization_effective_role%'
     OR pg_get_functiondef(fonte) NOT ILIKE '%data_preserved%'
     OR pg_get_functiondef(fonte) NOT ILIKE '%new_writes_only%' THEN
    RAISE EXCEPTION 'plan_change_preview:preservation_contract_missing';
  END IF;

  -- Previsao nao escreve: nem o invólucro, nem o source.
  FOREACH assinatura IN ARRAY ARRAY[entrada, fonte] LOOP
    IF pg_get_functiondef(assinatura) ILIKE '%UPDATE %'
       OR pg_get_functiondef(assinatura) ILIKE '%DELETE %'
       OR pg_get_functiondef(assinatura) ILIKE '%INSERT %' THEN
      RAISE EXCEPTION 'plan_change_preview:read_only_contract_broken:%', assinatura;
    END IF;
  END LOOP;
END;
$$;

SELECT set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '00000000-0000-0000-0000-000000000099',
    'role', 'authenticated'
  )::text,
  true
);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  BEGIN
    PERFORM public.preview_organization_plan_change(
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'plan_change_preview:ordinary_user_was_not_blocked';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

RESET ROLE;
ROLLBACK;
