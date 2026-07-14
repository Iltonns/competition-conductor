# IS Arena — Referência de Produto, Design e Implementação para o Codex

> **Status:** documento de referência principal  
> **Produto:** IS Arena  
> **Marca:** IS Gestão  
> **Tipo:** aplicação SaaS responsiva para gestão de competições esportivas  
> **Stack prevista:** React, TypeScript, Tailwind CSS, Supabase e PostgreSQL  
> **Documento de origem:** `IS Arena Design PRD.pdf`

---

## 0. Instruções para o Codex

Este documento deve ser tratado como a principal referência funcional, visual e técnica do projeto IS Arena.

Antes de alterar qualquer arquivo:

1. Analise integralmente o repositório.
2. Identifique a stack, as rotas, os componentes, os dados mockados e as integrações existentes.
3. Execute os comandos disponíveis de lint, testes e build.
4. Informe problemas encontrados antes de realizar mudanças estruturais.
5. Preserve o que já estiver funcional.
6. Não reescreva módulos inteiros sem necessidade comprovada.
7. Implemente uma etapa por vez.
8. Não avance para a etapa seguinte sem concluir e validar a atual.
9. Não exponha segredos, tokens, chaves ou credenciais.
10. Não faça alterações destrutivas no banco sem apresentar o impacto e solicitar autorização.

### Regras de trabalho

- Criar componentes reutilizáveis.
- Evitar duplicação de lógica e estilos.
- Manter TypeScript estrito sempre que possível.
- Preservar acessibilidade, responsividade e desempenho.
- Toda operação assíncrona deve possuir estado de carregamento, sucesso, erro e vazio.
- Toda exclusão deve exigir confirmação.
- Toda entrada do usuário deve ser validada.
- Alterações no banco devem ser feitas por migrations versionadas.
- Toda tabela administrativa deve estar protegida por Row Level Security.
- Dados de demonstração não devem ser misturados com dados reais.
- Não deixar `console.log`, código morto, comentários temporários ou credenciais no repositório.
- Não criar somente interfaces estáticas: os módulos obrigatórios devem persistir dados.
- A página pública deve funcionar sem autenticação, respeitando as regras de publicação.

### Relatório obrigatório ao concluir cada etapa

Ao finalizar uma tarefa, informar:

- Resumo do que foi implementado.
- Arquivos criados.
- Arquivos alterados.
- Migrations criadas.
- Decisões técnicas.
- Comandos executados.
- Resultado de lint.
- Resultado de testes.
- Resultado de build.
- Pendências.
- Riscos conhecidos.
- Próxima etapa recomendada.

---

# 1. Visão do produto

O **IS Arena** é uma plataforma completa para criação, gestão, divulgação e acompanhamento de campeonatos esportivos.

O produto deve reunir, em uma única aplicação, funcionalidades que atualmente estão fragmentadas entre aplicativos de tabela, súmula, inscrição, financeiro, comunicação, estatísticas e divulgação.

## Proposta de valor

> Gestão completa para grandes competições.

O IS Arena deve permitir que organizadores administrem campeonatos, equipes, atletas, partidas, súmulas, estatísticas, arbitragem, patrocinadores, notícias e finanças em um único ambiente.

## Posicionamento

O produto não deve ser apresentado apenas como um gerador de tabelas.

O posicionamento desejado é:

> **O ERP das competições esportivas.**

---

# 2. Público-alvo

## Público primário

- Organizadores independentes.
- Ligas amadoras.
- Copas municipais.
- Campeonatos de bairro.
- Secretarias municipais de esporte.
- Escolas e universidades.
- Associações esportivas.
- Clubes e escolinhas.

## Perfis de usuário

### Organizador

Pode administrar:

- Organizações.
- Campeonatos.
- Equipes.
- Atletas.
- Partidas.
- Súmulas.
- Classificação.
- Estatísticas.
- Arbitragem.
- Financeiro.
- Patrocinadores.
- Notícias.
- Página pública.

### Dirigente de equipe

Pode, conforme permissão:

- Administrar os dados da equipe.
- Cadastrar e atualizar atletas.
- Enviar documentos.
- Consultar partidas.
- Consultar estatísticas.
- Acompanhar inscrições e pagamentos.

### Árbitro ou oficial

Pode, conforme permissão:

- Consultar escalas.
- Abrir súmula.
- Registrar eventos da partida.
- Salvar rascunho.
- Finalizar súmula.

### Atleta

Pode:

- Consultar perfil.
- Ver partidas.
- Ver estatísticas.
- Acompanhar equipe e campeonato.

### Torcedor

Pode acessar conteúdo público:

- Jogos.
- Resultados.
- Classificação.
- Artilharia.
- Equipes.
- Notícias.
- Galeria.
- Patrocinadores.

