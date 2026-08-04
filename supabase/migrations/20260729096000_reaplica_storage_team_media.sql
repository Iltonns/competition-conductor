-- Reaplica o bucket e as policies de mídia de equipe.
--
-- Contexto (FZ-1 do PRD de fechamento): a migration
-- 20260715213000_team_media_storage.sql consta como aplicada no histórico,
-- mas seu conteúdo nunca chegou ao banco — provavelmente porque foi
-- registrada pelo fluxo antigo (SQL executado manualmente, depois marcado
-- como aplicado na CLI) e a parte de Storage ficou de fora.
--
-- Evidência colhida em produção:
--   - storage.buckets tem 5 dos 6 buckets que o repositório cria; falta
--     exatamente 'team-media';
--   - pg_policies em storage.objects tem 13 policies, e nenhuma das três
--     team_media_*.
--
-- Efeito no produto: o upload de escudo e capa de equipe falha. Não é uma
-- brecha de segurança — sem policy, o RLS de storage.objects nega a operação
-- (fail-closed). É uma funcionalidade indisponível.
--
-- Consumidor: src/features/teams/services/team-media.service.ts, que grava em
-- '{auth.uid()}/{kind}-{uuid}.{ext}' — caminho que as policies abaixo exigem.
--
-- Diferente das demais migrations de fechamento, esta PRECISA ser executada no
-- banco (supabase db push). Não pode ser apenas registrada, porque o objeto
-- realmente não existe.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-media',
  'team-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "team_media_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_media_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "team_media_owner_delete" ON storage.objects;

CREATE POLICY "team_media_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "team_media_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "team_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
