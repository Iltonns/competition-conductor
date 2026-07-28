# Relatório parcial da Fase 6

Data: 27/07/2026

## Atualização — catálogo comercial e limites por campeonato (28/07/2026)

- Quatro planos comerciais versionados:
  - Campeonatos Pequenos: R$ 25/mês, 300 atletas e 3 patrocinadores;
  - Campeonatos Intermediários: R$ 32/mês, 600 atletas e 6 patrocinadores;
  - Campeonatos Grandes: R$ 40/mês, 900 atletas e 12 patrocinadores;
  - Organizador Profissional: R$ 55/mês, atletas e patrocinadores ilimitados.
- Campeonatos permanecem ilimitados nos quatro planos.
- Limites não informados pela decisão comercial continuam `NULL`/ilimitados.
- Incorporação HTML e API JSON são módulos exclusivos do plano Profissional.
- Limites de atletas e patrocinadores são aplicados por triggers no backend, com
  lock transacional para impedir estouro por concorrência.
- Assinaturas legadas `starter` migram para Campeonatos Pequenos; novas
  organizações recebem o mesmo plano padrão.
- Catálogo público é exposto por RPC somente leitura; tabelas canônicas continuam
  sem acesso direto.
- A tela de assinatura apresenta os quatro planos. A troca permanece bloqueada
  até a implementação do provedor de cobrança em `F6-RF02`.

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
- Continuidades de `F6-RF01` e `F6-RF07` que dependem das decisões comerciais,
  jurídicas e operacionais ainda abertas no PRD.

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
- As rotas de auditoria e configurações não faziam parte desta primeira fatia;
  foram habilitadas posteriormente pelas entregas `F6-RF06` e `F6-RF07`.

## F6-RF05 — Modo suporte auditado (primeira fatia)

Implementado em 28/07/2026:

- Sessões de suporte vinculadas ao administrador e a uma única organização,
  com justificativa obrigatória e duração entre 5 minutos e 2 horas.
- Apenas uma sessão ativa por administrador, protegida também por índice único
  parcial no banco.
- Expiração automática efetiva em todas as RPCs do fluxo, além de encerramento
  manual com justificativa.
- Contexto sanitizado e somente leitura com identificação da organização,
  métricas agregadas, assinatura e os dez campeonatos mais recentes.
- Sem impersonação de usuário, ampliação de RLS, escrita em dados do tenant ou
  operações financeiras.
- Início, consulta, expiração e encerramento registrados em
  `admin_audit_logs`.
- Tabela canônica sem acesso direto por `anon` ou `authenticated`; todas as
  operações passam por RPCs `SECURITY DEFINER` que revalidam o administrador de
  plataforma.
- Banner persistente enquanto houver uma sessão ativa e tela administrativa em
  `/system-admin/suporte`.
- Migration
  `supabase/migrations/20260728090000_phase6_support_mode_foundation.sql`.
- Verificação estrutural, de privilégios e de bloqueio a usuário comum em
  `supabase/tests/phase6_support_mode_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes.
- `npm run test`: 12 arquivos e 50 testes aprovados.
- `npm run build`: aprovado para cliente e SSR.
- `npm run security:env`: aprovado.
- `git diff --check`: aprovado.

Gate remoto pendente:

1. Aplicar `20260728090000_phase6_support_mode_foundation.sql`.
2. Executar `phase6_support_mode_verification.sql`.
3. Validar em sessão autenticada que usuário comum recebe bloqueio e que um
   administrador consegue iniciar, consultar e encerrar uma sessão.
4. Confirmar no banco os eventos de início, consulta, expiração e encerramento
   em `admin_audit_logs`.

Continuação de `F6-RF05`:

- Qualquer futura operação de escrita em nome do suporte exige requisito
  separado, autorização explícita, confirmação reforçada e RPC própria
  auditada; esta primeira fatia permanece deliberadamente somente leitura.

## F6-RF06 — Auditoria administrativa

Implementado em 28/07/2026:

- Consulta paginada e pesquisável de `admin_audit_logs`, separada da auditoria
  de domínio dos campeonatos.
- Filtros por texto, responsável, ação, tipo de alvo, categoria de alerta e
  período.
- Alertas classificados para plano/assinatura, suspensão, modo suporte e
  alterações privilegiadas, com severidades informativa, atenção e crítica.
- Dados antigos, novos e de contexto sanitizados recursivamente antes de sair
  do banco; chaves de senha, segredo, token, autorização, cookie e chaves de API
  ou privadas são mascaradas.
- Tabela bruta permanece sem acesso direto por `anon` ou `authenticated`; a
  leitura ocorre exclusivamente por RPC `SECURITY DEFINER` que revalida o
  administrador geral.
- Imutabilidade preservada por trigger e novo índice por ação e data para os
  filtros operacionais.
- Política de retenção definida como preservação indefinida, sem exclusão
  automática, até aprovação de prazo jurídico e operacional.
- Tela habilitada em `/system-admin/auditoria`.
- Migration
  `supabase/migrations/20260728120000_phase6_admin_audit_directory.sql`.
- Verificação estrutural, de privilégios, sanitização recursiva e bloqueio a
  usuário comum em
  `supabase/tests/phase6_admin_audit_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes.
