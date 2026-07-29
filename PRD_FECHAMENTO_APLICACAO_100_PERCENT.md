# PRD — Fechamento integral do IS Arena

**Produto:** IS Arena  
**Repositório:** `competition-conductor`  
**Documento-base:** `PRD_IMPLEMENTACAO_FASES_0_A_6.md`  
**Versão:** 1.0  
**Data:** 29/07/2026  
**Status:** Plano executivo obrigatório para encerramento da V1  
**Regra principal:** nenhum item deste PRD pode ser adiado, pulado ou aceito sem evidência

---

## 1. Objetivo

Encerrar a implementação da V1 do IS Arena como uma aplicação SaaS plenamente
operável em produção, permitindo que uma organização:

1. crie e administre sua conta;
2. crie, configure e publique campeonatos;
3. gerencie equipes, atletas, responsáveis e comissões;
4. estruture fases, grupos, rodadas e confrontos;
5. opere partidas, eventos, escalações, arbitragem, súmulas e sanções;
6. publique notícias, mídias, patrocinadores e portais públicos;
7. controle o caixa operacional e a auditoria;
8. gerencie membros, papéis, notificações, plano, consumo e cobrança;
9. seja administrada com segurança pelo System Admin;
10. seja monitorada, recuperável e suportável em produção.

“100% funcional” neste documento não significa ausência matemática de qualquer
defeito futuro. Significa que **todo o escopo contratado da V1 está implementado,
integrado, protegido, testado e comprovado em produção**, sem mocks, placeholders,
decisões em aberto ou validações essenciais transferidas para depois.

---

## 2. Resultado final obrigatório

A V1 somente poderá ser declarada encerrada quando, simultaneamente:

- todas as migrations locais estiverem aplicadas e registradas no banco remoto;
- o schema remoto, os tipos TypeScript e o código estiverem sincronizados;
- todas as regras multi-tenant forem comprovadas por testes RLS autenticados;
- todas as jornadas críticas passarem em navegador com usuários reais de teste;
- todos os módulos visíveis estiverem funcionais, sem “Em breve”;
- não houver dados demonstrativos em caminhos de produção;
- os limites e módulos dos planos forem aplicados pelo backend;
- checkout, webhook e ciclo de assinatura funcionarem no ambiente publicado;
- backup e restauração tiverem sido executados com sucesso;
- logs, alertas, jobs, runbooks e rollback estiverem operacionais;
- lint, tipos, testes, cobertura e build estiverem verdes no CI;
- não houver severidade crítica ou alta aberta;
- o pacote de evidências de encerramento estiver completo.

Não são aceitos como prova isolada:

- botão oculto no frontend;
- teste apenas com `service_role`;
- SQL executado uma única vez sem script reproduzível;
- typecheck como prova de RLS;
- build local como prova de ambiente publicado;
- navegação manual sem asserções;
- “funciona na minha máquina”;
- funcionalidade parcialmente implementada com complemento prometido.

---

## 3. Escopo final da V1

### 3.1 Incluído

- autenticação, recuperação de acesso e sessão;
- multi-tenancy por organização;
- membros, convites e papéis;
- campeonatos e identidade visual;
- equipes, atletas, elenco, staff e responsáveis;
- portal seguro de inscrição de equipe;
- configuração e motor de competição;
- fases, grupos, rodadas, confrontos e classificação;
- partidas, eventos, estatísticas e súmulas;
- escalações, substituições, arbitragem, sanções e suspensões;
- notícias, galeria, mídia, transmissões e patrocinadores;
- portal público da organização e do campeonato;
- financeiro como caixa operacional;
- auditoria de domínio e administrativa;
- notificações internas;
- planos, limites, assinatura e cobrança InfinitePay;
- API JSON e incorporação HTML do plano Profissional;
- System Admin, suporte controlado e observabilidade;
- segurança, acessibilidade, responsividade, performance, CI/CD, backup e
  recuperação.

### 3.2 Fora da V1

Os itens abaixo não são pendências da V1 porque não integram seu contrato:

- aplicativo móvel nativo;
- marketplace de árbitros, equipes ou prestadores;
- hospedagem de streaming de vídeo;
- contabilidade fiscal, folha de pagamento e emissão de nota fiscal;
- bilheteria e venda de ingressos;
- IA para geração editorial;
- integrações com federações sem API e contrato definidos;
- domínio próprio por organização.

O “URL personalizado” dos planos significa um **slug exclusivo dentro do domínio
do IS Arena**, e não domínio próprio.

---

## 4. Decisões de produto encerradas

Estas decisões substituem as questões em aberto do PRD original.

