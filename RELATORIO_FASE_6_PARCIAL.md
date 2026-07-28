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
- `F6-RF04` a `F6-RF07`: System Admin real, suporte auditado, auditoria global
  e observabilidade.

## F6-RF03 — Página pública da organização

Implementado em 28/07/2026:

- Configuração administrativa em `/settings/public-page`.
- Portal público separado em `/o/:slug`.
- Slug global único, normalizado e validado no backend.
- Rascunho, publicação e retirada do ar por RPCs auditadas.
- Contato privado por padrão, com autorização independente para e-mail e
  telefone.
- Links sociais restritos a redes conhecidas e URLs HTTPS.
- Listagem somente de campeonatos com `status = 'published'` e `is_public`.
- Leitura anônima exclusivamente pela RPC sanitizada
  `get_public_organization_portal`; a tabela canônica não é legível por `anon`.
- Migration
  `supabase/migrations/20260728030000_phase6_organization_public_portal.sql`.
- Verificação estrutural e de privilégios em
  `supabase/tests/phase6_organization_public_portal_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes.
- `npm run test`: 12 arquivos e 50 testes aprovados.
- `npm run build`: aprovado para cliente e SSR.
- `npm run security:env`: aprovado.
- `git diff --check`: aprovado.

Gate remoto pendente:

1. Aplicar a migration `20260728030000_phase6_organization_public_portal.sql`
   em homologação.
2. Executar `phase6_organization_public_portal_verification.sql`.
3. Validar com sessão owner/admin e acesso anônimo aos estados publicado e
   retirado do ar.

## F6-RF04 — System Admin (primeira fatia)

Implementado em 28/07/2026:

- Vínculo de administrador de plataforma em `system_admins`, separado dos
  papéis das organizações.
- Guard real e fail-closed pela RPC `is_system_admin()`.
- Provisionamento do primeiro administrador exclusivamente por operação
  controlada no banco; não existe promoção pelo cliente.
- `admin_audit_logs` separado da auditoria de domínio, imutável por trigger.
- Concessão, atualização e revogação do papel de plataforma auditadas
  automaticamente, com responsável e justificativa.
- Dashboard global real com organizações, usuários, campeonatos, assinaturas,
  storage e alertas operacionais.
- Listas específicas, pesquisáveis e paginadas para organizações, usuários,
  campeonatos e assinaturas.
- Tabelas canônicas sem leitura direta por `authenticated`; todas as consultas
  passam por RPCs `SECURITY DEFINER` que revalidam `is_system_admin()`.
- Rotas habilitadas:
  - `/system-admin`;
  - `/system-admin/organizacoes`;
  - `/system-admin/usuarios`;
  - `/system-admin/campeonatos`;
  - `/system-admin/assinaturas`.
- Migration
  `supabase/migrations/20260728060000_phase6_system_admin_read_model.sql`.
- Verificação estrutural e de privilégios em
  `supabase/tests/phase6_system_admin_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes.
- `npm run test`: 12 arquivos e 50 testes aprovados.
- `npm run build`: aprovado para cliente e SSR.
- `npm run security:env`: aprovado.

Gate remoto pendente:

1. Aplicar `20260728060000_phase6_system_admin_read_model.sql`.
2. Executar `phase6_system_admin_verification.sql`.
3. Provisionar o primeiro administrador com UUID validado, responsável e
   justificativa de pelo menos 10 caracteres.
4. Validar que usuário comum é redirecionado e que o administrador autorizado
   acessa dashboard e quatro listas.

Continuações de `F6-RF04`:

- Ações privilegiadas de plataforma continuam bloqueadas até serem modeladas
  com confirmação, justificativa e auditoria.
- As rotas de suporte, auditoria e configurações permanecem desabilitadas e
  pertencem às próximas entregas `F6-RF05` a `F6-RF07`.
