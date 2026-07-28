# Relatório parcial da Fase 6

Data: 27/07/2026

## Escopo iniciado

Primeira fatia de `F6-RF01 — Planos e limites`, cobrindo o caminho
Banco → Serviço → Hook → Interface para assinatura e consumo da organização.

## Implementado

- Catálogo de planos versionado em `saas_plan_versions`.
- Assinatura canônica por organização em `organization_subscriptions`.
- Migração aditiva do campo legado `organizations.plan` para o plano `starter`.
- Provisionamento automático de assinatura para novas organizações.
- Estados de assinatura `trial`, `active`, `past_due`, `cancelled` e `suspended`.
- Medição autoritativa no banco para:
  - organizações do proprietário;
  - campeonatos ativos/publicados;
  - equipes ativas;
  - membros e convites pendentes;
  - storage atribuível à organização.
- Cálculo de consumo com estados `unlimited`, `ok`, `warning` e `blocked`.
- Bloqueio no backend para:
  - ativação/publicação de campeonato;
  - criação/reativação de equipe;
  - inclusão de membro;
  - criação de convite.
- RPC exclusiva de proprietário para leitura da assinatura e do consumo.
- Rota `/settings/subscription`.
- Navegação do Organizer Shell e aba de configurações conectadas à nova rota.
- Tela com plano, estado da assinatura, módulos, consumo e alertas.
- Verificação SQL de estrutura, privilégios, provisionamento e bloqueio.

## Decisão de segurança comercial

O PRD registra planos, preços e limites como decisão pendente. Por isso, a
versão inicial do `starter` usa limites `NULL` (ilimitados) e não contém preço
fictício. Os pontos de bloqueio já estão instalados e passam a valer quando os
valores forem configurados no catálogo.

O frontend não escreve status, plano ou limite. As tabelas canônicas não
concedem leitura ou escrita direta a `authenticated`; a leitura ocorre por RPC
`SECURITY DEFINER`, com autorização de proprietário verificada no backend.

## Validação local

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes de Fast Refresh.
- `git diff --check`: aprovado.
- `npm run test`: não executado por `spawn EPERM` ao carregar o Vite.
- `npm run build`: não executado por `spawn EPERM` e falha de carga do módulo
  nativo do Tailwind dentro do sandbox.
- `npm run security:env`: não executado por `spawnSync git EPERM`.

A execução fora do sandbox foi solicitada, mas a plataforma recusou a elevação
por limite de uso. Esses três gates continuam obrigatórios antes da publicação.

## Gate remoto

Executar, nesta ordem:

1. `supabase/migrations/20260728010000_phase6_plan_limits_foundation.sql`;
2. `supabase/tests/phase6_plan_limits_verification.sql`.

Depois da aplicação remota, regenerar os tipos do Supabase para substituir o
adapter temporário usado pela nova RPC.

## Pendências de F6-RF01

- Definir planos, preços, limites e módulos comercializados.
- Criar fluxo administrativo auditado para publicar nova versão de plano.
- Aplicar limite de organizações no fluxo de criação.
- Aplicar quota de storage antes do upload; a primeira fatia apenas mede o
  storage atribuível.
- Aplicar autorização de módulos nos RPCs críticos.

## Próximas entregas da Fase 6

- `F6-RF02`: assinaturas, eventos idempotentes e integração de cobrança.
- `F6-RF03`: página pública da organização.
- `F6-RF04` a `F6-RF07`: System Admin real, suporte auditado, auditoria global
  e observabilidade.