---

# 3. Princípios do produto

1. **Gestão centralizada:** reduzir dependência de planilhas, formulários, WhatsApp e ferramentas isoladas.
2. **Experiência mobile-first:** operações de campo devem funcionar adequadamente em celulares.
3. **Visual esportivo premium:** o sistema não pode parecer um painel administrativo genérico.
4. **Dados em tempo real:** resultados e eventos devem refletir rapidamente na página pública.
5. **Multi-organização:** cada cliente deve operar em ambiente logicamente isolado.
6. **Segurança por padrão:** autenticação, autorização e RLS são requisitos essenciais.
7. **Escalabilidade funcional:** a arquitetura deve permitir novos esportes, formatos e integrações.
8. **Componentização:** toda interface recorrente deve ser criada como componente reutilizável.
9. **Auditabilidade:** ações administrativas importantes devem ser registradas.
10. **Consistência:** desktop e mobile devem compartilhar a mesma linguagem visual e regras de negócio.

---

# 4. Identidade visual

## Nome

**IS Arena**

## Slogan

**Gestão completa para grandes competições**

## Direção visual

A interface deve transmitir:

- Tecnologia.
- Competição.
- Performance.
- Organização.
- Credibilidade.
- Sensação premium.
- Atmosfera esportiva profissional.

## Paleta principal

| Uso | Direção |
|---|---|
| Fundo principal | Preto profundo |
| Fundo secundário | Azul-marinho quase preto |
| Cards | Grafite escuro com leve tonalidade azul |
| Destaque principal | Verde-limão neon |
| Texto principal | Branco |
| Texto secundário | Cinza claro |
| Bordas | Cinza escuro com baixa opacidade |
| Estado positivo | Verde |
| Alertas | Amarelo |
| Erros e cartão vermelho | Vermelho |
| Informações secundárias | Azul e roxo |

### Regra obrigatória

- Evitar fundos claros.
- A aplicação deve utilizar tema escuro.
- O verde neon deve ser usado como destaque, não como preenchimento excessivo.
- O contraste deve atender legibilidade e acessibilidade.

## Elementos de UI

Utilizar:

- Cards com bordas suaves.
- Cantos arredondados.
- Sombras discretas.
- Bordas finas.
- Gradientes sutis.
- Ícones minimalistas.
- Tipografia moderna e legível.
- Espaçamento consistente.
- Hierarquia visual clara.
- Microinterações.
- Animações discretas.
- Estados de hover e focus.
- Skeleton loading.
- Tooltips.
- Feedback visual nas ações.

Evitar:

- Excesso de elementos decorativos.
- Neon aplicado em grandes áreas.
- Gradientes agressivos.
- Tabelas ilegíveis no mobile.
- Componentes com aparência genérica de template.
- Cópia visual de concorrentes.

---

# 5. Logotipo

O sistema deve reservar espaço para o logotipo IS Arena em:

- Menu lateral.
- Cabeçalho mobile.
- Tela inicial.
- Página pública.
- Splash screen.
- Tela de autenticação.

O símbolo deve combinar as letras **IS** com aparência esportiva e futurista.

Cores principais:

- Verde neon.
- Branco.
- Preto/grafite no fundo.

O projeto deve permitir substituição futura do arquivo de logo sem alteração dos componentes.

---

# 6. Design system

Criar uma base visual centralizada.

## Tokens mínimos

- Cores.
- Tipografia.
- Espaçamento.
- Raios de borda.
- Sombras.
- Z-index.
- Breakpoints.
- Estados de interação.
- Duração e curva das animações.

## Tipografia

Definir estilos reutilizáveis para:

- Display.
- Título de página.
- Título de seção.
- Título de card.
- Texto de corpo.
- Texto auxiliar.
- Label.
- Badge.
- Número de indicador.

## Estados obrigatórios

Todos os componentes interativos devem prever:

- Default.
- Hover.
- Focus.
- Active.
- Disabled.
- Loading.
- Error.
- Success.

---

# 7. Layout administrativo desktop

Criar dashboard administrativo com menu lateral fixo.

## Sidebar

Itens:

- Logo IS Arena.
- Foto e nome do organizador.
- Campeonato selecionado.
- Dashboard.
- Campeonatos.
- Equipes.
- Atletas.
- Partidas.
- Classificação.
- Estatísticas.
- Financeiro.
- Mídia.
- Arbitragem.
- Patrocinadores.
- Configurações.

No rodapé:

- Plano atual.
- Validade da assinatura.
- Barra visual de uso.
- Perfil do usuário.

## Comportamento