| Tema | Decisão final da V1 |
| --- | --- |
| Formatos | Pontos corridos, grupos, eliminatória e grupos + eliminatória |
| Turnos | Turno único e ida/volta |
| Desempate | Ordem configurável entre pontos, vitórias, saldo, gols pró, confronto direto e disciplina; sorteio somente como último critério explicitamente escolhido |
| Distribuição em grupos | Manual na V1; nenhum sorteio pseudoaleatório sem algoritmo versionado e reproduzível |
| Homologar/reabrir súmula | Somente `owner` e `admin`; `editor` opera rascunho e eventos, mas não homologa nem reabre |
| Acesso do árbitro | Cadastro e escala pela organização; árbitro não possui login próprio na V1 |
| Portal público | Somente campeonatos e conteúdo publicados; PII, documentos e dados internos nunca são expostos |
| Financeiro | Caixa operacional de receitas, despesas, baixas e estornos; não é ERP contábil/fiscal |
| Notificações | Internas e idempotentes na V1; não exibir preferência ou promessa de e-mail sem provedor transacional configurado |
| Planos | Pequeno R$ 25, Intermediário R$ 32, Grande R$ 40 e Profissional R$ 55 por mês |
| Limites comerciais | 300/3, 600/6, 900/12 e ilimitado/ilimitado para atletas/patrocinadores por campeonato |
| Campeonatos | Ilimitados nos quatro planos |
| Recursos não limitados no catálogo | Permanecem ilimitados na V1; `NULL` representa ilimitado de forma explícita |
| Pagamento | InfinitePay, com checkout mensal equivalente a renovação, confirmação somente por backend/webhook |
| Suporte | Leitura temporária, justificada, auditada e restrita à organização; sem compartilhamento de senha, escrita, financeiro ou impersonação irrestrita |
| API e incorporação | API JSON pública read-only e componente HTML read-only, exclusivos do Profissional e autorizados no backend |
| Retenção | 60 meses para auditoria de domínio e administrativa |
| Recuperação | RPO máximo de 24 horas e RTO máximo de 4 horas |
| Restauração | Teste trimestral e obrigatório antes do encerramento inicial |

Qualquer alteração futura nessas decisões exige nova versão do produto, migration
compatível e atualização deste contrato. Não pode ser feita informalmente durante
o fechamento.

---

## 5. Estado de partida auditado

As Fases 0 a 6 já possuem implementação substancial, migrations e verificações
SQL. O fechamento, porém, ainda precisa transformar evidências parciais em uma
prova integrada.

### 5.1 Itens já existentes que devem ser preservados

- arquitetura React 19, TanStack Start/Router, TanStack Query e Supabase;
- cockpit contextual por campeonato;
- motor de competição e operação esportiva;
- publicação, financeiro, auditoria, notificações e gestão de membros;
- catálogo comercial, assinatura, suporte e System Admin;
- tema e componentes compartilhados;
- testes unitários, SQL e smoke público;
- workflow de CI e comandos de qualidade.

### 5.2 Lacunas conhecidas e obrigatórias

| ID | Lacuna | Consequência se não corrigida |
| --- | --- | --- |
| L01 | Migrations de reparo de elenco e Storage de logo precisam de aplicação e prova remota | Runtime pode divergir do repositório |
| L02 | Verificação de privacidade de árbitros não está na matriz automatizada principal | Regressão de PII pode passar despercebida |
| L03 | Tipos Supabase não representam integralmente os RPCs recentes | Casts ocultam schema drift |
| L04 | Existem adaptadores `untyped`/casts em serviços críticos | Perda de segurança estática e risco de contrato incorreto |
| L05 | E2E autenticado atual é insuficiente e não cobre jornadas completas | Fluxos integrados não estão comprovados |
| L06 | CI executa apenas smoke público de navegador | Regressões autenticadas podem chegar à produção |
| L07 | API JSON e incorporação HTML são anunciadas, mas precisam de implementação funcional | Plano Profissional vende recurso inexistente |
| L08 | Limites futuros de organização/storage/módulo não têm cobertura autoritativa completa | Alteração de catálogo pode não ser aplicada |
| L09 | Ciclo real de checkout/webhook precisa de prova no runtime publicado | Cobrança pode funcionar apenas no banco |
| L10 | Primeira execução real do job de ciclo de assinatura precisa ser registrada | Assinaturas vencidas podem não ser reconciliadas |
| L11 | Restauração de backup, RPO/RTO e retenção precisam de evidência operacional | Recuperação de desastre não comprovada |
| L12 | Rate limit, acessibilidade, compatibilidade e performance não têm matriz final | Produção pode ser insegura ou inutilizável em cenários reais |
| L13 | Autorizações de homologação/reabertura precisam refletir a decisão final | Editor pode receber poder superior ao necessário |
| L14 | Promessas de e-mail sem provedor devem ser removidas ou bloqueadas | Interface promete comportamento inexistente |

