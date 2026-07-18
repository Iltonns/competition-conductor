# PRD — Implementação funcional do IS Arena (Fases 0 a 6)

**Produto:** IS Arena  
**Repositório:** `competition-conductor`  
**Status:** Pronto para refinamento e execução  
**Versão:** 1.0  
**Data:** 18/07/2026  
**Horizonte:** Fases 0 a 6  
**Origem:** auditoria funcional e técnica do repositório em 18/07/2026

---

## 1. Resumo executivo

O IS Arena já possui fundações reais de autenticação, multi-tenancy, campeonatos,
equipes, atletas, elenco, comissão técnica, responsáveis e portal de inscrição por
link seguro. Entretanto, o cockpit do campeonato ainda expõe treze módulos como
“Em breve”, há módulos funcionais em rotas transitórias fora do contexto do
campeonato e existem telas demonstrativas alimentadas por dados fixos.

Este PRD organiza a evolução do produto em sete fases sequenciais:

| Fase | Resultado principal |
| --- | --- |
| 0 | Baseline seguro, testável e reproduzível |
| 1 | Partidas, classificação, súmulas básicas e estatísticas dentro do cockpit |
| 2 | Motor completo da competição: configuração, fases, grupos, rodadas e avanço |
| 3 | Operação esportiva: súmula oficial, escalações, arbitragem e sanções |
| 4 | Conteúdo, patrocinadores e página pública totalmente dinâmica |
| 5 | Financeiro, auditoria, configurações e gestão da organização |
| 6 | SaaS completo: planos, limites, administração da plataforma e observabilidade |

A implementação deverá preservar a arquitetura já adotada: React 19, TanStack
Start/Router, TanStack Query, Supabase, Tailwind e componentes existentes. Toda
funcionalidade deve seguir o fluxo **Banco → Serviço → Hook → Interface → Fluxo do
usuário**, com rotas finas, isolamento por organização e operações críticas
transacionais no backend.

---

## 2. Problema

### 2.1 Problema do usuário

O organizador consegue criar campeonatos e cadastrar equipes e atletas, mas não
consegue operar o ciclo completo de uma competição em um único cockpit. Ele ainda
não consegue, de forma integrada:

- configurar regulamento e formato;
- estruturar fases, grupos e rodadas;
- gerar e administrar confrontos;
- homologar súmulas e resultados;
- escalar arbitragem;
- aplicar punições e suspensões;
- publicar conteúdo e dados reais no portal público;
- controlar receitas e despesas;
- rastrear alterações e responsabilidades;
- administrar usuários, limites e assinatura.

### 2.2 Problema técnico

- Partidas, classificação e estatísticas existem em rotas globais transitórias,
  sem o `championshipId` como contexto canônico da URL.
- A pontuação e parte das estatísticas são calculadas no cliente, sem contemplar
  todos os formatos, critérios de desempate e ajustes disciplinares.
- A alteração de placar por evento não é atômica.
- Financeiro, mídia e portal público usam dados demonstrativos.
- Há tabelas de domínio ainda sem camada de serviço, hook ou interface.
- O banco remoto, os tipos gerados e as políticas RLS precisam de uma verificação
  reproduzível antes da expansão.
- O lint não está verde e não há suíte frontend/E2E nem pipeline de CI.
- O arquivo `.env` está versionado e precisa de tratamento seguro.

---

## 3. Objetivos do produto

### 3.1 Objetivo principal

Permitir que uma organização configure, opere, publique, acompanhe e administre
um campeonato de ponta a ponta, com segurança multi-tenant e rastreabilidade.

### 3.2 Objetivos mensuráveis

1. Remover todos os badges “Em breve” do cockpit somente após seus respectivos
   gates de aceite.
2. Garantir que 100% das consultas e mutações administrativas sejam autorizadas
   pelo backend e isoladas por `organization_id`.
3. Fazer com que 100% das rotas internas de campeonato usem
   `/championships/$id/...` como contexto canônico.
4. Eliminar dados demonstrativos de todas as áreas autenticadas e da página
   pública de produção.
5. Tornar atômicas as operações que afetam evento, placar, classificação,
   suspensão, pagamento ou auditoria.
6. Manter TypeScript, lint, testes e build obrigatoriamente verdes no CI.
7. Possibilitar a execução dos fluxos críticos em dispositivos móveis.

### 3.3 Indicadores de sucesso

- Percentual de campeonatos publicados sem intervenção técnica.
- Tempo entre criação do campeonato e publicação da primeira tabela.
- Percentual de partidas encerradas com súmula homologada.
- Incidentes de vazamento cross-tenant: meta zero.
- Divergências entre eventos, placar e classificação: meta zero.
- Taxa de sucesso dos fluxos E2E críticos: 100% antes de cada release.
- Erros não tratados por 1.000 sessões autenticadas.
- Tempo p95 das consultas principais: alvo inicial inferior a 1 segundo no
  backend, excluindo latência de rede do cliente.

---

## 4. Personas e papéis

| Persona/papel | Necessidade principal |
| --- | --- |
| Owner da organização | Controle total, usuários, assinatura e configurações críticas |
| Admin | Operar todos os módulos esportivos e administrativos permitidos |
| Editor | Cadastrar e editar conteúdo operacional sem administrar organização/assinatura |
| Viewer | Consultar dados internos sem mutações |
| Responsável de equipe | Preencher apenas os dados e documentos autorizados da própria equipe |
| Árbitro | Consultar escala e, futuramente, participar do fluxo de súmula autorizado |
| Visitante público | Consultar somente conteúdo publicado e expressamente público |
| System admin | Administrar a plataforma, com acesso privilegiado auditado e fail-closed |

### 4.1 Matriz mínima de autorização

