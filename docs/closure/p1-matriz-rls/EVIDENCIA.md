# Evidência — matriz de isolamento

Gerado por `npm run test:rls`. Não editar à mão: é sobrescrito a cada execução.

- **Data:** 2026-08-07T20:25:39.394Z
- **Commit:** `42a0a11bd77e98f7c77718368b49f598d85532eb`
- **Resultado:** 29/29

## Conferência de segurança, arquivo por arquivo

Refeita a cada execução. O runner aborta antes de conectar se algum script
deixar de terminar em `ROLLBACK` ou de ser somente leitura.

| Script | Classificação |
| --- | --- |
| `2a_rls_verification.sql` | transacional com ROLLBACK |
| `2b_teams_rls_verification.sql` | transacional com ROLLBACK |
| `2c_roster_rls_verification.sql` | transacional com ROLLBACK |
| `phase1_matches_atomic_verification.sql` | somente leitura |
| `phase2_competition_engine_verification.sql` | somente leitura |
| `phase3_complete_report_verification.sql` | transacional com ROLLBACK |
| `phase3_referee_privacy_verification.sql` | transacional com ROLLBACK |
| `phase3_referee_workflow_verification.sql` | transacional com ROLLBACK |
| `phase3_sports_operations_verification.sql` | transacional com ROLLBACK |
| `phase4_publishing_verification.sql` | transacional com ROLLBACK |
| `phase5_audit_verification.sql` | transacional com ROLLBACK |
| `phase5_championship_settings_verification.sql` | transacional com ROLLBACK |
| `phase5_finance_verification.sql` | transacional com ROLLBACK |
| `phase5_notifications_verification.sql` | transacional com ROLLBACK |
| `phase5_organization_users_verification.sql` | transacional com ROLLBACK |
| `phase6_admin_audit_verification.sql` | transacional com ROLLBACK |
| `phase6_commercial_plan_catalog_verification.sql` | transacional com ROLLBACK |
| `phase6_infinitepay_billing_verification.sql` | transacional com ROLLBACK |
| `phase6_operational_observability_verification.sql` | transacional com ROLLBACK |
| `phase6_organization_public_portal_verification.sql` | transacional com ROLLBACK |
| `phase6_owner_authorization_hardening_verification.sql` | transacional com ROLLBACK |
| `phase6_plan_catalog_administration_verification.sql` | transacional com ROLLBACK |
| `phase6_plan_change_preview_verification.sql` | transacional com ROLLBACK |
| `phase6_plan_limits_verification.sql` | transacional com ROLLBACK |
| `phase6_service_observability_verification.sql` | transacional com ROLLBACK |
| `phase6_subscription_lifecycle_verification.sql` | transacional com ROLLBACK |
| `phase6_support_mode_verification.sql` | transacional com ROLLBACK |
| `phase6_system_admin_verification.sql` | transacional com ROLLBACK |
| `team_access_security.test.sql` | transacional com ROLLBACK |

## Saída por script

### PASSOU — `2a_rls_verification.sql`

```
[{"set_config":"10000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"id":"4e59ce8d-8737-4585-9138-61a5727c2320"}]
[{"set_config":"10000000-0000-0000-0000-000000000002"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000002\",\"role\":\"authenticated\"}"}]
[{"set_config":"10000000-0000-0000-0000-000000000003"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000003\",\"role\":\"authenticated\"}"}]
[{"set_config":"10000000-0000-0000-0000-000000000004"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000004\",\"role\":\"authenticated\"}"}]
[{"set_config":"10000000-0000-0000-0000-000000000005"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000005\",\"role\":\"authenticated\"}"}]
[{"set_config":"10000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"set_config":"10000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"10000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
```

### PASSOU — `2b_teams_rls_verification.sql`

```
[{"set_config":"11000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"11000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"id":"97215fdc-5c21-4cb2-92c8-225ff7a93109"}]
[{"set_config":"11000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"11000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"set_config":"11000000-0000-0000-0000-000000000002"}]
[{"set_config":"{\"sub\":\"11000000-0000-0000-0000-000000000002\",\"role\":\"authenticated\"}"}]
[{"set_config":"11000000-0000-0000-0000-000000000003"}]
[{"set_config":"{\"sub\":\"11000000-0000-0000-0000-000000000003\",\"role\":\"authenticated\"}"}]
```

### PASSOU — `2c_roster_rls_verification.sql`

```
[{"set_config":"12000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"12000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"set_config":"12000000-0000-0000-0000-000000000001"}]
[{"set_config":"{\"sub\":\"12000000-0000-0000-0000-000000000001\",\"role\":\"authenticated\"}"}]
[{"register_athlete_for_championship":"cff76698-0ee6-4a52-b1f3-5222f325c850"}]
[{"add_team_staff_for_championship":"19add65c-bff0-4653-936e-75e66b307721"}]
[{"add_team_responsible":"0dc6458d-63c8-44ca-ba97-f750f12e308d"}]
[{"set_config":"12000000-0000-0000-0000-000000000002"}]
[{"set_config":"{\"sub\":\"12000000-0000-0000-0000-000000000002\",\"role\":\"authenticated\"}"}]
[{"set_config":"12000000-0000-0000-0000-000000000003"}]
[{"set_config":"{\"sub\":\"12000000-0000-0000-0000-000000000003\",\"role\":\"authenticated\"}"}]
```

### PASSOU — `phase1_matches_atomic_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase2_competition_engine_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase3_complete_report_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase3_referee_privacy_verification.sql`

```
[{"set_config":"{\"sub\" : \"00000000-0000-0000-0000-000000000099\", \"role\" : \"authenticated\"}"}]
[{"phase3_referee_privacy_verified":true}]
```

### PASSOU — `phase3_referee_workflow_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase3_sports_operations_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase4_publishing_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase5_audit_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase5_championship_settings_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase5_finance_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase5_notifications_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase5_organization_users_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase6_admin_audit_verification.sql`

```
[{"set_config":"00000000-0000-0000-0000-000000000001"}]
```

### PASSOU — `phase6_commercial_plan_catalog_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase6_infinitepay_billing_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase6_operational_observability_verification.sql`

```
[{"set_config":"00000000-0000-0000-0000-000000000001"}]
[{"set_config":""}]
```

### PASSOU — `phase6_organization_public_portal_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase6_owner_authorization_hardening_verification.sql`

```
[{"set_config":"{\"sub\" : \"00000000-0000-0000-0000-000000000099\", \"role\" : \"authenticated\"}"}]
```

### PASSOU — `phase6_plan_catalog_administration_verification.sql`

```
[{"set_config":"{\"sub\" : \"00000000-0000-0000-0000-000000000099\", \"role\" : \"authenticated\"}"}]
```

### PASSOU — `phase6_plan_change_preview_verification.sql`

```
[{"set_config":"{\"sub\" : \"00000000-0000-0000-0000-000000000099\", \"role\" : \"authenticated\"}"}]
```

### PASSOU — `phase6_plan_limits_verification.sql`

```
(sem linhas de retorno)
```

### PASSOU — `phase6_service_observability_verification.sql`

```
[{"record_service_operational_event":true}]
```

### PASSOU — `phase6_subscription_lifecycle_verification.sql`

```
[{"phase6_subscription_lifecycle_verified":true}]
```

### PASSOU — `phase6_support_mode_verification.sql`

```
[{"set_config":"00000000-0000-0000-0000-000000000001"}]
```

### PASSOU — `phase6_system_admin_verification.sql`

```
[{"set_config":"00000000-0000-0000-0000-000000000001"}]
```

### PASSOU — `team_access_security.test.sql`

```
(sem linhas de retorno)
```