---

## 6. Princípios de execução

1. **Banco antes do runtime:** migrations, grants, constraints, índices e RLS
   precedem o consumo pela interface.
2. **Backend como autoridade:** papéis, limites, assinatura e módulos não podem
   depender de UI.
3. **Fail-closed:** erro ou contexto ambíguo resulta em negação, nunca ampliação
   de acesso.
4. **Uma fonte de verdade:** não duplicar cálculo esportivo, saldo, assinatura ou
   consumo entre navegador e banco.
5. **Atomicidade e idempotência:** eventos, placar, súmula, avanço, estorno,
   convite e webhook suportam retry sem duplicação.
6. **Sem destruição implícita:** downgrade, migração ou regeneração não apaga
   histórico automaticamente.
7. **Evidência reproduzível:** toda aprovação precisa de comando, resultado,
   ambiente, data e responsável.
8. **Produção é um gate:** homologação local não substitui smoke e observabilidade
   do deploy.
9. **Sem dívida de encerramento:** `TODO`, `FIXME`, placeholder, mock e bypass
   relacionados ao escopo impedem o aceite.

---

## 7. Ordem obrigatória de fechamento

```text
FZ-0 Congelamento e inventário
  ↓
FZ-1 Banco remoto, migrations e tipos
  ↓
FZ-2 Segurança, RLS, Storage e contratos
  ↓
FZ-3 Núcleo esportivo integrado
  ↓
FZ-4 Publicação e experiência pública
  ↓
FZ-5 Gestão, governança e notificações
  ↓
FZ-6 SaaS, cobrança e recursos comerciais
  ↓
FZ-7 Qualidade integral e jornadas E2E
  ↓
FZ-8 Operação, recuperação e release
  ↓
Certificação de encerramento
```

Nenhuma fase pode ser pulada. Trabalho preparatório pode ocorrer em paralelo, mas
o gate da fase anterior precisa estar aprovado antes do aceite da seguinte.

---

## 8. FZ-0 — Congelamento e inventário

### Objetivo

Estabelecer uma fotografia confiável do que será encerrado e impedir que novas
features alterem o alvo durante a estabilização.

### Entregas

- registrar commit, branch, versão do Node, npm, Supabase CLI e ambiente;
- confirmar árvore Git limpa e migrations locais/remotas;
- inventariar todas as rotas, menus, módulos, RPCs, tabelas, views, triggers,
  policies, buckets, cron jobs e variáveis de ambiente;
- localizar `TODO`, `FIXME`, “Em breve”, mocks, dados fixos e casts de contrato;
- mapear cada requisito deste PRD para código, SQL e teste;
- classificar defeitos por criticidade;
- definir responsáveis técnicos e sequência de correções;
- congelar novas features até a certificação.

### Critérios de aceite

- matriz de rastreabilidade com 100% dos requisitos;
- nenhuma rota ou módulo órfão;
- toda divergência local/remota identificada;
- lista de defeitos críticos/altos zerada ou vinculada a item deste plano;
- baseline de qualidade registrado sem ocultar falhas.

### Evidência

`RELATORIO_FECHAMENTO_FZ0_INVENTARIO.md`, logs dos comandos e hash do commit.

---

## 9. FZ-1 — Banco remoto, migrations e tipos

### Objetivo

Fazer o repositório, o histórico de migrations, o schema remoto e os tipos
gerados representarem exatamente o mesmo contrato.

### Entregas

1. Criar/confirmar ambiente de homologação descartável e separado de produção.
2. Aplicar e verificar em homologação todas as migrations em ordem.
3. Aplicar e registrar no remoto as migrations ainda locais, incluindo:
   - `20260729010000_roster_runtime_repair.sql`;
   - `20260729020000_championship_logo_storage.sql`.
4. Criar verificação específica do bucket, policies, upload, substituição e
   remoção segura do logo.
5. Incluir
   `supabase/tests/phase3_referee_privacy_verification.sql` na matriz principal.
6. Rodar lint/diff do banco e inspecionar funções `SECURITY DEFINER`,
   `search_path`, grants e owners.
7. Validar FKs, unicidade, checks, índices e cardinalidade dos filtros críticos.
8. Regenerar `src/integrations/supabase/types.ts` a partir do remoto aprovado.
9. Substituir casts e clientes `untyped` por contratos gerados.
10. Validar a sequência completa em banco vazio e em cópia sanitizada de
    estrutura existente.