| Capacidade | Owner | Admin | Editor | Viewer | Equipe | Público |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Configurar competição | Sim | Sim | Conforme permissão | Não | Não | Não |
| Gerenciar equipes e inscrições | Sim | Sim | Sim | Não | Própria equipe | Não |
| Operar partidas/súmulas | Sim | Sim | Sim | Não | Não | Não |
| Homologar/reabrir súmula | Sim | Sim | Conforme permissão explícita | Não | Não | Não |
| Gerenciar financeiro | Sim | Sim | Conforme permissão explícita | Não | Não | Não |
| Ver auditoria | Sim | Sim | Não | Não | Não | Não |
| Administrar membros/assinatura | Sim | Não, salvo delegação explícita | Não | Não | Não | Não |
| Consultar conteúdo publicado | Sim | Sim | Sim | Sim | Sim | Sim |

As políticas RLS e RPCs são a fonte de autoridade. Ocultar botões no frontend não
é controle de acesso.

---

## 5. Princípios e contratos obrigatórios

### 5.1 Multi-tenancy

- Toda entidade administrativa deverá possuir ou derivar inequivocamente um
  `organization_id`.
- Reads e mutations deverão validar `organization_id` e o identificador do
  recurso. Nunca confiar apenas em um UUID recebido pelo cliente.
- Relações entre campeonato, equipe, atleta, partida e demais entidades não
  poderão cruzar organizações.
- Usuários `viewer` serão somente leitura.
- Acesso público usará grants/policies/views específicos; nunca reutilizará uma
  credencial administrativa.

### 5.2 Contexto de campeonato

- A URL `/championships/$id/...` é a fonte de verdade do campeonato ativo.
- O seletor de campeonato navega; ele não mantém um campeonato global paralelo.
- Query keys devem conter `organizationId` e `championshipId` quando aplicável.
- Ao trocar o parâmetro da URL, a interface não pode exibir dados residuais do
  campeonato anterior.

### 5.3 Arquitetura de feature

Cada módulo novo deverá, quando aplicável, seguir:

```text
src/features/<modulo>/
  api/ ou services/     acesso ao Supabase/RPC
  hooks/                TanStack Query e mutations
  schemas/              validação Zod
  types/                contratos de domínio
  components/           interface reutilizável
  utils/                regras puras e formatadores
```

As rotas devem apenas resolver parâmetros, montar layout e compor componentes.

### 5.4 Operações transacionais

Devem ser RPCs/funções transacionais, no mínimo:

- criar estrutura completa de competição;
- gerar/regenerar rodadas e confrontos;
- registrar/remover evento que altere placar;
- finalizar, homologar e reabrir súmula;
- recalcular classificação;
- avançar classificados para a próxima fase;
- aplicar/revogar sanção ou suspensão;
- efetuar baixa/estorno financeiro quando houver efeitos relacionados;
- executar ações de suporte privilegiado.

### 5.5 Migrations

- Aditivas e idempotentes sempre que o remoto puder conter estruturas parciais.
- Sem limpeza destrutiva automática de dados divergentes.
- Policies, triggers, índices e constraints também devem ser reconciliáveis.
- Toda migration deve ter validação prévia, rollback operacional documentado e
  teste RLS correspondente.
- Tipos oficiais do Supabase devem ser regenerados depois da aplicação.

### 5.6 Interface

- Reutilizar o design system e os componentes existentes; não realizar redesign.
- Todas as telas precisam de estados de loading, vazio, erro recuperável,
  sucesso e permissão insuficiente.
- Ações destrutivas exigem confirmação clara e feedback.
- Menus, diálogos e tabelas devem ser operáveis em desktop e mobile.
- Um item só muda para `available: true` quando o gate da feature estiver aprovado.

---

## 6. Escopo global e não escopo

### 6.1 Dentro do escopo

- Todos os itens “Em breve” do Championship Shell.
- Equipes/atletas globais, organização e usuários no Organizer Shell.
- Assinatura, limites e página da organização.
- System Admin Shell e seus módulos.
- Segurança, RLS, testes, CI, auditoria e observabilidade necessários à produção.

### 6.2 Fora do escopo inicial, salvo decisão posterior

- Aplicativo móvel nativo.
- Marketplace de árbitros ou equipes.
- Streaming de vídeo hospedado diretamente pela plataforma.
- Contabilidade fiscal completa ou emissão de nota fiscal.
- Folha de pagamento.
- IA para geração automática de notícias.
- Integrações com federações que não tenham contrato/API definidos.
- Sistema de ingressos/bilheteria, exceto registro financeiro manual.

Links externos de transmissão e lançamentos financeiros manuais fazem parte do
escopo; processamento de pagamentos e bilheteria exigem decisão específica.

---

## 7. Fase 0 — Segurança, qualidade e baseline

### 7.1 Objetivo

Criar uma base segura, reproduzível e testável para que as fases seguintes não
amplifiquem riscos de segredo, schema drift, RLS incorreta ou regressões.

### 7.2 Requisitos funcionais e técnicos

#### F0-RF01 — Tratamento do `.env`

- Classificar variáveis como públicas ou secretas sem expor seus valores.
- Rotacionar qualquer segredo que tenha sido versionado.
- Remover `.env` do índice do Git sem reescrever histórico publicado.
- Adicionar `.env` ao `.gitignore`.
- Criar `.env.example` apenas com nomes e instruções seguras.
- Garantir que service role e segredos administrativos existam somente no
  runtime servidor.

#### F0-RF02 — Reconciliação do banco

- Auditar schema local versus remoto.
- Confirmar migrations aplicadas e corrigir documentação desatualizada.
- Validar tabelas, colunas, enums, constraints, FKs, índices, triggers, grants,
  policies, buckets e RPCs.