- `npm run test`: 12 arquivos e 50 testes aprovados.
- `npm run build`: aprovado para cliente e SSR.
- `npm run security:env`: aprovado.
- `git diff --check`: aprovado.

Gate remoto pendente:

1. Aplicar `20260728120000_phase6_admin_audit_directory.sql`.
2. Executar `phase6_admin_audit_verification.sql`.
3. Validar que um usuário comum recebe bloqueio e que o administrador geral
   consegue pesquisar, combinar filtros e paginar os registros.
4. Confirmar a classificação dos eventos existentes de System Admin e modo
   suporte e o mascaramento de campos sensíveis em objetos aninhados.

Continuação de `F6-RF06`:

- Um prazo finito de retenção e qualquer rotina de expurgo dependem de decisão
  jurídica/operacional explícita e devem preservar evidências ou gerar arquivo
  imutável antes de qualquer exclusão.

## F6-RF07 — Observabilidade e operação (primeira fatia)

Implementado em 28/07/2026:

- Coleta deduplicada de erros globais do cliente, integrada ao error boundary e
  aos eventos `error` e `unhandledrejection`.
- Telemetria sem mensagem, stack trace, query string ou payload: somente código
  normalizado, fingerprint, rota sem parâmetros, responsável e horário.
- Rate limit de 20 eventos por hora por usuário autenticado.
- Tabela operacional sem acesso direto por `anon` ou `authenticated`.
- Painel em `/system-admin/configuracoes`, protegido pelo papel de administrador
  geral e atualizado automaticamente a cada minuto.
- Health checks autoritativos dos catálogos PostgreSQL, Supabase Auth e Storage.
- Estado explícito das dependências de e-mail, cobrança e coleta de erros.
- Métricas de eventos, erros, severidade, RPC, autenticação, jobs e webhooks nas
  últimas 24 horas, além de latência média e p95 quando houver amostra.
- Atividade real do banco, incluindo commits, rollbacks, deadlocks e data de
  reset das estatísticas.
- Medição real de tamanho do banco, Storage e quantidade de objetos, sem
  estimativas fictícias de custo.
- Alertas com severidade e runbooks versionados para triagem de incidente,
  contenção no banco e validação de backup/restauração.
- RPO, RTO e teste de restauração exibidos honestamente como pendentes, pois o
  PRD exige decisão operacional explícita.
- Migration
  `supabase/migrations/20260728150000_phase6_operational_observability.sql`.
- Verificação estrutural, de privilégios e bloqueio de acesso indevido em
  `supabase/tests/phase6_operational_observability_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes.
- `npm run test`: 12 arquivos e 50 testes aprovados.
- `npm run build`: aprovado para cliente e SSR.
- `npm run security:env`: aprovado.
- `git diff --check`: aprovado.

Gate remoto pendente:

1. Aplicar `20260728150000_phase6_operational_observability.sql`.
2. Executar `phase6_operational_observability_verification.sql`.
3. Validar o painel com um administrador geral e o bloqueio para usuário comum.
4. Gerar um erro controlado em sessão autenticada e confirmar a coleta sem
   mensagem, stack trace ou parâmetros de URL.
5. Definir e aprovar metas de RPO e RTO.
6. Restaurar um backup em ambiente descartável, medir tempos e registrar
   evidências de integridade e RLS.

Continuação de `F6-RF07`:

- Falhas de servidor, RPC, autenticação, jobs e webhooks dependem de
  instrumentação nos respectivos runtimes ou provedores. A tabela já aceita
  esses eventos, mas o painel não simula amostras inexistentes.
- Valores financeiros de banco, Storage, e-mail e cobrança dependem das APIs de
  billing dos provedores; esta fatia expõe somente consumo autoritativo.