- O item ativo deve ser claramente identificado.
- O item ativo pode usar verde neon com texto escuro, desde que mantenha contraste adequado.
- Itens inativos devem usar branco ou cinza claro.
- A sidebar deve poder ser recolhida em notebooks.
- O conteúdo não pode ficar escondido atrás da navegação.
- A sidebar deve ter rolagem própria quando necessário.

---

# 8. Navegação mobile

No mobile, utilizar navegação inferior fixa:

- Início.
- Jogos.
- Tabela.
- Equipes.
- Mais.

Adicionar uma ação central em destaque para ações rápidas.

A navegação mobile deve:

- Respeitar safe areas.
- Não encobrir conteúdo.
- Ter alvos de toque confortáveis.
- Manter indicação clara da rota ativa.
- Funcionar com teclado e leitores de tela.

---

# 9. Dashboard principal

## Cabeçalho

Mostrar:

- Título `Dashboard`.
- Subtítulo `Visão geral da sua competição`.
- Seletor de temporada.
- Notificações.
- Botão `Novo Campeonato`.

## Indicadores

Criar cards para:

- Campeonatos ativos.
- Equipes cadastradas.
- Atletas registrados.
- Jogos realizados.
- Gols marcados.

Cada card deve conter:

- Ícone.
- Valor principal.
- Título.
- Indicador comparativo.
- Tooltip quando necessário.

## Próximo jogo

Card principal com:

- Fase.
- Escudos.
- Equipe mandante.
- Equipe visitante.
- Data.
- Horário.
- Local.
- Contagem regressiva.
- Botão `Ver partida`.

O componente deve possuir aparência de evento principal, sem comprometer legibilidade.

## Classificação resumida

Colunas:

- Posição.
- Escudo.
- Equipe.
- Pontos.
- Jogos.
- Vitórias.
- Empates.
- Derrotas.
- Saldo de gols.

Destacar:

- Primeiro colocado.
- Zona de classificação.
- Zona de eliminação, quando aplicável.

## Artilharia resumida

Mostrar:

- Foto.
- Nome.
- Equipe.
- Gols.
- Posição no ranking.

## Desempenho

Gráfico de linha com filtros para:

- Gols.
- Jogos.
- Participação.
- Crescimento mensal.

Direção visual:

- Linha de destaque verde neon.
- Fundo escuro.
- Tooltip acessível.
- Legendas claras.
- Estado vazio.

---

# 10. Tela inicial mobile

Mostrar:

- Saudação ao organizador.
- Campeonato em destaque.
- Banner com troféu, estádio ou atmosfera esportiva.
- Próximo jogo.
- Contagem regressiva.
- Ações rápidas.
- Últimos resultados.
- Classificação resumida.
- Notícias recentes.

## Ações rápidas

- Nova partida.
- Nova equipe.
- Novo atleta.
- Abrir súmula.

---

# 11. Campeonatos

## Funcionalidades obrigatórias

- Listar campeonatos.
- Criar campeonato.
- Editar campeonato.
- Arquivar campeonato.
- Excluir conforme regra.
- Alterar status.
- Selecionar campeonato ativo.
- Configurar temporada.
- Configurar formato.
- Configurar critérios de desempate.
- Configurar publicação.
- Configurar identidade visual.
- Configurar patrocinadores.

## Dados mínimos

- Nome.
- Descrição.
- Logo.
- Modalidade.
- Categoria.
- Cidade.
- Estado.
- Ano/temporada.
- Data inicial.
- Data final.
- Status.
- Regulamento.
- Formato.
- Visibilidade.
- Slug público.

## Status sugeridos

- Rascunho.
- Inscrições abertas.
- Em preparação.
- Em andamento.
- Suspenso.
- Finalizado.
- Arquivado.

---

# 12. Equipes

## Tela de listagem

Exibir equipes em cards com:

- Escudo.
- Nome.
- Quantidade de atletas.
- Cidade.
- Status.
- Indicadores de desempenho.

Adicionar:

- Busca.
- Filtros.
- Ordenação.
- Botão `Nova Equipe`.
- Paginação ou carregamento incremental.
- Estado vazio.
- Estado de carregamento.

## Funcionalidades

- Criar equipe.
- Editar equipe.
- Arquivar equipe.
- Associar ao campeonato.
- Vincular dirigentes.
- Gerenciar elenco.
- Gerenciar comissão técnica.
- Consultar histórico.

---

# 13. Elenco e atletas

## Tela da equipe

Mostrar:

- Escudo.
- Nome.
- Comissão técnica.
- Estatísticas.
- Lista de atletas.

## Dados do atleta

- Foto.
- Nome.
- Data de nascimento.
- Documento, quando exigido.
- Número da camisa.
- Posição.
- Status.
- Equipe.
- Jogos.
- Gols.
- Assistências.
- Cartões.
- Histórico.