- Regenerar `src/integrations/supabase/types.ts` oficialmente.
- Proibir casts usados apenas para contornar tipos desatualizados.

#### F0-RF03 — Matriz RLS

Testar de forma autenticada:

- owner, admin, editor e viewer da organização A;
- membro e não membro da organização B;
- usuário autenticado sem organização;
- acesso anônimo;
- link de equipe válido, expirado, bloqueado e revogado;
- tentativas de referência cross-tenant.

#### F0-RF04 — Qualidade e CI

- Corrigir todos os erros de lint.
- Manter `tsc --noEmit`, lint e build verdes.
- Criar testes unitários para regras puras existentes.
- Criar teste E2E mínimo de autenticação, campeonato, equipe e inscrição.
- Criar workflow de CI sem deploy automático nesta fase.
- Impedir merge quando um gate obrigatório falhar.

#### F0-RF05 — Baseline operacional

- Definir logging estruturado de erros no servidor.
- Definir identificação de request/operação sem registrar tokens ou PII sensível.
- Documentar backup, restauração e rollback de migration.
- Criar checklist de release e incident response mínimo.

### 7.3 Critérios de aceite

- `.env` não está mais versionado nem elegível para novo commit.
- Segredos potencialmente expostos foram rotacionados.
- Nenhum segredo administrativo aparece no bundle cliente.
- Tipos oficiais correspondem ao schema remoto validado.
- Todos os casos da matriz RLS passam e terminam sem dados persistidos de teste.
- TypeScript, lint, testes e build passam no CI.
- Um segundo tenant de teste não consegue ler nem alterar recursos do primeiro.
- Documentação ETAPA-2A/2B/2C reflete o estado real.

### 7.4 Gate de saída

Nenhuma feature das fases 1 a 6 será considerada pronta para produção enquanto a
Fase 0 não estiver aprovada.

### 7.5 Estimativa

3 a 5 dias úteis, sem contar tempo externo de rotação de credenciais ou acesso ao
projeto remoto.

---

## 8. Fase 1 — Consolidação do núcleo já existente

### 8.1 Objetivo

Levar Partidas, Classificação, Súmulas básicas e Estatísticas para dentro do
cockpit do campeonato, eliminando rotas transitórias e dados contextuais ambíguos.

### 8.2 Rotas-alvo

```text
/championships/$id/matches
/championships/$id/matches/$matchId
/championships/$id/matches/$matchId/report
/championships/$id/standings
/championships/$id/stats
```

### 8.3 Requisitos

#### F1-RF01 — Partidas contextualizadas

- Listar somente partidas do campeonato da URL.
- Criar, editar, reagendar, cancelar e excluir quando permitido.
- Validar que mandante e visitante participam do campeonato.
- Impedir equipe contra ela mesma.
- Suportar data/hora, local, fase textual legada e rodada textual durante a
  transição para a Fase 2.
- Exibir filtros de status, data, equipe e rodada.

#### F1-RF02 — Eventos e placar atômicos

- Substituir o fluxo cliente de inserção + atualização de placar por RPC.
- Recalcular o placar a partir dos eventos válidos, sem incremento cego.
- Remover evento e reverter o placar na mesma transação.
- Rejeitar atleta/equipe que não pertençam ao contexto da partida.
- Tornar as operações idempotentes contra duplo clique/retry.

#### F1-RF03 — Ciclo básico da partida

Estados mínimos:

```text
scheduled → live → finished
scheduled/live → postponed|cancelled
finished → reaberta somente por ação autorizada e auditada
```

- Bloquear mutações incompatíveis com o estado.
- Exigir confirmação para finalizar e reabrir.
- Registrar autoria e timestamps das transições.

#### F1-RF04 — Classificação contextualizada

- Mover a interface atual para o cockpit.
- Inicialmente calcular apenas partidas `finished`.
- Usar a configuração padrão 3/1/0 até a Fase 2.
- Persistir/recalcular pelo backend, evitando regra canônica no navegador.
- Exibir posição, equipe, P, J, V, E, D, GP, GC e SG.

#### F1-RF05 — Estatísticas contextualizadas

- Exibir totais, artilharia e cartões usando eventos reais.
- Considerar apenas partidas/eventos válidos do campeonato.
- Tratar gol contra sem atribuí-lo à artilharia.
- Exibir estados vazios sem dados demonstrativos.

#### F1-RF06 — Remoção das rotas transitórias

- Atualizar links internos e quick actions.
- Remover ou redirecionar `/matches`, `/standings` e `/stats` após confirmação de
  que não existem consumidores externos.
- Não manter duas implementações independentes da mesma regra.

### 8.4 Critérios de aceite

- Trocar de campeonato pela URL troca todos os dados exibidos.
- Nenhuma consulta de Partidas/Classificação/Estatísticas é executada sem
  campeonato e organização válidos.
- Dois registros simultâneos de gol não causam perda de atualização.
- Remover um gol deixa evento, placar e classificação consistentes.
- Viewer não altera dados; usuário de outro tenant não acessa a partida.
- Rotas e menus funcionam em desktop e mobile.
- Os quatro itens correspondentes deixam de mostrar “Em breve”.
- Testes E2E cobrem criar partida, registrar gol, finalizar e visualizar tabela.

### 8.5 Dependências

- Fase 0 aprovada.
- Schema remoto de partidas e eventos reconciliado.

### 8.6 Estimativa

1 a 2 semanas.

---

## 9. Fase 2 — Motor da competição

### 9.1 Objetivo

Permitir configurar o regulamento esportivo e estruturar uma competição com
fases, grupos, rodadas, confrontos e avanço controlado.

### 9.2 Rotas-alvo

