-- Drift encontrado durante a P1 do PRD_FECHAMENTO_FINAL_PRODUCAO.
--
-- O enum public.championship_status tem oito labels em producao:
--
--   draft, active, finished, archived, registration_open, preparing,
--   suspended, published
--
-- Mas o repositorio so cria cinco: os quatro de 20260714124131 e 'published',
-- acrescentado por 20260718190000. Os tres do meio existem apenas em producao.
--
-- Isso importa porque consume_team_edit_token e get_team_edit_session comparam
-- `championships.status IN ('suspended','archived')`. O corpo plpgsql nao e
-- analisado na criacao da funcao, entao a cadeia de migrations aplica sem erro
-- num banco vazio — e as duas funcoes quebram na primeira chamada, com
-- `invalid input value for enum championship_status: "suspended"`. Fica de fora
-- de qualquer auditoria de schema, porque o catalogo nao acusa divergencia
-- dentro de corpo de funcao.
--
-- Em producao os tres ja existem: `IF NOT EXISTS` torna esta migration um
-- no-op la. O `BEFORE 'published'` reproduz a ordem de producao num banco novo,
-- para que ORDER BY sobre a coluna ordene igual nos dois lugares.
--
-- Fica em arquivo proprio porque `ALTER TYPE ... ADD VALUE` nao permite usar o
-- label novo na mesma transacao que o adiciona.

ALTER TYPE public.championship_status
  ADD VALUE IF NOT EXISTS 'registration_open' BEFORE 'published';
ALTER TYPE public.championship_status
  ADD VALUE IF NOT EXISTS 'preparing' BEFORE 'published';
ALTER TYPE public.championship_status
  ADD VALUE IF NOT EXISTS 'suspended' BEFORE 'published';
