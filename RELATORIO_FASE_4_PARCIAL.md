# Relatório parcial — Fase 4

Data: 22/07/2026

## Entregue

- notícias com slug por campeonato, rascunho, agendamento, publicação, despublicação por retorno a rascunho e arquivamento;
- corpo editorial persistido como texto sanitizado, sem renderização HTML no portal;
- biblioteca de mídia em bucket privado, com PDF/JPG/PNG/WebP, limite de 10 MB, texto alternativo e publicação seletiva;
- arquivamento de mídia bloqueado quando o item está em uso como capa ou em galeria;
- patrocinadores com cota, URL HTTPS, período de exibição, ordem e status;
- configuração da página pública com descrição, tema, contato, redes sociais e seções visíveis;
- checklist transacional para publicar/despublicar o campeonato;
- tabelas e policies para galerias ordenadas e link HTTPS de transmissão por partida;
- contrato público `get_public_championship_portal`, com lista explícita de campos e sem PII;
- portal `/c/$slug` abastecido por dados reais, com estado de indisponibilidade para slug privado ou inexistente;
- SEO básico dinâmico e navegação final sem `href="#"`;
- rotas contextuais de Notícias e mídia, Patrocinadores e Página pública habilitadas no cockpit;
- rotas globais antigas de mídia e patrocinadores redirecionadas para a seleção de campeonato.

## Validação

- migration remota `20260722170000_phase4_publishing_portal.sql` aplicada ao projeto `lzjkvgvlfupklpmytvbr`;
- histórico local e remoto reconciliado até `20260722170000`;
- `supabase db lint --linked --schema public --level error`: aprovado sem erros;
- tipos TypeScript regenerados a partir do schema remoto;
- build e typecheck aprovados após a regeneração final dos tipos;
- 32 testes aprovados;
- lint sem erros e com oito avisos preexistentes de Fast Refresh.

## Continuidade

- criar a interface administrativa de galerias e de transmissão por partida sobre as estruturas já migradas;
- adicionar upload/substituição de logo de patrocinador usando a biblioteca de mídia;
- executar E2E autenticado de publicação/despublicação e validação visual responsiva do portal;
- validar RLS anônima e administrativa com usuários reais de papéis distintos.