```text
/championships/$id/configuration
/championships/$id/structure
/championships/$id/structure/stages/$stageId
```

### 9.3 Requisitos

#### F2-RF01 — Configuração geral

Editar e validar:

- formato: pontos corridos, grupos, eliminatória ou grupos + eliminatória;
- quantidade de grupos e classificados por grupo;
- turno único ou ida/volta;
- terceiro lugar;
- empate, prorrogação e pênaltis;
- pontos por vitória, empate e derrota;
- critérios de desempate ordenáveis;
- placar de WO;
- descanso mínimo;
- limites e requisitos de elenco;
- janela de inscrição;
- regras de idade, documentos, foto e camisa;
- mudanças de elenco após início;
- cartões para suspensão;
- regras personalizadas textuais.

#### F2-RF02 — Publicação e travas

- Estados mínimos: `draft`, `published`, `finished`, `archived`.
- Publicar somente se o checklist mínimo estiver válido.
- Definir quais configurações ficam bloqueadas após a primeira partida iniciada.
- Alterações excepcionais precisam de confirmação e auditoria.

#### F2-RF03 — Fases

- Criar, editar, ordenar, ativar e arquivar fases.
- Definir tipo, sequência, datas e regras de avanço.
- Impedir sequência duplicada ou relação cross-tenant.
- Não permitir exclusão física de fase com partidas/histórico.

#### F2-RF04 — Grupos

- Criar grupos manualmente ou a partir da configuração.
- Distribuir equipes manualmente.
- Oferecer sorteio somente depois de definir regra reproduzível.
- Impedir equipe duplicada na mesma fase.
- Registrar a versão/resultado de cada geração ou sorteio.

#### F2-RF05 — Rodadas e confrontos

- Gerar confrontos para turno único e ida/volta.
- Validar descanso mínimo e conflitos de equipe.
- Permitir ajustes manuais sem perder rastreabilidade.
- Preview obrigatório antes de persistir geração em massa.
- Regeneração não pode apagar partidas com eventos ou súmula.

#### F2-RF06 — Classificação configurável

- Aplicar pontuação configurada.
- Aplicar critérios de desempate na ordem configurada.
- Separar classificação por fase e grupo.
- Suportar ajustes manuais/punições com justificativa e auditoria.
- Exibir claramente quando a tabela está provisória ou homologada.

#### F2-RF07 — Avanço entre fases

- Calcular classificados conforme regra da fase.
- Mostrar preview antes da confirmação.
- Persistir a origem da classificação/vaga.
- Gerar chave eliminatória conforme seeding definido.
- Impedir avanço repetido ou divergente sem reabertura autorizada.

### 9.4 Critérios de aceite

- Um organizador cria do zero campeonatos nos quatro formatos suportados.
- A geração round-robin não duplica confronto e respeita ida/volta.
- A classificação usa pontuação e desempates configurados.
- Uma competição iniciada não aceita alteração destrutiva silenciosa de formato.
- Regenerar a estrutura nunca apaga partida com histórico.
- Avanço entre fases é transacional, idempotente e auditado.
- Configuração e Estrutura deixam de mostrar “Em breve”.
- Testes unitários cobrem geração, desempates, WO e avanço.

### 9.5 Dependências

- Fases 0 e 1 aprovadas.
- Decisão final sobre formatos e critérios de desempate da primeira versão.

### 9.6 Estimativa

2 a 4 semanas.

---

## 10. Fase 3 — Operação esportiva

### 10.1 Objetivo

Transformar a partida básica em operação esportiva oficial, com escalação,
súmula, arbitragem, sanções, homologação e rastreabilidade.

### 10.2 Rotas-alvo

```text
/championships/$id/matches/$matchId/report
/championships/$id/referees
/championships/$id/referees/$refereeId
/championships/$id/sanctions
```

### 10.3 Requisitos

#### F3-RF01 — Escalações

- Selecionar titulares e reservas entre atletas elegíveis.
- Validar inscrição, arquivamento, suspensão e limites da competição.
- Registrar capitão e goleiro quando aplicável.
- Bloquear alterações após o início, salvo reabertura autorizada.

#### F3-RF02 — Súmula completa

- Cabeçalho oficial da partida.
- Escalações, comissão, arbitragem e local.
- Gols, cartões, substituições, ocorrências e acréscimos.
- Resultado regulamentar, prorrogação e pênaltis quando aplicável.
- Observações e anexos permitidos.
- Histórico de alterações.

#### F3-RF03 — Homologação

- Separar `finished` de `approved/homologated` quando necessário ao domínio.
- Validar pendências antes da homologação.
- Fechar eventos e escalações após homologação.
- Reabertura restrita, justificada e auditada.
- Gerar versão imprimível/PDF da súmula homologada.

#### F3-RF04 — Arbitragem

- CRUD de árbitros e funções.
- Contatos e documentos com acesso restrito.
- Disponibilidade e indisponibilidade.
- Designação por partida e função.
- Detecção de conflito de horário.
- Status de confirmação.
- Valor previsto/pago integrado ao financeiro sem acoplamento obrigatório.

#### F3-RF05 — Sanções e suspensões

- Suspensão automática por cartões conforme configuração.
- Sanção manual com tipo, fundamento, período e justificativa.
- Aplicar a atleta, comissão ou equipe conforme domínio.
- Revogação/redução somente com permissão e auditoria.
- Impedir atleta suspenso de entrar na escalação.

### 10.4 Critérios de aceite

- Uma partida completa é operada da escalação à súmula homologada.
- Atleta não inscrito ou suspenso é rejeitado pelo backend.
- Conflitos de arbitragem são detectados antes da confirmação.
- Reabrir súmula registra autor, data e justificativa.
- PDF corresponde à versão homologada.
- Classificação e estatísticas refletem somente o estado definido pelo produto.
- Súmulas e Arbitragem deixam de mostrar “Em breve”.

