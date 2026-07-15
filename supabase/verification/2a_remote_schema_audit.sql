-- Auditoria somente leitura para executar ANTES da migration da Etapa 2A.
-- Execute conectado ao projeto remoto com uma role capaz de ler pg_catalog.
BEGIN TRANSACTION READ ONLY;

-- Tabelas e colunas relevantes.
SELECT
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'championship_teams', 'teams', 'athletes', 'matches',
    'organization_members', 'user_roles'
  )
ORDER BY c.table_name, c.ordinal_position;

-- Constraints e regras de exclusao/atualizacao.
SELECT
  cls.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid, true) AS definition
FROM pg_constraint con
JOIN pg_class cls ON cls.oid = con.conrelid
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'championship_teams', 'teams', 'athletes', 'matches',
    'organization_members', 'user_roles'
  )
ORDER BY cls.relname, con.conname;

-- Indices.
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'championship_teams', 'teams', 'athletes', 'matches',
    'organization_members', 'user_roles'
  )
ORDER BY tablename, indexname;

-- Functions e privilegios de EXECUTE.
SELECT
  p.oid::regprocedure AS function_signature,
  p.prosecdef AS security_definer,
  p.provolatile AS volatility,
  p.proconfig AS function_config,
  p.proacl AS explicit_acl,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_org_member', 'has_role', 'current_user_has_role', 'can_administer_org',
    'create_championship', 'delete_championship', 'get_championship_context',
    'tg_set_admin_audit_fields', 'tg_set_updated_at'
  )
ORDER BY p.proname, p.oid::regprocedure::text;

-- Triggers.
SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'teams', 'athletes', 'matches'
  )
ORDER BY event_object_table, trigger_name, event_manipulation;

-- RLS e policies.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'championship_teams', 'teams', 'athletes', 'matches',
    'organization_members', 'user_roles'
  )
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'championships', 'championship_settings', 'championship_categories',
    'competition_stages', 'championship_teams', 'teams', 'athletes', 'matches',
    'organization_members', 'user_roles'
  )
ORDER BY tablename, policyname;

-- Diagnosticos de dados: todos os resultados devem retornar zero linhas.
SELECT 'championship_dates' AS issue, id::text AS record_id
FROM public.championships
WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;

SELECT 'team_championship_cross_tenant' AS issue, t.id::text AS record_id
FROM public.teams t
JOIN public.championships c ON c.id = t.championship_id
WHERE t.organization_id <> c.organization_id;

SELECT 'athlete_team_cross_tenant' AS issue, a.id::text AS record_id
FROM public.athletes a
JOIN public.teams t ON t.id = a.team_id
WHERE a.organization_id <> t.organization_id;

SELECT 'match_championship_cross_tenant' AS issue, m.id::text AS record_id
FROM public.matches m
JOIN public.championships c ON c.id = m.championship_id
WHERE m.organization_id <> c.organization_id;

SELECT 'match_team_cross_tenant' AS issue, m.id::text AS record_id
FROM public.matches m
JOIN public.teams t ON t.id IN (m.home_team_id, m.away_team_id)
WHERE m.organization_id <> t.organization_id;

SELECT 'settings_championship_cross_tenant' AS issue, s.id::text AS record_id
FROM public.championship_settings s
JOIN public.championships c ON c.id = s.championship_id
WHERE s.organization_id <> c.organization_id;

SELECT 'category_championship_cross_tenant' AS issue, category.id::text AS record_id
FROM public.championship_categories category
JOIN public.championships c ON c.id = category.championship_id
WHERE category.organization_id <> c.organization_id;

SELECT 'category_dates' AS issue, id::text AS record_id
FROM public.championship_categories
WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;

SELECT 'stage_championship_cross_tenant' AS issue, stage.id::text AS record_id
FROM public.competition_stages stage
JOIN public.championships c ON c.id = stage.championship_id
WHERE stage.organization_id <> c.organization_id;

SELECT 'stage_dates' AS issue, id::text AS record_id
FROM public.competition_stages
WHERE starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at < starts_at;

SELECT 'stage_category_cross_tenant' AS issue, stage.id::text AS record_id
FROM public.competition_stages stage
JOIN public.championship_categories category ON category.id = stage.category_id
WHERE stage.organization_id <> category.organization_id;

SELECT 'championship_team_cross_tenant' AS issue, registration.id::text AS record_id
FROM public.championship_teams registration
JOIN public.championships c ON c.id = registration.championship_id
JOIN public.teams team ON team.id = registration.team_id
LEFT JOIN public.championship_categories category ON category.id = registration.category_id
WHERE registration.organization_id <> c.organization_id
   OR registration.organization_id <> team.organization_id
   OR (category.id IS NOT NULL AND registration.organization_id <> category.organization_id);

ROLLBACK;
