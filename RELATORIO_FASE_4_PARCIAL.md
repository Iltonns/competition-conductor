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

### Incremento de continuidade — 26/07/2026

- interface administrativa para criar, editar, ordenar, publicar e arquivar galerias;
- seleção ordenada de imagens da biblioteca, com legenda por item;
- persistência transacional de galeria e itens por RPC, com validação de mídia,
  organização e campeonato;
- campo HTTPS de transmissão incorporado à edição da partida e ao portal público;
- atualização atômica dos detalhes públicos da partida, com auditoria;
- upload e substituição de logo de patrocinador pela biblioteca privada de mídia;
- vínculo `sponsors.logo_media_id`, validado no backend contra o mesmo campeonato;
- URLs temporárias geradas em runtime para logos e imagens públicas, sem persistir
  URLs assinadas expiradas;
- portal público atualizado para exibir galerias publicadas e logos vinculados;
- arquivamento de mídia bloqueado quando ela estiver em uma galeria, página pública
  ou logo de patrocinador;
- verificação SQL da Fase 4 ampliada para os novos contratos e privilégios.

## Validação local do incremento de 26/07/2026

- `npm run typecheck`: aprovado;
- `npm run lint`: zero erros e oito avisos preexistentes de Fast Refresh;
- `npm run test`: 32 testes aprovados;
- `npm run build`: aprovado fora do sandbox após o erro ambiental `spawn EPERM`;
- `git diff --check`: aprovado, com apenas avisos de normalização LF/CRLF.

## Gate remoto do incremento

A migration `20260726120000_phase4_gallery_broadcast_sponsor_media.sql` ainda não foi
aplicada. A consulta de histórico remoto foi interrompida com
`LegacyPlatformAuthRequiredError`, pois a sessão administrativa da CLI expirou.

Antes de liberar o incremento:

1. autenticar a CLI por meio seguro, sem compartilhar o token na conversa;
2. executar `supabase migration list --linked` e `supabase db push --linked --dry-run`;
3. aplicar a migration em homologação;
4. executar `supabase db lint --linked --schema public --level error`;
5. regenerar oficialmente `src/integrations/supabase/types.ts`;
6. executar `supabase/tests/phase4_publishing_verification.sql`;
7. validar RLS com admin, viewer, outro tenant e acesso anônimo;
8. executar E2E autenticado e validação visual responsiva do portal.

Com este incremento, os três gaps funcionais locais anteriormente listados foram
implementados. A Fase 4 continua parcial até a aprovação dos gates remotos e E2E.