11. Documentar rollback operacional de cada migration de fechamento.

### Critérios de aceite

- histórico local e remoto sem diferença;
- migrations funcionam do zero e sobre o estado existente;
- matriz SQL completa passa em homologação;
- zero RPC usado pelo app ausente nos tipos gerados;
- zero cast criado apenas para contornar contrato Supabase;
- nenhum warning crítico do lint/diff do banco;
- rollback documentado e testado onde for reversível.

### Evidência

Saída da CLI, resultado de cada SQL, diff do schema, arquivo de tipos e relatório
`RELATORIO_FECHAMENTO_FZ1_BANCO.md`.

---

## 10. FZ-2 — Segurança, RLS, Storage e contratos

### Objetivo

Comprovar isolamento multi-tenant e menor privilégio em todas as superfícies.

### Matriz de identidades obrigatória

- anônimo;
- autenticado sem organização;
- owner, admin, editor e viewer da organização A;
- owner, admin, editor e viewer da organização B;
- responsável com token válido, expirado, bloqueado e revogado;
- usuário comum tentando atuar como System Admin;
- System Admin;
- suporte ativo, expirado e fora do escopo autorizado;
- webhook válido, inválido, repetido e fora da janela esperada.

### Entregas

- testar `SELECT`, `INSERT`, `UPDATE` e `DELETE` em todas as tabelas expostas;
- testar todas as RPCs com tenant correto, tenant incorreto e recurso inexistente;
- testar buckets e objetos com paths válidos, cross-tenant e MIME/tamanho inválidos;
- garantir que PII de árbitros, atletas, responsáveis e usuários não apareça em
  respostas públicas;
- aplicar autorização específica por ação, sem confiar apenas em
  `can_administer_org`;
- restringir homologação e reabertura de súmula a owner/admin;
- confirmar viewer somente leitura;
- aplicar módulos e limites contratados no backend;
- implementar rate limiting para autenticação, convites, tokens, uploads,
  checkout, webhooks, API JSON e endpoints públicos;
- validar CSRF, XSS, URLs externas, sanitização, cookies, headers e CORS;
- revisar variáveis e bundles para impedir vazamento de segredos;
- comprovar que service role existe apenas no servidor.

### Critérios de aceite

- zero leitura ou mutação cross-tenant;
- zero PII privada em endpoint anônimo;
- zero operação privilegiada autorizada apenas por estado do frontend;
- rate limit devolve resposta previsível sem corromper estado;
- suporte expira automaticamente e não escreve;
- segurança automatizada faz parte do CI;
- zero vulnerabilidade crítica ou alta conhecida.

### Evidência

Matriz RLS por papel/recurso/operação, relatório de segurança e logs sanitizados.

---

## 11. FZ-3 — Núcleo esportivo integrado

### Objetivo

Provar o ciclo completo de um campeonato sem intervenção técnica.

### Entregas

#### Organização, campeonato e elenco

- criar organização e campeonato;
- configurar slug, identidade visual e logo;
- cadastrar equipe, atleta, responsável e staff;
- vincular elenco ao campeonato;
- executar inscrição por link, revisão e aprovação;
- confirmar limites comerciais na inclusão de atletas;
- corrigir qualquer fluxo legado que não envie `team_id`.

#### Motor da competição

- implementar e testar os quatro formatos definidos;
- configurar pontuação, desempate, WO, descanso, idade e elenco;
- criar, ordenar, publicar e arquivar fases;
- distribuir equipes manualmente em grupos;
- gerar/regenerar rodadas com preview, versão e idempotência;
- impedir confrontos inválidos e choque de descanso;
- avançar classificados e montar chave eliminatória;
- testar alterações concorrentes e locks.

#### Partidas e operação

- criar, reagendar, adiar e cancelar partida;
- escalar atletas e validar elegibilidade;
- registrar/remover gols, cartões e substituições atomicamente;
- recalcular placar, estatísticas, classificação e suspensões;
- escalar árbitros sem expor contatos indevidamente;
- finalizar, homologar, reabrir e gerar PDF da súmula;
- auditar autoria, justificativa e transições;
- impedir editor de homologar ou reabrir.

### Critérios de aceite

- evento, placar, súmula, classificação e estatísticas nunca divergem;
- duplo clique/retry não duplica operação;
- atleta suspenso ou inelegível não entra em escalação;
- mudança concorrente não perde atualização;
- todos os formatos geram estrutura válida;
- PDF corresponde à súmula homologada e à sua versão;
- duas organizações executam o ciclo sem compartilhar dados.