### 10.5 Dependências

- Fases 0 a 2 aprovadas.
- Definição de quem pode homologar e reabrir súmula.

### 10.6 Estimativa

2 a 3 semanas.

---

## 11. Fase 4 — Conteúdo, patrocinadores e página pública

### 11.1 Objetivo

Substituir todo conteúdo demonstrativo por dados reais e permitir que o
organizador publique um portal confiável do campeonato.

### 11.2 Rotas-alvo

```text
/championships/$id/media
/championships/$id/sponsors
/championships/$id/public-page
/c/$slug
```

### 11.3 Requisitos

#### F4-RF01 — Notícias

- Criar, editar, visualizar, agendar, publicar, despublicar e arquivar.
- Campos mínimos: título, slug, resumo, corpo, capa, autor, status e datas.
- Slug único dentro do escopo definido.
- Preview antes da publicação.
- Sanitização de conteúdo para evitar XSS.

#### F4-RF02 — Biblioteca de mídia

- Upload de imagem e documento conforme tipos/tamanhos permitidos.
- Metadados, alt text, autoria e data.
- Organização por campeonato.
- Exclusão bloqueada quando o arquivo estiver em uso, ou substituição segura.
- Policies de Storage separando escrita administrativa e leitura pública.

#### F4-RF03 — Transmissões e galerias

- Configurar link externo de transmissão por partida/conteúdo.
- Validar protocolos e domínios para reduzir risco de URL maliciosa.
- Criar galerias e ordenar itens.
- Não hospedar streaming de vídeo nesta versão.

#### F4-RF04 — Patrocinadores

- CRUD com nome, logo, URL, categoria/cota, período, ordem e status.
- Exibição somente quando ativo e dentro do período configurado.
- Upload e substituição segura de logo.

#### F4-RF05 — Configuração da página pública

- Tema, capa, descrição, contatos, redes sociais e seções visíveis.
- Preview administrativo.
- Checklist de publicação.
- Publicar/despublicar com confirmação.
- Não expor campos internos, documentos ou PII.

#### F4-RF06 — Portal `/c/$slug`

- Resolver campeonato real pelo slug.
- Retornar 404 para slug inexistente e estado apropriado para campeonato privado.
- Exibir somente dados publicados: jogos, resultados, tabela, equipes,
  artilharia, notícias, mídia e patrocinadores.
- SEO e Open Graph dinâmicos.
- URLs reais, sem `href="#"` em ações finais.
- Remover dependência de `arena-demo` na rota pública.

### 11.4 Critérios de aceite

- Dois slugs exibem dados e identidade visual de campeonatos diferentes.
- Campeonato rascunho não é exposto anonimamente.
- Visitante anônimo nunca recebe campos privados.
- Conteúdo despublicado deixa de aparecer sem necessidade de novo deploy.
- Upload inválido é rejeitado no cliente e no backend/storage.
- Nenhuma tela desta fase usa arrays demonstrativos.
- Notícias e mídia, Patrocinadores e Página pública deixam de mostrar “Em breve”.

### 11.5 Dependências

- Fases 0 a 3 aprovadas.
- Definição de políticas de publicação e conteúdo público.

### 11.6 Estimativa

2 a 3 semanas.

---

## 12. Fase 5 — Gestão, auditoria e governança

### 12.1 Objetivo

Completar a gestão administrativa do campeonato e da organização, incluindo
financeiro, auditoria, membros, permissões e configurações operacionais.

### 12.2 Rotas-alvo

```text
/championships/$id/finance
/championships/$id/audit
/championships/$id/settings
/teams
/athletes
/settings/organization
/settings/users
```

### 12.3 Requisitos

#### F5-RF01 — Financeiro

- CRUD de receitas e despesas.
- Categoria, descrição, competência, vencimento, pagamento, valor, status,
  favorecido/pagador e observação.
- Anexos de comprovante com acesso privado.
- Filtros por período, status, tipo e categoria.
- Resumo de receitas, despesas, saldo realizado e projetado.
- Baixa e estorno auditados.
- Exportação CSV; PDF somente se houver requisito confirmado.
- Integração opcional com inscrição, patrocínio e arbitragem sem duplicar valores.

#### F5-RF02 — Auditoria de domínio

- Registrar operações críticas com organização, campeonato, ator, ação,
  recurso, timestamp e metadados seguros.
- Quando aplicável, registrar antes/depois sem armazenar segredo ou documento.
- Logs imutáveis para clientes comuns.
- Tela paginada com filtros por usuário, ação, módulo, recurso e período.
- Exportação restrita.
- Política de retenção definida.

#### F5-RF03 — Configurações do campeonato

- Separar claramente regras esportivas da Fase 2 de preferências operacionais.
- Identidade, notificações, integrações permitidas, arquivamento e zona de perigo.
- Arquivar sem apagar histórico.
- Exclusão física somente conforme regra de dependências e confirmação reforçada.

#### F5-RF04 — Organização e usuários

- Exibir e editar dados da organização.
- Convidar, reenviar convite, alterar papel e remover membro.
- Impedir remoção do último owner.
- Impedir escalação de privilégio por owner/admin/editor indevido.
- Registrar todas as alterações de papel.

#### F5-RF05 — Visões globais de equipes e atletas

- `/teams`: listar cadastros da organização e participações por campeonato.
- `/athletes`: listar atletas da organização e vínculos competitivos.
- Busca, filtros, detalhe e navegação para o campeonato.
- Não criar uma segunda fonte canônica de equipes/atletas.

#### F5-RF06 — Notificações

