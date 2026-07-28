# Relatório parcial — Fase 5

Data: 27/07/2026

## Ponto de continuidade

Os gaps funcionais locais da Fase 4 foram concluídos em 26/07/2026. O histórico
remoto foi reconciliado até a migration
`20260727120000_phase5_finance_foundation.sql`, aplicada diretamente no banco.
O incremento de auditoria iniciado abaixo permanece somente local.

Este incremento inicia a Fase 5 pelo domínio financeiro, substituindo a tela
demonstrativa por uma fatia vertical real e contextualizada por campeonato.

## Entregue neste incremento

- rota `/championships/$id/finance` habilitada no cockpit do campeonato;
- rota global antiga `/finance` redirecionada para a seleção de campeonato,
  evitando duas fontes de verdade;
- receitas e despesas persistidas com categoria, descrição, competência,
  vencimento, valor, status, favorecido/pagador e observação;
- filtros por período, status, tipo e categoria;
- totais de receitas, despesas, saldo realizado e saldo projetado calculados no
  backend exclusivamente a partir de transações reais;
- baixa, estorno e cancelamento transacionais, com bloqueio concorrente,
  justificativa e trilha de auditoria;
- registros pagos/cancelados imutáveis pela edição comum e sem exclusão física;
- suporte a origem externa idempotente para futuras integrações com inscrição,
  patrocínio e arbitragem;
- comprovantes privados em Storage, limitados a 10 MB e aos tipos PDF, JPG, PNG e
  WebP, com URLs temporárias;
- exportação CSV do resultado filtrado;
- RLS e RPCs financeiras restritas a `owner` e `admin`; `editor`, `viewer`,
  equipe e acesso anônimo falham de forma fechada enquanto não existir permissão
  financeira granular explícita;
- teste SQL estrutural e de privilégios da fundação financeira;
- testes unitários da serialização CSV.

## Decisão de segurança

O helper legado `can_administer_org` também inclui `editor`. O PRD autoriza esse
papel no financeiro apenas mediante permissão explícita. Como a permissão
granular ainda não existe, foi criado `can_manage_finance`, restrito a `owner` e
`admin`, para impedir elevação acidental de privilégio.

## Reconciliação do schema legado

O schema remoto já possuía `financial_transactions` com as colunas
`occurred_on`, `due_on` e `paid_on`. A migration foi ajustada para:

- adicionar todas as colunas da Fase 5 antes de criar índices e constraints;
- migrar os valores legados sem apagar ou duplicar lançamentos;
- preservar `payment_id` e `referee_assignment_id` como origens idempotentes;
- sincronizar atomicamente os contratos legado e atual por trigger;
- interromper com erro explícito caso existam status ou tipos legados
  incompatíveis, em vez de converter dados financeiros silenciosamente.

## Itens ainda necessários para concluir F5-RF01

- aplicar a migration em homologação e regenerar oficialmente os tipos Supabase;
- executar `supabase/tests/phase5_finance_verification.sql`;
- testar RLS com owner, admin, editor, viewer, outro tenant e acesso anônimo;
- validar concorrência de baixa/estorno e duplicidade por origem;
- executar E2E autenticado e validação visual responsiva;
- decidir e implementar integrações opcionais com inscrições, patrocinadores e
  arbitragem sem duplicar lançamentos.

## Próximas fatias da Fase 5

- organização, convites, papéis e proteção do último owner;
- visões globais reais de equipes e atletas;
- notificações internas idempotentes e preferências.

## Incremento de continuidade — Auditoria

- `audit_logs` preservada como fonte canônica, agora com vínculo explícito e
  indexado ao campeonato;
- backfill contextual de eventos das Fases 1–5 a partir dos recursos de origem;
- sanitização recursiva de senhas, tokens, documentos, contatos e caminhos
  privados em dados antigos e novos;
- bloqueio de update/delete para clientes, preservando retenção controlada por
  `service_role`;
- leitura e exportação restritas a `owner` e `admin`;
- tela `/championships/$id/audit` com paginação e filtros por ator, ação,
  módulo, recurso, ID e período;