## Funcionalidades

- Adicionar atleta.
- Editar atleta.
- Transferir atleta.
- Ativar/inativar.
- Validar inscrição.
- Enviar documentos.
- Consultar estatísticas.
- Evitar duplicidade dentro das regras da organização.

---

# 14. Partidas

## Filtros

- Todas.
- Agendadas.
- Em andamento.
- Finalizadas.
- Adiadas.
- Canceladas.

## Card de partida

Mostrar:

- Fase.
- Rodada.
- Escudos.
- Equipes.
- Data.
- Horário.
- Local.
- Status.
- Placar, quando aplicável.

## Funcionalidades

- Criar partida.
- Editar partida.
- Reagendar.
- Adiar.
- Cancelar.
- Iniciar.
- Finalizar.
- Registrar resultado.
- Abrir súmula.
- Consultar detalhes.
- Publicar ou ocultar.

---

# 15. Tela detalhada da partida

Mostrar:

- Status.
- Fase.
- Rodada.
- Escudos.
- Equipes.
- Placar.
- Data.
- Horário.
- Local.
- Arbitragem.

## Abas

- Eventos.
- Escalações.
- Estatísticas.
- Súmula.

## Linha do tempo

Cada evento deve apresentar:

- Minuto.
- Período.
- Tipo.
- Jogador.
- Equipe.
- Ícone.
- Responsável pelo registro.
- Horário de criação, quando necessário para auditoria.

---

# 16. Súmula digital

A súmula deve ser otimizada para celular e uso em campo.

## Eventos rápidos

- Gol.
- Cartão amarelo.
- Cartão vermelho.
- Substituição.
- Assistência.
- Lesão.
- Acréscimo.
- Observação.

## Campos

- Equipe.
- Atleta.
- Minuto.
- Período.
- Observação.

## Ações

- Salvar rascunho.
- Editar evento.
- Remover evento com confirmação.
- Finalizar partida.
- Confirmar resultado.
- Reabrir mediante permissão.
- Gerar relatório.

## Requisitos

- Exibir eventos em ordem cronológica.
- Evitar perda de dados.
- Possuir salvamento progressivo.
- Preparar arquitetura para modo offline e sincronização posterior.
- Registrar auditoria de alterações relevantes.

---

# 17. Classificação

## Visualização

Abas ou filtros para:

- Grupo A.
- Grupo B.
- Demais grupos.
- Classificação geral.
- Mata-mata.

## Colunas

- Posição.
- Equipe.
- Pontos.
- Jogos.
- Vitórias.
- Empates.
- Derrotas.
- Gols pró.
- Gols contra.
- Saldo de gols.
- Aproveitamento, quando habilitado.

## Regras

A classificação deve ser calculada automaticamente a partir dos resultados confirmados.

Parâmetros padrão:

- Vitória: 3 pontos.
- Empate: 1 ponto.
- Derrota: 0 ponto.

Os critérios devem ser configuráveis por campeonato.

Exemplo de critérios:

1. Pontos.
2. Vitórias.
3. Saldo de gols.
4. Gols pró.
5. Confronto direto.
6. Menor número de cartões.
7. Sorteio.

## Destaques

- Zona de classificação.
- Zona de eliminação.
- Líder.
- Classificados matematicamente, quando calculável.

---

# 18. Estatísticas

## Abas

- Artilharia.
- Assistências.
- Cartões.
- Goleiros.
- Equipes.

## Destaque do líder

Mostrar:

- Foto.
- Nome.
- Equipe.
- Quantidade.
- Gráfico circular.
- Posição.

## Estatísticas de equipe

- Melhor ataque.
- Melhor defesa.
- Mais vitórias.
- Mais empates.
- Mais cartões.
- Aproveitamento.

Os dados devem ser derivados dos eventos e resultados, evitando duplicação manual.

---

# 19. Arbitragem

## Funcionalidades

- Cadastrar árbitros.
- Cadastrar assistentes.
- Cadastrar mesários e oficiais.
- Registrar disponibilidade.
- Escalar por partida.
- Controlar conflito de agenda.
- Registrar pagamento.
- Consultar histórico.
- Vincular à súmula.

## Dados mínimos

- Nome.
- Contato.
- Documento, quando necessário.
- Função.
- Status.
- Disponibilidade.
- Valor padrão.
- Histórico de escalas.

---

# 20. Financeiro

## Indicadores

- Receitas.
- Despesas.
- Lucro.
- Saldo.
- Inscrições pendentes.
- Pagamentos de arbitragem.

## Gráficos

- Receitas por categoria.
- Despesas por categoria.
- Evolução financeira.
- Inscrições pagas e pendentes.

## Receitas possíveis

