# Etapa 2B — Fundação administrativa e CRUD de equipes

## Escopo implementado

- Cadastro administrativo completo de equipes, contextualizado pelo campeonato.
- Relação canônica por `championship_teams`; `teams.championship_id` permanece legado.
- Backfill idempotente dos vínculos legados, sem remoção de dados.
- RPCs transacionais para criar, atualizar, arquivar, restaurar e remover vínculo sem histórico.
- RLS por associação e papel; `owner`, `admin` e `editor` escrevem, `viewer` somente lê.
- Rotas de lista, criação, detalhe e edição, com loading, vazio, erro recuperável e responsividade.

## Decisões

- Uma equipe pode participar de vários campeonatos. Arquivamento atua no vínculo, preservando o cadastro e o histórico.
- Remoção física do vínculo é bloqueada quando a equipe possui partidas no campeonato.
- Não foi adicionada `pg_trgm`: a extensão não consta no baseline e uma extensão nova não se justifica nesta etapa. A busca atual ocorre sobre o conjunto autorizado já carregado.
- `audit_logs` não existe no schema versionado. Não foi criado sistema improvisado; integração de logs de domínio permanece pendente para a fundação oficial de auditoria.
- O `group_id` remoto existente foi preservado porque está ligado a `competition_groups`. A migration não o recria no baseline local, onde essa estrutura ainda não existe.

## Aplicação e validação

A migration `20260715190000_teams_admin_foundation.sql` deve ser validada primeiro em ambiente descartável. Ela interrompe se detectar vínculos cross-tenant ou dados que violem as novas constraints.

Após aplicar, regenere os tipos oficiais do Supabase e execute `tests/2b_teams_rls_verification.sql`. O script é transacional e termina em `ROLLBACK`.