- detalhes sanitizados de antes/depois/contexto;
- exportação CSV limitada a 5.000 registros por consulta;
- política de retenção padrão de 60 meses, configurável entre 12 e 120 meses;
- verificação SQL específica e testes unitários da serialização CSV.

Migração e verificação SQL executadas com sucesso diretamente no banco em
27/07/2026.

## Incremento de continuidade — Configurações operacionais

- rota `/championships/$id/settings` separada da configuração esportiva da
  Fase 2;
- identidade administrativa, contato, período, localização, idioma e fuso
  horário;
- preferências de notificações internas sem prometer entrega por e-mail antes
  da validação de SMTP;
- allowlist explícita das integrações financeiras opcionais;
- leitura e alteração restritas a `owner` e `admin`, inclusive no RLS direto de
  `championships`;
- alterações registradas na auditoria de governança;
- arquivamento com nome digitado e justificativa, removendo a exposição pública
  sem apagar histórico;
- exclusão física exclusiva do `owner`, também com confirmação reforçada,
  justificativa e bloqueio por dependências;
- remoção do fluxo antigo de exclusão direta na lista de campeonatos;
- verificação SQL de estrutura/privilégios e testes unitários das validações.

## Gate de liberação

Os incrementos de auditoria e configurações operacionais concluíram a aplicação
e a verificação remotas em 27/07/2026. As migrations `20260727150000` e
`20260727200000` também foram reconciliadas no histórico remoto do Supabase.

## Incremento de continuidade — Organização e usuários

- rotas `/settings/organization` e `/settings/users` integradas ao Organizer
  Shell;
- seleção explícita da organização administrável, sem assumir um tenant global;
- edição auditada dos dados institucionais por `owner` e `admin`;
- papel efetivo determinístico para reconciliar os registros legados que
  permitiam múltiplas funções por usuário;
- convites com expiração, reenvio limitado, revogação justificada e vínculo
  automático no cadastro;
- usuários já cadastrados são vinculados sem duplicar identidade;
- `admin` limitado a gerenciar `editor` e `viewer`; promoção para `owner` é
  exclusiva de outro `owner`;
- proteção transacional contra remoção ou rebaixamento do último proprietário;
- escritas diretas em organizações, membros, funções e convites revogadas dos
  clientes autenticados; mutações passam por RPCs auditadas;
- verificação SQL estrutural/de privilégios e testes unitários das regras
  compartilhadas com a interface.

## Gate do incremento Organização e usuários

Permanecem necessários: aplicar
`20260727213000_phase5_organization_users.sql`, executar
`supabase/tests/phase5_organization_users_verification.sql`, regenerar os tipos
Supabase e validar em ambiente autenticado os perfis owner, admin, editor,
viewer, outro tenant, último owner e entrega real de e-mail pelo SMTP.

## Incremento de continuidade — Visões globais de equipes e atletas

- `/teams` e `/athletes` deixaram de ser placeholders no Organizer Shell;
- seleção explícita entre todas as organizações das quais o usuário é membro,
  incluindo acesso somente leitura de `viewer`;
- busca normalizada, filtro por status e campeonato e paginação com contagem
  real;
- detalhes em `/teams/$teamId` e `/athletes/$athleteId`, preservando a
  organização no contexto da navegação;
- participações consultadas exclusivamente em `championship_teams` e
  `championship_team_athletes`, sem criar cadastros paralelos;
- navegação direta de cada vínculo para o campeonato correspondente;
- consultas sempre combinam `organization_id` com o recurso solicitado e
  continuam protegidas pelo RLS existente;
- dados sensíveis de atletas, como documentos e contatos privados, não são
  selecionados pela visão global;
- nenhuma migration adicional foi necessária para este incremento;
- testes unitários dos helpers de paginação, idade e apresentação dos vínculos.

## Gate do incremento Visões globais

Permanecem necessários os testes autenticados com owner, admin, editor, viewer e
usuário de outro tenant, além da validação visual responsiva com volume real de
equipes, atletas e participações.
