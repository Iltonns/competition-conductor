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
  "supabase/tests/team_access_security.test.sql"
)

foreach ($testFile in $testFiles) {
  Write-Host "Executando $testFile"
  & $psql.Source $databaseUrl -v ON_ERROR_STOP=1 -f $testFile
  if ($LASTEXITCODE -ne 0) {
    throw "Falha na verificacao Supabase: $testFile"
  }
}

Write-Host "Matriz SQL/RLS da Fase 0 concluida com sucesso."
