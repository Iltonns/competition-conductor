-- Colunas que existem em produção mas não são criadas pela cadeia de migrations.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): além das 14 tabelas criadas
-- fora do controle de versão, 9 tabelas versionadas receberam colunas
-- diretamente no banco. Sem esta compensação a cadeia não roda do zero.
--
-- Aplicado no fim da cadeia porque financial_transactions só nasce em 20260727120000.
--
-- Tabelas cobertas neste arquivo: financial_transactions.
-- Todas as adições são idempotentes (ADD COLUMN IF NOT EXISTS + guarda de constraint).

ALTER TABLE "public"."financial_transactions"
  ADD COLUMN IF NOT EXISTS "payment_id" "uuid",
  ADD COLUMN IF NOT EXISTS "referee_assignment_id" "uuid",
  ADD COLUMN IF NOT EXISTS "attachment_url" "text",
  ADD COLUMN IF NOT EXISTS "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_transactions_payment_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."financial_transactions"
      ADD CONSTRAINT "financial_transactions_payment_id_fkey" FOREIGN KEY ("payment_id")
      REFERENCES "public"."payments"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_transactions_referee_assignment_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."financial_transactions"
      ADD CONSTRAINT "financial_transactions_referee_assignment_id_fkey" FOREIGN KEY ("referee_assignment_id")
      REFERENCES "public"."referee_assignments"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;
