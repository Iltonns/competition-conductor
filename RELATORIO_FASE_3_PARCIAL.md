# Relatório parcial — Fase 3

Data: 21/07/2026

## Ponto de continuidade

As Fases 0, 1 e 2 estavam implementadas localmente. Este incremento inicia a Fase 3 do PRD e entrega uma primeira fatia vertical de operação esportiva oficial.

## Entregue neste incremento

- escalações de titulares e reservas, com capitão, elegibilidade, limites do regulamento e bloqueio após o início;
- rejeição de atleta arquivado, sem inscrição aprovada ou com sanção ativa no backend;
- súmula versionada com placar, acréscimos, observações, eventos e escalações;
- homologação separada de `finished`, snapshot imutável, bloqueio e reabertura justificada/auditada;
- saída imprimível da versão homologada, permitindo salvar como PDF pelo navegador;
- cadastro e designação de árbitros, valor previsto e detecção de indisponibilidade/conflito de horário;
- CRUD de períodos de indisponibilidade, com bloqueio de conflito contra escalas pendentes ou confirmadas;
- confirmação e recusa de designações, com justificativa obrigatória, revalidação de agenda e auditoria;
- sanções manuais e suspensões automáticas por cartões conforme o regulamento;
- revogação justificada e revogação automática quando o cartão de origem é removido;
- rotas `/championships/$id/referees` e `/championships/$id/sanctions` no cockpit;
- policies somente de leitura para membros e mutações críticas exclusivamente via RPCs autorizadas;
- teste SQL de presença, privilégios e triggers da Fase 3.

### Incremento de continuidade — 22/07/2026

- escalação da comissão técnica por equipe, limitada pelo regulamento e restrita a membros ativos e não suspensos;
- substituições estruturadas com atleta de saída, atleta de entrada, minuto e período, validadas contra titulares e reservas da escalação;
- anexos reais em bucket privado do Storage, com URLs temporárias, limite de 10 MB e tipos PDF, JPG, PNG e WebP;
- comissão, substituições, arbitragem e anexos incorporados ao snapshot imutável da súmula homologada;
- correção de uma ambiguidade legada na RPC de escalações identificada pelo lint remoto.

### Incremento de continuidade — 29/07/2026

- removido o último estado global “Em breve” de Arbitragem e o componente de
  placeholder que ficou sem consumidores;
- a rota legada `/referees` agora encaminha para a seleção de campeonatos;
- o módulo permanece canônico em `/championships/$id/referees`, preservando o
  isolamento por organização e campeonato;
- não foi criado marketplace nem um segundo fluxo global de árbitros, conforme
  os limites de escopo e navegação do PRD;
- a integração financeira das designações, antes pendente neste relatório, foi
  entregue na Fase 5 com origem idempotente por `referee_assignment_id`.

### Privacidade e detalhe administrativo de árbitros — 29/07/2026

- implementada a rota prevista no PRD
  `/championships/$id/referees/$refereeId`;
- diretório de arbitragem limitado a identificação, função, foto e status;
- leitura direta de documento, e-mail, telefone, valor padrão, disponibilidade e
  metadados revogada de usuários autenticados;
- detalhe completo exposto somente pela RPC
  `get_referee_management_detail`, protegida pelo contexto administrativo do
  campeonato e pelo vínculo com a organização;
- edição de nome, função, status, contatos, documento e valor padrão reaproveita
  a RPC auditada `save_referee`;
- usuário anônimo não possui acesso ao detalhe e usuário autenticado sem vínculo
  administrativo falha de forma fechada;
- migration
  `supabase/migrations/20260729080000_phase3_referee_privacy_and_detail.sql`;
- verificação estrutural, de privilégios por coluna e de bloqueio em
  `supabase/tests/phase3_referee_privacy_verification.sql`.

Validação local desta entrega:

- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado com 0 erros e 8 avisos preexistentes;
- `npm run test`: 12 arquivos e 50 testes aprovados;
- `npm run build`: aprovado para cliente e SSR;
- `npm run security:env`: aprovado;
- `git diff --check`: aprovado.

Gate remoto pendente:

1. Aplicar `20260729080000_phase3_referee_privacy_and_detail.sql`.
2. Executar `phase3_referee_privacy_verification.sql`.
3. Validar com um administrador a leitura e edição do detalhe.
4. Validar com viewer e usuário de outro tenant que os dados pessoais não podem
   ser consultados.

## Validação local

- `npm run typecheck`: aprovado;
- `npm run lint`: zero erros e oito avisos preexistentes de Fast Refresh;
- `npm run test`: 50 testes aprovados;
- `npm run build`: aprovado;
- `git diff --check`: aprovado, com apenas avisos de normalização LF/CRLF.

## Validação remota

- projeto vinculado: `lzjkvgvlfupklpmytvbr`;
- migrations das Fases 1, 2 e 3 aplicadas em ordem em 21/07/2026;
- histórico local e remoto reconciliado até `20260721213000`;
- `phase3_sports_operations_verification.sql`: aprovado no banco remoto;
- tipos TypeScript regenerados a partir do schema remoto.
- migrations `20260722140000`, `20260722153000` e `20260722154500` aplicadas em 22/07/2026;
- histórico local e remoto reconciliado até `20260722154500`;
- `supabase db lint --linked --schema public --level error`: aprovado sem erros;
- tipos TypeScript regenerados novamente a partir do schema remoto após o incremento.

## Itens ainda necessários para concluir a Fase 3

- E2E autenticado da jornada completa e conferência visual do PDF homologado.

## Gate remoto

A migration foi aplicada ao projeto remoto e a verificação estrutural foi aprovada. Ainda é necessário validar RLS com papéis distintos e testar concorrência de homologação/reabertura antes de considerar o gate completo.