### Evidência

Testes unitários de regras, SQL transacional, E2E autenticado e dois campeonatos
de homologação completos.

---

## 12. FZ-4 — Publicação e experiência pública

### Objetivo

Garantir que conteúdo privado e público tenham fronteiras claras e que o visitante
consuma somente dados reais publicados.

### Entregas

- concluir CRUD de notícias, mídia, galerias, transmissões e patrocinadores;
- validar upload por MIME real, extensão, tamanho, path e organização;
- remover/substituir arquivos sem deixar referências ou objetos órfãos;
- aplicar limite de patrocinadores no backend;
- configurar portal da organização e do campeonato;
- publicar por slug exclusivo e tratar slug inexistente;
- exibir agenda, resultados, classificação, estatísticas, notícias,
  patrocinadores e links autorizados;
- não publicar documentos, telefone, e-mail ou PII sem campo e consentimento
  explícitos;
- implementar SEO técnico, metadados, canonical e compartilhamento;
- remover todos os mocks e fallbacks demonstrativos;
- garantir estados vazio, erro, loading e conteúdo não publicado.

### Critérios de aceite

- visitante anônimo vê somente registros publicados;
- preview privado exige autorização;
- conteúdo despublicado deixa de aparecer e não permanece em cache indevido;
- upload cross-tenant é negado;
- páginas públicas funcionam em mobile e sem sessão;
- nenhum dado demonstrativo aparece em produção.

### Evidência

Smoke anônimo, matriz Storage/RLS, inspeção de cache e capturas dos breakpoints.

---

## 13. FZ-5 — Gestão, governança e notificações

### Objetivo

Fechar as operações administrativas da organização com rastreabilidade.

### Entregas

#### Financeiro

- receitas, despesas, categorias, vencimento, baixa, cancelamento e estorno;
- totais calculados pelo backend;
- concorrência e idempotência em baixa/estorno;
- escopo exclusivo por organização/campeonato;
- exportação de relatório sem ampliar para contabilidade fiscal.

#### Membros e papéis

- convite, aceite, reenvio, revogação e expiração;
- alteração de papel por RPC auditada;
- impedir remoção ou rebaixamento do último owner;
- impedir autoelevação e alterações cross-tenant;
- listas globais de equipes e atletas sem segunda fonte canônica.

#### Auditoria e configurações

- trilha imutável para operações esportivas, financeiras e administrativas;
- filtros, paginação, ator, recurso, antes/depois e justificativa;
- retenção de 60 meses;
- configurações do campeonato com validação e histórico.

#### Notificações

- convite, inscrição, revisão, partida, arbitragem e publicação;
- central interna, lida/não lida e preferências aplicáveis;
- deduplicação por evento;
- remover ou desabilitar opções de e-mail na V1.

### Critérios de aceite

- saldo e transações permanecem consistentes sob retry;
- viewer e responsável não acessam financeiro/auditoria;
- toda mudança crítica gera log sem segredo ou PII desnecessária;
- último owner nunca é perdido;
- notificações internas chegam uma única vez;
- interface não promete canal de e-mail inexistente.

### Evidência

SQL de concorrência/autorização, E2E financeiro/membros e auditoria correlacionada.

---

## 14. FZ-6 — SaaS, cobrança e recursos comerciais

### Objetivo

Fazer o contrato comercial exibido ao cliente corresponder ao comportamento real
da plataforma.

### Entregas

#### Catálogo, assinatura e limites

- publicar somente versões válidas dos quatro planos;
- mostrar preço, recursos, consumo e estado da assinatura;
- medir no backend organizações por conta, campeonatos ativos, equipes, membros,
  atletas, patrocinadores e bytes de Storage;
- aplicar de forma transacional qualquer limite numérico não nulo dessas
  dimensões;
- tratar valores `NULL` como ilimitados, sem ambiguidade;
- rejeitar a publicação de catálogo com chave de limite desconhecida;
- testar também limites finitos não comercializados na versão corrente, para
  comprovar que uma nova versão de catálogo não ativa regra inoperante;
- oferecer preview de mudança de plano;
- preservar dados em downgrade e bloquear apenas novas inclusões excedentes;
- reconciliar `trial`, `active`, `past_due`, `cancelled` e `suspended`;
- executar e registrar o job real de ciclo da assinatura.

#### InfinitePay

- gerar checkout somente no servidor;
- validar valor, plano e organização a partir do catálogo publicado;
- autenticar e validar webhook;
- deduplicar eventos;
- reconciliar retorno atrasado, repetido ou fora de ordem;
- comprovar checkout real e atualização da assinatura no deploy;
- configurar e validar `INFINITEPAY_HANDLE` e demais segredos somente no servidor.

