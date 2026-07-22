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

## Validação local

- `npm run typecheck`: aprovado;
- `npm run lint`: zero erros e oito avisos preexistentes de Fast Refresh;
- `npm run test`: 32 testes aprovados;
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

- integração do pagamento de arbitragem ao módulo financeiro da Fase 5;
- E2E autenticado da jornada completa e conferência visual do PDF homologado.

## Gate remoto

A migration foi aplicada ao projeto remoto e a verificação estrutural foi aprovada. Ainda é necessário validar RLS com papéis distintos e testar concorrência de homologação/reabertura antes de considerar o gate completo.
