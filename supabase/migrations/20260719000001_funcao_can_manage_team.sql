-- Funções que existem em produção mas não são criadas por nenhuma migration.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): terceiro tipo de drift
-- encontrado, além das 14 tabelas e das 54 colunas fora do controle de versão.
-- Sem estas definições, os triggers e policies restaurados pela baseline não
-- podem ser criados em um banco vazio.
--
-- Aplicado logo após a baseline: lê public.team_user_access, criada lá.
--
-- Funções: can_manage_team.

CREATE OR REPLACE FUNCTION "public"."can_manage_team"("p_team_id" "uuid", "p_championship_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_user_access tua
    WHERE tua.team_id = p_team_id
      AND tua.user_id = auth.uid()
      AND tua.status = 'active'
      AND tua.access_role IN ('manager', 'editor')
      AND (
        tua.championship_id IS NULL
        OR tua.championship_id IS NOT DISTINCT FROM p_championship_id
      )
  );
$$;