#### Recursos Profissionais

- implementar endpoint JSON público, versionado e read-only;
- implementar incorporação HTML responsiva e read-only;
- expor apenas conteúdo publicado e sanitizado;
- autorizar o módulo no backend, não apenas esconder a UI;
- negar plano sem recurso e assinatura inativa;
- incluir rate limit, cache control, CORS e documentação de uso;
- disponibilizar código de incorporação copiável no painel.

#### System Admin e suporte

- dashboard com dados reais, paginação e filtros;
- diretórios de organizações, usuários, campeonatos e assinaturas;
- publicar/arquivar catálogo com confirmação e auditoria;
- oferecer apenas ações privilegiadas modeladas por RPC;
- suspender/reativar assinatura ou organização somente com justificativa,
  confirmação, efeito reversível e auditoria;
- suporte read-only, temporário, sinalizado e auditado;
- negar qualquer ação não modelada.

### Critérios de aceite

- recurso anunciado existe e funciona;
- limite não pode ser contornado por chamada direta;
- webhook repetido não duplica estado;
- downgrade nunca apaga dados;
- plano não Profissional não acessa API/embed;
- usuário comum não acessa System Admin;
- toda ação privilegiada possui ator, justificativa, data e resultado;
- assinatura se reconcilia sem intervenção manual.

### Evidência

Checkout e webhook reais, execução do job, testes por plano, E2E System Admin e
provas de negação.

---

## 15. FZ-7 — Qualidade integral e jornadas E2E

### Objetivo

Substituir verificações isoladas por uma suíte de regressão representativa do uso
real.

### 15.1 Gate automático obrigatório

```text
npm run security:env
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
git diff --check
matriz SQL/RLS completa
```

O CI deve executar a suíte autenticada com credenciais de teste protegidas,
ambiente descartável e limpeza determinística.

### 15.2 Jornadas E2E obrigatórias

| ID | Jornada |
| --- | --- |
| E01 | cadastrar, confirmar, entrar, sair e recuperar acesso |
| E02 | criar organização, convidar membro e aceitar convite |
| E03 | validar owner/admin/editor/viewer e último owner |
| E04 | criar campeonato, editar identidade e fazer upload/substituição do logo |
| E05 | cadastrar equipe, atleta, staff e responsável |
| E06 | preencher inscrição por link, revisar, corrigir e aprovar |
| E07 | configurar cada um dos quatro formatos |
| E08 | criar fases/grupos, distribuir equipes e gerar rodadas |
| E09 | criar partida, escalar, registrar eventos e finalizar |
| E10 | homologar, reabrir e exportar súmula |
| E11 | confirmar classificação, estatísticas e suspensões |
| E12 | cadastrar e escalar árbitro sem vazar PII |
| E13 | publicar notícia, galeria, transmissão e patrocinador |
| E14 | validar portal público anônimo e despublicação |
| E15 | lançar receita/despesa, baixar, estornar e auditar |
| E16 | receber e ler notificações sem duplicação |
| E17 | visualizar consumo, mudar plano e respeitar limite |
| E18 | executar checkout, webhook e reconciliação |
| E19 | consumir API JSON e incorporação no Profissional |
| E20 | negar API/embed nos demais planos |
| E21 | operar System Admin e suporte temporário |
| E22 | negar acesso cross-tenant em leitura e escrita |
| E23 | negar System Admin para usuário comum |
| E24 | navegar jornadas críticas em viewport móvel |

### 15.3 Cobertura não funcional

- Chromium, Firefox e WebKit; Edge validado por motor Chromium no smoke final;
- teclado, foco, labels, contraste e leitores semânticos;
- WCAG 2.1 AA nas jornadas críticas;
- layout de 320 px até desktop;
- p95 inferior a 1 segundo no backend para consultas principais sob carga-alvo;
- ausência de N+1 nas listas e dashboards;
- paginação real para coleções grandes;
- teste de retry, timeout e perda temporária de conexão;
- teste de concorrência em eventos, súmula, financeiro, limite e webhook;
- teste de cache e conteúdo despublicado.

### Critérios de aceite

- 100% das 24 jornadas verdes;
- zero teste obrigatório marcado como `skip`;
- zero falha intermitente conhecida;
- navegadores e mobile aprovados;
- acessibilidade crítica sem violação séria;
- performance dentro dos alvos documentados;
- cobertura das regras críticas não diminui.

### Evidência

Relatório Playwright, cobertura Vitest, resultados SQL, relatório de
acessibilidade, carga e compatibilidade.

---