- Inscrição.
- Patrocínio.
- Bilheteria.
- Publicidade.
- Multas.
- Outros.

## Despesas possíveis

- Arbitragem.
- Premiação.
- Locação.
- Segurança.
- Material esportivo.
- Comunicação.
- Outros.

## Requisitos

- Filtros por período.
- Filtros por campeonato.
- Categorias configuráveis.
- Anexos.
- Status do lançamento.
- Relatórios.
- Controle de permissão.
- Auditoria.

---

# 21. Inscrições e pagamentos

A arquitetura deve permitir:

- Inscrição online de equipes.
- Formulário configurável.
- Envio de documentos.
- Aprovação ou reprovação.
- Cobrança de taxa.
- Pagamento por PIX.
- Integração futura com gateways.
- Status de pagamento.
- Comprovante.
- Notificações.

Não implementar integração financeira externa sem:

- Variáveis de ambiente.
- Tratamento de webhook.
- Idempotência.
- Verificação de assinatura.
- Registro de eventos.
- Ambiente de teste.

---

# 22. Notícias e mídia

## Notícias

Mostrar:

- Imagem.
- Título.
- Resumo.
- Conteúdo.
- Data.
- Autor.
- Campeonato relacionado.
- Status de publicação.

A notícia principal deve aparecer em destaque.

## Mídia

Preparar estrutura para:

- Fotos.
- Vídeos.
- Galerias.
- Links de transmissão.
- Artes.
- Documentos.

Usar Supabase Storage com políticas adequadas.

---

# 23. Patrocinadores

Permitir:

- Cadastrar patrocinador.
- Enviar logo.
- Informar link.
- Definir categoria/cota.
- Definir ordem de exibição.
- Definir período.
- Exibir na página pública.
- Exibir em peças e áreas selecionadas.

---

# 24. Página pública do campeonato

A página pública deve ser responsiva e acessível sem login.

## Cabeçalho

- Logo IS Arena.
- Nome do campeonato.
- Ano.
- Frase de destaque.
- Banner com atmosfera esportiva.
- Botão `Acompanhar agora`.

## Navegação

- Início.
- Jogos.
- Classificação.
- Equipes.
- Notícias.
- Galeria.
- Artilharia.
- Contato.

## Conteúdo

- Patrocinadores.
- Próximos jogos.
- Últimos resultados.
- Classificação.
- Artilharia.
- Notícias.
- Galeria.
- Links sociais.

## Requisitos

- URL amigável baseada em slug.
- SEO básico.
- Metadados sociais.
- Estado de campeonato não publicado.
- Cache controlado.
- Conteúdo baseado apenas em dados publicados.
- Boa performance em redes móveis.

---

# 25. Splash screen e carregamento

Criar tela de abertura com:

- Fundo preto.
- Logo IS Arena centralizada.
- Linhas esportivas verdes.
- Efeitos de luz discretos.
- Slogan.

Evitar animações excessivas.

O carregamento de rotas deve utilizar skeletons ou indicadores consistentes com o design system.

---

# 26. Responsividade

## Desktop

- Sidebar fixa ou recolhível.
- Conteúdo em múltiplas colunas.
- Cards amplos.
- Tabelas completas.
- Cabeçalho com ações.

## Notebook

- Sidebar recolhível.
- Evitar perda de conteúdo vertical.
- Garantir rolagem adequada.
- Reduzir densidade sem esconder informações essenciais.

## Tablet

- Layout adaptativo.
- Cards em uma ou duas colunas.
- Tabelas com priorização de colunas.
- Navegação apropriada.

## Mobile

- Navegação inferior.
- Cards em coluna única.
- Tabelas adaptadas.
- Filtros horizontais.
- Ações rápidas.
- Botões maiores.
- Áreas clicáveis confortáveis.

### Regra obrigatória

Nenhum conteúdo pode ultrapassar a largura da tela.

---

# 27. Componentes reutilizáveis

Criar componentes para:

- `AppSidebar`
- `AppHeader`
- `MobileBottomNavigation`
- `PageHeader`
- `KpiCard`
- `MatchCard`
- `TeamCard`
- `PlayerCard`
- `StatisticsCard`
- `RankingList`
- `StandingsTable`
- `StatusBadge`
- `Tabs`
- `Modal`
- `Dropdown`
- `SearchInput`
- `EmptyState`
- `LoadingState`
- `ConfirmDialog`
- `Toast`
- `FileUpload`
- `DatePicker`
- `ChartContainer`
- `SponsorCard`
- `NewsCard`
- `FilterBar`
- `ResponsiveDataView`
- `ErrorBoundary`

Os nomes podem ser ajustados à convenção existente, mas a responsabilidade de cada componente deve permanecer clara.

---

# 28. Dados de demonstração