- Definir eventos mínimos: convite, inscrição enviada, revisão solicitada,
  alteração de partida, escala de arbitragem e publicação relevante.
- Preferências por usuário/organização.
- Evitar envio duplicado por retry.
- E-mail depende de SMTP configurado e validado; notificações internas podem ser
  entregues primeiro.

### 12.4 Critérios de aceite

- Dashboard financeiro reflete exclusivamente transações reais.
- Viewer e equipe não acessam dados financeiros ou logs administrativos.
- Estorno preserva histórico e atualiza totais corretamente.
- Nenhum usuário remove o último owner.
- Mudança de papel é protegida por RLS/RPC e auditada.
- Equipes e atletas globais respeitam a organização e mostram participações.
- Financeiro, Auditoria e Configurações deixam de mostrar “Em breve”.
- Organização e usuários deixa de ser placeholder no Organizer Shell.

### 12.5 Dependências

- Fases 0 a 4 aprovadas.
- Definição de retenção e política financeira mínima.

### 12.6 Estimativa

2 a 4 semanas.

---

## 13. Fase 6 — SaaS completo e administração da plataforma

### 13.1 Objetivo

Transformar o produto operacional em plataforma SaaS administrável, com planos,
limites, suporte controlado, métricas e observabilidade.

### 13.2 Rotas-alvo

```text
/settings/subscription
/settings/public-page
/system-admin
/system-admin/organizacoes
/system-admin/usuarios
/system-admin/campeonatos
/system-admin/assinaturas
/system-admin/suporte
/system-admin/auditoria
/system-admin/configuracoes
```

### 13.3 Requisitos

#### F6-RF01 — Planos e limites

- Catálogo de planos e limites versionados.
- Limites por organizações, campeonatos ativos, equipes, usuários, storage e
  módulos contratados.
- Medição autoritativa no backend.
- Avisos antes do limite e bloqueio controlado após excedê-lo.
- Downgrade não pode apagar dados automaticamente.
- Exibir consumo atual e regras ao owner.

#### F6-RF02 — Assinaturas

- Estados mínimos: trial, active, past_due, cancelled e suspended.
- Integração com provedor somente depois de decisão técnica/comercial.
- Webhooks autenticados, idempotentes e auditados.
- Portal de cobrança ou fluxo equivalente.
- Nunca confiar no status enviado pelo cliente.

#### F6-RF03 — Página pública da organização

- Perfil público da organização separado dos portais de campeonato.
- Campeonatos publicados, identidade, contato e links autorizados.
- Slug e regras de visibilidade próprios.

#### F6-RF04 — System Admin

- Guard de backend fail-closed para `is_system_admin`.
- Dashboard global com organizações, usuários, campeonatos, assinatura, storage
  e alertas operacionais.
- Consultas por views/RPCs específicas; não liberar acesso bruto indiscriminado.
- Listas paginadas e filtros para organizações, usuários e campeonatos.
- Ações privilegiadas com confirmação, justificativa e auditoria separada.

#### F6-RF05 — Modo suporte

- Acesso temporário e explicitamente justificado.
- Escopo por organização e duração limitada.
- Banner permanente enquanto ativo.
- Proibir ações destrutivas e financeiras por padrão.
- Registrar início, fim e todas as ações realizadas.
- Preferir impersonação controlada/claims temporários, nunca compartilhamento de senha.

#### F6-RF06 — Auditoria administrativa

- `admin_audit_logs` separado da auditoria de domínio.
- Imutável, pesquisável e com retenção definida.
- Alertas para mudança de plano, suspensão, suporte e alteração privilegiada.

#### F6-RF07 — Observabilidade e operação

- Monitoramento de erros cliente/servidor.
- Métricas de latência, falhas de RPC, autenticação, jobs e webhooks.
- Alertas com severidade e runbook.
- Health checks e acompanhamento de dependências.
- Política de backup, restauração testada e objetivos RPO/RTO definidos.
- Controle de custos de banco, storage e e-mail.

### 13.4 Critérios de aceite

- Usuário comum nunca acessa `/system-admin` nem dados administrativos.
- Limites são aplicados no backend e resistem a chamadas diretas à API.
- Webhook repetido não duplica cobrança/estado.
- Downgrade preserva dados e explica as restrições ao owner.
- Toda ação de suporte tem responsável, justificativa, duração e trilha.
- Backup é restaurado com sucesso em ambiente descartável.
- Painel administrativo não contém métricas demonstrativas.
- Todos os itens do Organizer e System Admin Shell deixam de ser placeholders.

### 13.5 Dependências

- Fases 0 a 5 aprovadas.
- Decisão de planos, preços, limites, provedor de pagamento e política de suporte.

### 13.6 Estimativa

3 a 5 semanas.

---

## 14. Requisitos não funcionais

### 14.1 Segurança

- Proteção contra XSS em conteúdo rico e URLs.
- Validação de entrada no frontend e backend.
- Sem SQL dinâmico construído com entrada do usuário.
- Proteção CSRF adequada ao mecanismo de autenticação/cookies usado.
- Rate limiting para autenticação, consumo de token, upload, convite e endpoints
  públicos sensíveis.
- Tokens armazenados apenas em hash quando não precisarem ser recuperados.
- Cookies de sessão `HttpOnly`, `Secure` e `SameSite` adequados.
- Upload com validação de MIME, extensão, tamanho e caminho.
- Logs sem senha, token, cookie, service role ou PII desnecessária.

### 14.2 Performance

- Paginação no servidor para listas potencialmente grandes.
- Índices para filtros por `organization_id`, `championship_id`, status e datas.
- Evitar N+1 em dashboard, classificação, portal e auditoria.
- Agregações pesadas devem usar RPC/view/materialização quando justificado.
- Invalidar somente query keys afetadas.
- Imagens públicas responsivas e otimizadas.

