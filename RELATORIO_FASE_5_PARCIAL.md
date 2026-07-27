# Relatório parcial — Fase 5

Data: 27/07/2026

## Ponto de continuidade

Os gaps funcionais locais da Fase 4 foram concluídos em 26/07/2026. O gate remoto
da migration `20260726120000_phase4_gallery_broadcast_sponsor_media.sql` ainda
depende de autenticação administrativa válida na CLI do Supabase.

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

- auditoria de domínio com paginação, filtros, exportação restrita e retenção;
- configurações operacionais e arquivamento do campeonato;
- organização, convites, papéis e proteção do último owner;
- visões globais reais de equipes e atletas;
- notificações internas idempotentes e preferências.

## Gate de liberação

Este incremento está implementado localmente, mas não deve ser liberado em
produção antes da aprovação dos gates remotos pendentes das Fases 4 e 5.