## Campeonato

**Copa da Baixada 2026**

## Equipes fictícias

- Amazonas EC.
- Guarani FC.
- Real Unidos.
- Vila Nova FC.
- Unidos do Sul.
- São Pedro FC.
- Atlético City.
- Nova Geração.

## Jogadores fictícios

- João Pedro.
- Matheus Lima.
- Carlos Eduardo.
- Vinícius Rocha.
- Rafael Souza.

## Regras

- Utilizar escudos fictícios visualmente consistentes.
- Não utilizar marcas ou clubes profissionais reais.
- Separar seeds de demonstração dos dados reais.
- Permitir remoção fácil dos dados de demonstração.

---

# 29. Requisitos técnicos

## Frontend

- React.
- TypeScript.
- Tailwind CSS.
- Biblioteca de componentes existente no projeto, quando aplicável.
- Roteamento consistente.
- Formulários tipados e validados.
- Componentes acessíveis.
- Tratamento de erros.

## Backend e dados

- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Row Level Security.
- Functions ou Edge Functions quando necessário.
- Migrations versionadas.
- Triggers e funções SQL somente quando justificadas.

## Arquitetura

- Multiusuário.
- Multiorganização.
- Separação clara entre UI, domínio, acesso a dados e integrações.
- Tipos de banco gerados ou sincronizados.
- Nenhuma chave `service_role` no frontend.
- Nenhum segredo commitado.

---

# 30. Modelo de dados de referência

A estrutura final deve considerar as seguintes entidades:

- `profiles`
- `organizations`
- `organization_members`
- `championships`
- `championship_settings`
- `teams`
- `team_members`
- `athletes`
- `venues`
- `referees`
- `referee_assignments`
- `groups`
- `rounds`
- `matches`
- `match_events`
- `lineups`
- `substitutions`
- `standings`
- `sponsors`
- `news`
- `media`
- `registrations`
- `payments`
- `financial_transactions`
- `notifications`
- `audit_logs`

## Campos administrativos padrão

Sempre que fizer sentido:

- `id`
- `organization_id`
- `created_at`
- `updated_at`
- `created_by`

## Campos adicionais recomendados

Conforme a entidade:

- `status`
- `metadata`
- `published_at`
- `deleted_at`
- `updated_by`

A adoção de soft delete deve ser avaliada por entidade, não aplicada automaticamente a tudo.

---

# 31. Multi-organização e autorização

Cada organizador deve acessar apenas:

- Suas organizações.
- Seus campeonatos.
- Suas equipes.
- Seus atletas.
- Suas partidas.
- Seus dados financeiros.
- Seus arquivos.

## Papéis mínimos sugeridos

- `owner`
- `admin`
- `manager`
- `team_manager`
- `referee`
- `editor`
- `viewer`

## Regras

- Usuário autenticado não implica acesso automático.
- O acesso deve depender de vínculo em `organization_members`.
- Permissões administrativas devem ser verificadas no banco.
- Páginas públicas devem retornar apenas registros publicados.
- Toda política RLS deve possuir casos de teste.
- Operações privilegiadas devem ocorrer em ambiente seguro.

---

# 32. Auditoria

Registrar eventos importantes:

- Criação, edição e exclusão de campeonato.
- Alteração de resultado.
- Finalização e reabertura de súmula.
- Alteração de classificação manual, se permitida.
- Alteração de pagamento.
- Mudança de permissões.
- Publicação de conteúdo.
- Exclusão de arquivos.

O log deve registrar, quando aplicável:

- Usuário.
- Organização.
- Ação.
- Entidade.
- Identificador.
- Data e hora.
- Valores anteriores.
- Valores posteriores.
- Contexto técnico mínimo.

---

# 33. Regras funcionais obrigatórias

O sistema não deve ser apenas um protótipo.

Implementar:

- Autenticação.
- Navegação funcional.
- CRUD de campeonatos.
- CRUD de equipes.
- CRUD de atletas.
- CRUD de partidas.
- Registro de resultados.
- Registro de eventos.
- Classificação automática.
- Ranking de artilharia.
- Página pública.
- Responsividade.
- Validações.
- Estados de carregamento.
- Estados vazios.
- Mensagens de erro.
- Confirmação de exclusão.
- Persistência no Supabase.
- RLS.
- Controle por organização.

---

# 34. Diferencial visual e competitivo

O IS Arena não deve parecer cópia do Copa Fácil, iFut ou qualquer outro concorrente.

O diferencial deve estar em:

- Dashboard orientado a dados.
- Estética esportiva premium.
- Navegação simples.
- Indicadores visuais.
- Experiência semelhante a ferramentas de análise esportiva.
- Forte presença de gráficos úteis.
- Cards de partida cinematográficos, mas legíveis.
- Página pública com aparência de portal oficial.
- Experiência consistente entre desktop e mobile.
- Operações de campo otimizadas para celular.
- Concentração de gestão esportiva, financeira e de mídia.

