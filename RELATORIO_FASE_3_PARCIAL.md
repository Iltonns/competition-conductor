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
- sanções manuais e suspensões automáticas por cartões conforme o regulamento;
- revogação justificada e revogação automática quando o cartão de origem é removido;
- rotas `/championships/$id/referees` e `/championships/$id/sanctions` no cockpit;
- policies somente de leitura para membros e mutações críticas exclusivamente via RPCs autorizadas;
- teste SQL de presença, privilégios e triggers da Fase 3.

## Validação local

- `npm run typecheck`: aprovado;
- `npm run lint`: zero erros e oito avisos preexistentes de Fast Refresh;
- `npm run test`: 32 testes aprovados;
- `npm run build`: aprovado;
- `git diff --check`: aprovado, com apenas avisos de normalização LF/CRLF.

## Validação remota

- projeto vinculado: `lzjkvgvlfupklpmytvbr`;
- migrations das Fases 1, 2 e 3 aplicadas em ordem em 21/07/2026;
- histórico local e remoto reconciliado até `20260721170000`;
- `phase3_sports_operations_verification.sql`: aprovado no banco remoto;
- tipos TypeScript regenerados a partir do schema remoto.

## Itens ainda necessários para concluir a Fase 3

- CRUD de indisponibilidades e confirmação/recusa da escala pelo árbitro;
- escalação da comissão técnica na súmula;
- substituições estruturadas com atleta de entrada e saída;
- anexos reais em Storage com regras de tipo e tamanho;
- integração do pagamento de arbitragem ao módulo financeiro da Fase 5;
- E2E autenticado da jornada completa e conferência visual do PDF homologado.

## Gate remoto

A migration foi aplicada ao projeto remoto e a verificação estrutural foi aprovada. Ainda é necessário validar RLS com papéis distintos e testar concorrência de homologação/reabertura antes de considerar o gate completo.
