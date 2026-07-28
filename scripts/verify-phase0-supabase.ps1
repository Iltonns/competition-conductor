param()

$ErrorActionPreference = "Stop"

$databaseUrl = $env:SUPABASE_DB_URL
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "Defina SUPABASE_DB_URL somente no ambiente local antes de executar. Nunca salve a URL no repositorio."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  throw "psql nao foi encontrado no PATH. Instale o cliente PostgreSQL antes de executar a matriz RLS."
}

$testFiles = @(
  "supabase/tests/2a_rls_verification.sql",
  "supabase/tests/2b_teams_rls_verification.sql",
  "supabase/tests/2c_roster_rls_verification.sql",
  "supabase/tests/team_access_security.test.sql",
  "supabase/tests/phase1_matches_atomic_verification.sql",
  "supabase/tests/phase2_competition_engine_verification.sql",
  "supabase/tests/phase3_sports_operations_verification.sql",
  "supabase/tests/phase3_referee_workflow_verification.sql",
  "supabase/tests/phase3_complete_report_verification.sql",
  "supabase/tests/phase4_publishing_verification.sql",
  "supabase/tests/phase5_finance_verification.sql",
  "supabase/tests/phase5_audit_verification.sql",
  "supabase/tests/phase5_championship_settings_verification.sql",
  "supabase/tests/phase5_organization_users_verification.sql",
  "supabase/tests/phase5_notifications_verification.sql",
  "supabase/tests/phase6_plan_limits_verification.sql",
  "supabase/tests/phase6_organization_public_portal_verification.sql",
  "supabase/tests/phase6_system_admin_verification.sql",
  "supabase/tests/phase6_support_mode_verification.sql",
  "supabase/tests/phase6_admin_audit_verification.sql",
  "supabase/tests/phase6_operational_observability_verification.sql",
  "supabase/tests/phase6_commercial_plan_catalog_verification.sql"
)

foreach ($testFile in $testFiles) {
  Write-Host "Executando $testFile"
  & $psql.Source $databaseUrl -v ON_ERROR_STOP=1 -f $testFile
  if ($LASTEXITCODE -ne 0) {
    throw "Falha na verificacao Supabase: $testFile"
  }
}

Write-Host "Matriz SQL/RLS da Fase 0 concluida com sucesso."
