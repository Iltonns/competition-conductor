-- P1 do PRD_FECHAMENTO_FINAL_PRODUCAO: defeito critico desbloqueado pela
-- matriz de isolamento assim que 2c_roster_rls_verification passou a montar a
-- fixture com o vocabulario correto de status.
--
--   ERRO: column reference "organization_id" is ambiguous (42702)
--   contexto: assert_championship_limit(uuid,text,bigint) linha 28
--             <- tg_enforce_championship_plan_limit
--             <- INSERT INTO championship_team_athletes
--             <- register_athlete_for_championship
--
-- A funcao declara uma variavel plpgsql chamada `organization_id`, nome que
-- tambem e coluna de organization_subscriptions. Na clausula
--
--   WHERE subscription.organization_id = organization_id
--
-- o lado direito e ambiguo: o Postgres nao decide entre a variavel e a coluna e
-- aborta o statement. Nao e caso de borda — o erro ocorre em toda execucao que
-- chega ali, entao **inscrever atleta em campeonato falhava sempre em
-- producao**, pelo gatilho de limite de plano. Vale igual para o gatilho de
-- patrocinadores.
--
-- A ambiguidade so aparece em tempo de execucao: `CREATE FUNCTION` nao analisa
-- o corpo plpgsql. Por isso a migration original aplicou limpa e o defeito
-- ficou invisivel ate existir um teste que inscrevesse um atleta de verdade.
--
-- Correcao: renomear a variavel. Uma varredura das 171 funcoes plpgsql do
-- schema encontrou este como o unico caso do padrao.

CREATE OR REPLACE FUNCTION public.assert_championship_limit(
  p_championship_id uuid,
  p_resource text,
  p_increment bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  configured_limit bigint;
  current_usage bigint;
  target_organization_id uuid;
  subscription_status text;
BEGIN
  IF p_increment < 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'subscription:invalid_increment';
  END IF;

  SELECT championship.organization_id
  INTO target_organization_id
  FROM public.championships championship
  WHERE championship.id = p_championship_id;

  IF target_organization_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship:not_found';
  END IF;

  -- Serializa contagem e insercao por campeonato para impedir estouro concorrente.
  PERFORM pg_advisory_xact_lock(
    hashtextextended('championship-plan-limit:' || p_championship_id::text, 0)
  );

  SELECT
    subscription.status,
    NULLIF(plan.limits->>p_resource, '')::bigint
  INTO subscription_status, configured_limit
  FROM public.organization_subscriptions subscription
  JOIN public.saas_plan_versions plan ON plan.id = subscription.plan_version_id
  WHERE subscription.organization_id = target_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'subscription:not_provisioned';
  END IF;
  IF subscription_status = 'suspended' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'subscription:suspended';
  END IF;
  IF configured_limit IS NULL THEN
    RETURN;
  END IF;

  current_usage := public.championship_resource_usage(p_championship_id, p_resource);
  IF current_usage + p_increment > configured_limit THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'subscription:limit_exceeded',
      DETAIL = format(
        'resource=%s;used=%s;limit=%s;increment=%s',
        p_resource, current_usage, configured_limit, p_increment
      );
  END IF;
END;
$$;