A referência visual deve orientar a linguagem do produto, mas os componentes precisam ser funcionais, escaláveis e reutilizáveis.

---

# 35. Acessibilidade

Requisitos mínimos:

- Navegação por teclado.
- Foco visível.
- Labels em formulários.
- Contraste suficiente.
- Textos alternativos em imagens.
- Ícones com rótulos acessíveis.
- Mensagens de erro associadas ao campo.
- Modais com gerenciamento correto de foco.
- Tabelas com cabeçalhos semânticos.
- Respeito à preferência por redução de movimento.

---

# 36. Performance

- Carregar rotas sob demanda quando adequado.
- Otimizar imagens.
- Evitar consultas repetidas.
- Usar paginação em listas grandes.
- Evitar re-renderizações desnecessárias.
- Definir estratégia de cache.
- Exibir skeletons durante carregamento.
- Medir bundle e tempo de carregamento.
- Não carregar gráficos pesados fora de contexto.

---

# 37. Tratamento de erros

Toda integração deve prever:

- Timeout.
- Retentativa segura, quando aplicável.
- Mensagem para o usuário.
- Log técnico sem expor dados sensíveis.
- Estado recuperável.
- Idempotência em operações críticas.

Erros do Supabase não devem ser exibidos integralmente ao usuário final.

---

# 38. Testes

## Mínimo esperado

- Testes unitários para regras de classificação.
- Testes de validação de formulários.
- Testes de permissões.
- Testes das políticas RLS.
- Testes de fluxos críticos.
- Teste de build.
- Teste de responsividade das telas principais.

## Fluxos críticos

1. Criar organização.
2. Criar campeonato.
3. Cadastrar equipes.
4. Cadastrar atletas.
5. Gerar ou cadastrar partidas.
6. Registrar resultado.
7. Registrar eventos.
8. Atualizar classificação.
9. Atualizar artilharia.
10. Publicar campeonato.
11. Consultar página pública sem login.
12. Impedir acesso cruzado entre organizações.

---

# 39. Critérios de aceite globais

Uma funcionalidade só é considerada concluída quando:

- Está conectada ao banco quando exigido.
- Possui autorização adequada.
- Possui validação.
- Possui loading.
- Possui estado vazio.
- Possui tratamento de erro.
- Funciona em desktop.
- Funciona em mobile.
- Não apresenta erro de TypeScript.
- Não quebra lint.
- Não quebra build.
- Possui teste ou justificativa documentada.
- Não expõe dados de outra organização.
- Mantém a identidade visual do produto.

---

# 40. Ordem obrigatória de implementação

Implementar na seguinte sequência:

1. Auditoria do repositório atual.
2. Design system.
3. Autenticação.
4. Estrutura de organização.
5. Row Level Security.
6. Dashboard.
7. Campeonatos.
8. Equipes.
9. Atletas.
10. Partidas.
11. Súmula digital.
12. Classificação.
13. Estatísticas.
14. Página pública.
15. Arbitragem.
16. Financeiro.
17. Notícias e mídia.
18. Patrocinadores.
19. Responsividade final.
20. Validações.
21. Segurança.
22. Testes.
23. Performance.
24. Documentação.

Antes de avançar para módulos secundários, garantir que os módulos principais estejam funcionais e conectados ao Supabase.

---

# 41. Etapas recomendadas para execução

## Etapa 0 — Auditoria

Sem alterar arquivos:

- Mapear estrutura.
- Identificar dependências.
- Identificar rotas.
- Identificar componentes.
- Identificar mocks.
- Identificar integração Supabase.
- Rodar lint, testes e build.
- Comparar estado atual com este documento.
- Produzir plano por etapas.

## Etapa 1 — Fundação visual

- Tokens.
- Tipografia.
- Layout.
- Sidebar.
- Header.
- Navegação mobile.
- Componentes base.
- Estados de loading, erro e vazio.

## Etapa 2 — Fundação de dados

- Auth.
- Profiles.
- Organizations.
- Organization members.
- Roles.
- RLS.
- Tipos.
- Helpers de autorização.

## Etapa 3 — Núcleo competitivo

- Campeonatos.
- Equipes.
- Atletas.
- Partidas.
- Eventos.
- Classificação.
- Estatísticas.

## Etapa 4 — Operação de campo

- Súmula.
- Escalação.
- Substituição.
- Arbitragem.
- Rascunho.
- Finalização.
- Auditoria.

## Etapa 5 — Experiência pública