### 14.3 Confiabilidade

- Idempotency key em ações críticas sujeitas a retry.
- Erros parciais não podem deixar placar, tabela ou pagamento divergente.
- Operações em lote devem ter preview e resumo de resultado.
- Datas armazenadas em UTC e exibidas no fuso configurado.
- Alterações concorrentes críticas devem usar lock/versionamento apropriado.

### 14.4 Acessibilidade e responsividade

- Navegação por teclado nas ações principais.
- Labels, nomes acessíveis e foco visível.
- Contraste compatível com o tema existente.
- Tabelas com alternativa/rolagem controlada no mobile.
- Diálogos não podem ficar cortados fora da viewport.

### 14.5 Compatibilidade

- Últimas versões estáveis de Chrome, Edge, Firefox e Safari.
- Breakpoints móveis já suportados pelo projeto.
- Deploy Cloudflare compatível com TanStack Start/Nitro.

---

## 15. Estratégia de dados

### 15.1 Estruturas existentes a reutilizar

O schema tipado já referencia, entre outras:

- `organizations`, `organization_members`, `user_roles`;
- `championships`, `championship_settings`, `championship_categories`;
- `competition_stages`, `competition_groups`, `competition_rounds`;
- `teams`, `championship_teams`, atletas, staff e responsáveis;
- `matches`, `match_events`, `lineups`, `substitutions`;
- `standings`, `sanctions`, `referees`, `referee_assignments`, `venues`;
- `news`, `media`, `sponsors`;
- `financial_transactions`, `payments`;
- `audit_logs`, notificações e estruturas de inscrição.

Existência no arquivo de tipos não prova existência, consistência ou policy correta
no remoto. A Fase 0 deve validar cada estrutura antes de ela ser adotada.

### 15.2 Regras de modelagem

- Não reutilizar `teams.championship_id` como vínculo canônico; usar
  `championship_teams`.
- Cadastro organizacional do atleta/equipe é distinto da participação em um
  campeonato.
- Dados derivados, como classificação, devem ter uma fonte de cálculo única.
- Não duplicar estado financeiro ou de assinatura em múltiplas tabelas sem regra
  explícita de consistência.
- Arquivamento é preferível à exclusão quando existir histórico.

---

## 16. Estratégia de testes

### 16.1 Pirâmide mínima

1. **Unitários:** pontuação, desempate, geração de confrontos, elegibilidade,
   suspensão, totais financeiros e permissões puras.
2. **Integração:** services, hooks, RPCs, RLS e Storage.
3. **E2E:** jornadas críticas em navegador.
4. **SQL/RLS:** papéis, tenants, anon, constraints e atomicidade.

### 16.2 Jornadas E2E obrigatórias

- Criar organização/campeonato e configurar competição.
- Cadastrar equipes, atletas e enviar inscrição por link.
- Criar estrutura e gerar rodadas.
- Criar partida, escalar, registrar eventos e homologar súmula.
- Ver classificação e estatísticas atualizadas.
- Publicar notícia/patrocinador e conferir portal anônimo.
- Registrar receita/despesa e conferir auditoria.
- Convidar membro e validar papel viewer/editor/admin.
- Confirmar negação cross-tenant.
- Confirmar negação do System Admin para usuário comum.

### 16.3 Gate por pull request

- `npx tsc --noEmit`.
- `npm run lint`.
- testes unitários e de integração afetados.
- build de produção.
- `git diff --check`.
- migration lint/dry-run quando houver SQL.
- evidência manual ou automatizada dos critérios de aceite da feature.

---

## 17. Definition of Done global

Uma feature só está pronta quando:

- atende aos requisitos e critérios de aceite deste PRD;
- não usa dados mockados/demonstrativos em produção;
- possui rota e navegação no shell correto;
- consulta dados com escopo de organização/campeonato;
- RLS e autorização foram testadas;
- possui loading, vazio, erro, sucesso e permissão insuficiente;
- funciona em desktop e mobile;
- operações críticas são atômicas e idempotentes;
- registra auditoria quando aplicável;
- possui testes proporcionais ao risco;
- TypeScript, lint, testes e build estão verdes;
- documentação e tipos foram atualizados;
- não introduz segredo ou PII em código/log;
- o badge “Em breve” foi removido somente no último passo.

---

## 18. Plano de rollout

### 18.1 Estratégia

- Entregar uma fase por vez, com migrations primeiro em ambiente descartável.
- Usar flags de disponibilidade já existentes na navegação como gate visual.
- Ativar inicialmente para organização interna/piloto quando houver risco alto.
- Executar smoke test autenticado e anônimo depois de cada deploy.
- Manter rollback documentado para migration e frontend.

### 18.2 Ordem recomendada

```text
F0 Segurança e baseline
  ↓
F1 Núcleo existente no cockpit
  ↓
F2 Motor da competição
  ↓
F3 Operação esportiva
  ↓
F4 Conteúdo e portal público
  ↓
F5 Gestão e governança
  ↓
F6 SaaS e administração da plataforma
```

Fases 4 e partes da 5 podem ser paralelizadas depois que F2/F3 estabilizarem, mas
nenhuma paralelização pode contornar o gate da Fase 0.

---

## 19. Estimativa consolidada

| Fase | Estimativa |
| --- | ---: |
| 0 | 3–5 dias |
| 1 | 1–2 semanas |
| 2 | 2–4 semanas |
| 3 | 2–3 semanas |
| 4 | 2–3 semanas |
| 5 | 2–4 semanas |
| 6 | 3–5 semanas |