## 16. FZ-8 — Operação, recuperação e release

### Objetivo

Comprovar que o produto pode ser publicado, monitorado, recuperado e operado sem
dependência do desenvolvedor.

### Entregas

- inventário de variáveis por ambiente, sem valores secretos em documentação;
- health checks de aplicação, banco, Storage, billing e jobs;
- logs estruturados com correlation ID e sanitização;
- métricas de erros, latência, RPC, autenticação, upload, webhook e cron;
- alertas por severidade e responsável;
- runbooks de indisponibilidade, billing, migration, Storage e segurança;
- política de backup compatível com RPO de 24 horas;
- restauração completa em ambiente descartável;
- cron de assinatura executado e monitorado;
- retenção de auditoria de 60 meses aplicada e testada;
- plano de rollout, rollback e comunicação;
- deploy em homologação, aceite, deploy em produção e smoke pós-deploy;
- observação reforçada após release e encerramento formal.

### Critérios de aceite

- restore recupera dados e aplicação dentro de RTO de 4 horas;
- perda máxima comprovada respeita RPO de 24 horas;
- alerta real de teste chega ao responsável;
- runbook permite resposta sem conhecimento tribal;
- rollback de aplicação foi ensaiado;
- migrations têm estratégia forward-fix ou reversão segura;
- smoke autenticado e anônimo passa no endereço de produção;
- nenhum segredo aparece no cliente, repositório ou log.

### Evidência

Relatório de restauração, tempos medidos, alertas, runbooks, versão publicada,
smoke de produção e ata de go-live.

---

## 17. Matriz de autorização mínima

| Capacidade | Owner | Admin | Editor | Viewer | Responsável | Público | System Admin | Suporte |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Configurar organização | Sim | Não | Não | Não | Não | Não | RPC específica | Não |
| Gerenciar membros | Sim | Não | Não | Não | Não | Não | Não | Não |
| Configurar campeonato | Sim | Sim | Sim, operacional | Não | Não | Não | Não | Leitura |
| Gerenciar elenco | Sim | Sim | Sim | Não | Própria equipe via token | Não | Não | Leitura |
| Operar partida/eventos | Sim | Sim | Sim | Não | Não | Não | Não | Leitura |
| Homologar/reabrir súmula | Sim | Sim | Não | Não | Não | Não | Não | Não |
| Gerenciar arbitragem | Sim | Sim | Sim | Não | Não | Não | Não | Leitura |
| Publicar conteúdo | Sim | Sim | Sim | Não | Não | Não | Não | Leitura |
| Ver conteúdo publicado | Sim | Sim | Sim | Sim | Sim | Sim | Sim | Sim |
| Gerenciar financeiro | Sim | Sim | Somente se permissão específica existir | Não | Não | Não | Não | Não |
| Ver auditoria da organização | Sim | Sim | Não | Não | Não | Não | Não | Leitura limitada |
| Gerenciar assinatura | Sim | Não | Não | Não | Não | Não | RPC específica auditada | Não |
| Administrar catálogo | Não | Não | Não | Não | Não | Não | Sim | Não |
| API/embed Profissional | Conforme assinatura | Conforme assinatura | Conforme assinatura | Conforme assinatura | Não | Leitura publicada | Sim | Leitura |

Cada célula deve ser testada no backend. Uma coluna “Não” representa negação
explícita, não ausência de botão.

---

## 18. Requisitos de dados e performance

- toda entidade administrativa possui ou deriva `organization_id`;
- recursos dependentes validam que todos os IDs pertencem ao mesmo tenant;
- FKs e checks impedem relações esportivas impossíveis;
- índices cobrem `organization_id`, `championship_id`, status, datas, slugs,
  chaves de idempotência e filtros de auditoria;
- queries de listas são paginadas no servidor;
- dashboards evitam N+1;
- agregações canônicas são RPCs/views quando necessário;
- datas são armazenadas em UTC e exibidas no fuso configurado;
- exclusão física é evitada quando existe histórico;
- auditoria é append-only;
- logs não substituem auditoria de negócio;
- cache público respeita publicação/despublicação;
- arquivos órfãos têm rotina segura de detecção e tratamento.

---

## 19. Gestão de defeitos

| Severidade | Definição | Regra de encerramento |
| --- | --- | --- |
| Crítica | vazamento, perda de dados, cobrança incorreta, indisponibilidade total | zero aberta |
| Alta | jornada principal bloqueada, autorização incorreta, inconsistência esportiva/financeira | zero aberta |
| Média | função secundária degradada com alternativa segura | corrigida antes do go-live da V1 |
| Baixa | problema cosmético sem perda funcional | corrigida antes da certificação |