- Slug.
- Portal público.
- Jogos.
- Resultados.
- Classificação.
- Artilharia.
- Notícias.
- Patrocinadores.
- SEO.

## Etapa 6 — Gestão ampliada

- Financeiro.
- Inscrições.
- Pagamentos.
- Mídia.
- Notificações.

---

# 42. Não objetivos imediatos

Não priorizar antes do núcleo estar estável:

- Aplicativo nativo separado.
- Marketplace.
- Ranking nacional.
- Streaming próprio.
- Inteligência artificial generativa.
- Geração automática de artes.
- Integrações complexas com federações.
- Funcionamento offline completo.
- Internacionalização ampla.
- Sistema avançado de assinatura.

A arquitetura deve permitir evolução futura, mas o MVP não deve ser comprometido por escopo excessivo.

---

# 43. Prompt inicial sugerido para o Codex

```text
Analise integralmente este repositório do IS Arena antes de fazer qualquer alteração.

Leia o arquivo IS_ARENA_CODEX_REFERENCE.md e trate-o como referência principal do produto.

O projeto foi iniciado no Lovable e utiliza React, TypeScript, Tailwind e Supabase.

Faça uma auditoria e apresente:

1. Estrutura atual do projeto.
2. Tecnologias e dependências utilizadas.
3. Rotas e telas existentes.
4. Componentes reutilizáveis existentes.
5. Módulos implementados.
6. Dados mockados.
7. Integração atual com Supabase.
8. Estrutura atual do banco.
9. Políticas RLS existentes.
10. Problemas de arquitetura.
11. Erros de TypeScript, lint, testes e build.
12. Problemas de responsividade.
13. Problemas de segurança.
14. Diferenças entre o estado atual e o documento de referência.
15. Plano de implementação dividido em etapas pequenas.

Não altere arquivos nesta primeira análise.
Não instale dependências sem justificar.
Não faça mudanças destrutivas.
```

---

# 44. Prompt para implementação de uma etapa

```text
Implemente somente a etapa aprovada.

Regras:

- Leia IS_ARENA_CODEX_REFERENCE.md.
- Preserve o layout e as funcionalidades fora do escopo.
- Não reescreva módulos sem necessidade.
- Use componentes reutilizáveis.
- Use migrations para alterações no banco.
- Implemente RLS quando houver dados por organização.
- Não exponha segredos.
- Adicione validação, loading, erro e estado vazio.
- Garanta responsividade.
- Execute lint, testes e build.

Ao terminar, informe:

- Resumo.
- Arquivos criados.
- Arquivos alterados.
- Migrations.
- Decisões técnicas.
- Testes executados.
- Resultado do lint.
- Resultado do build.
- Pendências.
- Riscos.
```

---

# 45. Checklist de revisão

## Produto

- [ ] A funcionalidade atende ao objetivo do módulo.
- [ ] O fluxo é compreensível para um organizador.
- [ ] Não exige etapas desnecessárias.
- [ ] Possui feedback para todas as ações.

## Visual

- [ ] Mantém tema escuro.
- [ ] Usa verde neon com moderação.
- [ ] Mantém hierarquia visual.
- [ ] Não parece um template administrativo genérico.
- [ ] Funciona em desktop e mobile.
- [ ] Não possui overflow.

## Código

- [ ] TypeScript sem erros.
- [ ] Componentes reutilizáveis.
- [ ] Sem duplicação evidente.
- [ ] Sem segredos.
- [ ] Sem código morto.
- [ ] Sem logs temporários.
- [ ] Tratamento de erros implementado.

## Banco e segurança

- [ ] Migration versionada.
- [ ] RLS habilitada.
- [ ] Políticas testadas.
- [ ] `organization_id` aplicado corretamente.
- [ ] Acesso cruzado bloqueado.
- [ ] Página pública expõe apenas dados publicados.

## Qualidade

- [ ] Lint aprovado.
- [ ] Testes aprovados.
- [ ] Build aprovado.
- [ ] Fluxo principal testado manualmente.
- [ ] Pendências documentadas.

---

# 46. Fonte de verdade e controle de alterações

Este documento deve permanecer versionado no repositório.

Local sugerido:

```text
/docs/IS_ARENA_CODEX_REFERENCE.md
```

Ou, caso o projeto ainda não possua diretório de documentação:

```text
/IS_ARENA_CODEX_REFERENCE.md
```

Toda mudança relevante de escopo deve atualizar este arquivo ou gerar um ADR/documento complementar.

Não alterar requisitos críticos silenciosamente.

Requisitos críticos incluem:

- Multi-organização.
- RLS.
- Página pública.
- Classificação automática.
- Súmula digital.
- Responsividade.
- Identidade visual.
- Persistência no Supabase.
- Isolamento de dados.