Estimativa total: **14 a 20 semanas-pessoa**, sujeita às decisões em aberto,
estado real do banco remoto, integrações externas e profundidade do módulo
financeiro/assinaturas.

Com dois desenvolvedores experientes e divisão segura de domínio, a previsão
indicativa é de **7 a 11 semanas de calendário**, além de homologação.

---

## 20. Marcos de produto

| Marco | Condição |
| --- | --- |
| M0 — Baseline confiável | Fase 0 aprovada |
| M1 — Campeonato operável | Fases 1 e 2 aprovadas |
| M2 — Operação esportiva oficial | Fase 3 aprovada |
| M3 — Campeonato publicável | Fase 4 aprovada |
| M4 — Organização administrável | Fase 5 aprovada |
| M5 — Plataforma SaaS | Fase 6 aprovada |

---

## 21. Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Schema remoto divergente | Migration ou runtime quebrado | Auditoria e ambiente descartável na F0 |
| RLS incompleta | Vazamento cross-tenant | Matriz autenticada obrigatória e fail-closed |
| Regras esportivas ambíguas | Retrabalho no motor | Fechar decisões da F2 antes da implementação |
| Concorrência em eventos | Placar/classificação incorretos | RPC transacional e idempotência |
| Dados mockados confundidos com reais | Decisão operacional incorreta | Remover mocks e indicar estados vazios reais |
| Escopo financeiro crescer para ERP | Atraso elevado | Manter ledger operacional; fiscal fora do escopo |
| Integração de pagamento indefinida | Bloqueio da F6 | Entregar planos/limites antes do gateway |
| System admin excessivamente poderoso | Incidente de segurança | RPCs específicas, suporte temporário e auditoria separada |
| Reescrita do histórico Git | Perda de histórico no Lovable | Não fazer force push/rebase de commits publicados |
| Falta de testes E2E | Regressões entre módulos | Jornadas obrigatórias e CI por PR |

---

## 22. Decisões em aberto

Estas decisões devem ser respondidas durante o refinamento da fase indicada, sem
bloquear a preparação da Fase 0:

1. **F2:** quais formatos e critérios de desempate entram na primeira versão?
2. **F2:** o sorteio de grupos será aleatório simples, por potes ou manual?
3. **F3:** quem pode homologar e reabrir súmula?
4. **F3:** árbitros terão login próprio na primeira versão ou apenas cadastro?
5. **F4:** quais campos/seções podem ser publicados e quais são obrigatórios?
6. **F5:** financeiro será apenas caixa operacional ou contas a pagar/receber
   completo?
7. **F5:** quais notificações serão internas e quais serão por e-mail?
8. **F6:** quais planos, preços e limites serão comercializados?
9. **F6:** qual provedor de pagamento será utilizado?
10. **F6:** qual política de suporte/impersonação é juridicamente aceitável?
11. **Operação:** quais metas de RPO, RTO e retenção de auditoria serão adotadas?

---

## 23. Backlog inicial por épico

### Épico E0 — Baseline e segurança

- E0.1 Remover e rotacionar segredos versionados.
- E0.2 Reconciliar migrations e schema remoto.
- E0.3 Gerar tipos oficiais.
- E0.4 Implementar matriz de testes RLS.
- E0.5 Zerar lint e implantar CI.
- E0.6 Criar testes E2E mínimos.

### Épico E1 — Núcleo esportivo existente

- E1.1 Migrar Partidas para o cockpit.
- E1.2 Criar RPC atômica de eventos/placar.
- E1.3 Migrar Classificação.
- E1.4 Migrar Estatísticas.
- E1.5 Criar detalhe/súmula básica.
- E1.6 Remover rotas transitórias.

### Épico E2 — Motor da competição

- E2.1 Configuração esportiva.
- E2.2 Publicação e travas.
- E2.3 CRUD de fases e grupos.
- E2.4 Distribuição/sorteio de equipes.
- E2.5 Geração de rodadas.
- E2.6 Classificação configurável.
- E2.7 Avanço e chave eliminatória.

### Épico E3 — Operação esportiva

- E3.1 Escalações.
- E3.2 Súmula completa.
- E3.3 Homologação/PDF.
- E3.4 Cadastro e escala de arbitragem.
- E3.5 Sanções e suspensões.

### Épico E4 — Conteúdo e publicação

- E4.1 CRUD de notícias.
- E4.2 Biblioteca de mídia.
- E4.3 Transmissões e galerias.
- E4.4 Patrocinadores.
- E4.5 Configuração pública.
- E4.6 Portal real por slug.

### Épico E5 — Gestão e governança

- E5.1 Financeiro real.
- E5.2 Auditoria de domínio.
- E5.3 Configurações do campeonato.
- E5.4 Organização e membros.
- E5.5 Equipes e atletas globais.
- E5.6 Notificações.

### Épico E6 — Plataforma SaaS

- E6.1 Planos e limites.
- E6.2 Assinaturas e webhooks.
- E6.3 Página da organização.
- E6.4 Dashboard e cadastros do System Admin.
- E6.5 Modo suporte.
- E6.6 Auditoria administrativa.
- E6.7 Observabilidade, backups e operação.

---

## 24. Próximo passo recomendado

Iniciar o refinamento da **Fase 0**, transformando E0.1 a E0.6 em issues técnicas
pequenas, cada uma com evidência esperada e ordem de execução. Somente depois do
gate M0 deve começar a migração funcional da Fase 1.

O primeiro pacote de execução deve conter:

1. inventário seguro do `.env` e plano de rotação;
2. auditoria local/remota do Supabase;
3. matriz formal de RLS;
4. correção do baseline de lint;
5. escolha e configuração das ferramentas de teste;
6. workflow de CI;
7. atualização da documentação de estado das migrations.