O objetivo “sem pendências” significa que nem defeitos baixos conhecidos do
escopo são transferidos para um backlog pós-lançamento. Itens realmente fora do
escopo devem estar descritos na seção 3.2, não reclassificados ao final.

---

## 20. Definition of Done por item

Uma entrega somente recebe status `Concluída` quando:

- requisito e regra de negócio estão implementados;
- migration, RLS, índice e tipos foram atualizados quando aplicável;
- loading, vazio, erro, sucesso e permissão insuficiente estão tratados;
- desktop e mobile foram validados;
- auditoria e observabilidade existem quando aplicável;
- testes unitário, integração, SQL/RLS e E2E proporcionais ao risco passam;
- casos de erro, retry e concorrência passam;
- documentação e runbook foram atualizados;
- CI e build de produção estão verdes;
- homologação autenticada passou;
- smoke do ambiente publicado passou;
- evidência está anexada à matriz de rastreabilidade;
- não restou mock, placeholder, bypass, `TODO` ou cast indevido.

---

## 21. Gates de liberação

| Gate | Condição de aprovação |
| --- | --- |
| G0 — Escopo | decisões fechadas e rastreabilidade completa |
| G1 — Dados | migrations, remoto, tipos e rollback sincronizados |
| G2 — Segurança | matriz RLS/Storage/RPC verde e zero vulnerabilidade alta |
| G3 — Domínio | campeonato completo operado em dois tenants |
| G4 — Público | publicação real, privacidade e cache aprovados |
| G5 — Gestão | financeiro, membros, auditoria e notificações aprovados |
| G6 — Comercial | limites, billing, API/embed e System Admin aprovados |
| G7 — Qualidade | CI e 24 jornadas E2E verdes, sem skips |
| G8 — Operação | backup/restore, alertas, cron, rollback e produção aprovados |

Se um gate falhar, o status global permanece **não encerrado**.

---

## 22. Pacote de evidências de encerramento

Criar `docs/closure/` com:

1. matriz requisito → implementação → teste → evidência;
2. inventário de migrations local/remoto;
3. schema diff e tipos gerados;
4. matriz RLS/RPC/Storage;
5. relatório de segurança;
6. relatório unitário e cobertura;
7. relatório das 24 jornadas E2E;
8. acessibilidade, navegadores e responsividade;
9. performance e concorrência;
10. checkout/webhook e ciclo de assinatura;
11. backup, restauração, RPO e RTO;
12. health checks, alertas e runbooks;
13. release, rollback e smoke de produção;
14. lista final de rotas sem placeholder;
15. declaração de zero defeito conhecido;
16. versão, commit, migrations e data certificada.

Evidências podem conter identificadores sanitizados, mas nunca senhas, tokens,
cookies, connection strings ou PII.

---

## 23. Critério de certificação final

O responsável técnico e o responsável de produto devem responder **Sim** a todas
as perguntas:

- O usuário consegue cumprir a jornada completa sem acesso ao banco?
- Dois tenants permanecem isolados em todas as superfícies?
- Cada papel possui exatamente o menor privilégio necessário?
- Tudo que a página de planos anuncia existe e é autorizado no backend?
- O ciclo de cobrança funciona no runtime publicado?
- O sistema continua consistente sob retry e concorrência?
- O conteúdo público exclui dados privados?
- O banco pode ser restaurado dentro de RPO/RTO?
- Um operador consegue diagnosticar e responder incidentes pelos runbooks?
- Todos os testes e gates obrigatórios estão verdes?
- Não existem mocks, placeholders, decisões em aberto ou defeitos conhecidos?
- O commit certificado é exatamente o commit implantado?

Qualquer resposta “Não” impede o encerramento.

---

## 24. Sequência imediata de execução

1. Aprovar este PRD como contrato de fechamento.
2. Executar FZ-0 e produzir a matriz de rastreabilidade.
3. Fechar FZ-1, começando pelas migrations locais/remotas, verificação de logo,
   matriz de privacidade e regeneração de tipos.
4. Remover contratos `untyped` somente após os tipos oficiais.
5. Executar a matriz de segurança completa da FZ-2.
6. Implementar e comprovar FZ-3 a FZ-6 na ordem definida.
7. Transformar as 24 jornadas em E2E obrigatório no CI.
8. Executar restore, billing, jobs, alertas e smoke publicado.
9. Corrigir toda falha encontrada, repetindo o gate afetado e os regressivos.
10. Emitir o pacote de evidências e a certificação final.

Este plano termina apenas na certificação. Não há uma fase “depois” para itens
incluídos na V1.
