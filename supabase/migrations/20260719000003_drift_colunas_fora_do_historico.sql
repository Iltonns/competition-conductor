-- Colunas que existem em produção mas não são criadas pela cadeia de migrations.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): além das 14 tabelas criadas
-- fora do controle de versão, 9 tabelas versionadas receberam colunas
-- diretamente no banco. Sem esta compensação a cadeia não roda do zero.
--
-- Aplicado logo após a baseline 20260719000000, onde estas tabelas já existem.
--
-- Tabelas cobertas neste arquivo: championship_team_staff, championship_teams, championships, match_events, matches, referees, team_responsibles, team_staff.
-- Todas as adições são idempotentes (ADD COLUMN IF NOT EXISTS + guarda de constraint).

ALTER TABLE "public"."championship_team_staff"
  ADD COLUMN IF NOT EXISTS "team_id" "uuid" NOT NULL,
  ADD COLUMN IF NOT EXISTS "role" "text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "registration_status" "text" DEFAULT 'registered'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "created_by" "uuid",
  ADD COLUMN IF NOT EXISTS "updated_by" "uuid";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_team_staff_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."championship_team_staff"
      ADD CONSTRAINT "championship_team_staff_created_by_fkey" FOREIGN KEY ("created_by")
      REFERENCES "auth"."users"("id");
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_team_staff_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."championship_team_staff"
      ADD CONSTRAINT "championship_team_staff_updated_by_fkey" FOREIGN KEY ("updated_by")
      REFERENCES "auth"."users"("id");
  END IF;
END
$drift$;

ALTER TABLE "public"."championship_teams"
  ADD COLUMN IF NOT EXISTS "category_id" "uuid",
  ADD COLUMN IF NOT EXISTS "group_id" "uuid",
  ADD COLUMN IF NOT EXISTS "fee_amount" numeric(14,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "approved_by" "uuid",
  ADD COLUMN IF NOT EXISTS "notes" "text",
  ADD COLUMN IF NOT EXISTS "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."championship_teams"
      ADD CONSTRAINT "championship_teams_category_id_fkey" FOREIGN KEY ("category_id")
      REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_group_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."championship_teams"
      ADD CONSTRAINT "championship_teams_group_id_fkey" FOREIGN KEY ("group_id")
      REFERENCES "public"."competition_groups"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_approved_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."championship_teams"
      ADD CONSTRAINT "championship_teams_approved_by_fkey" FOREIGN KEY ("approved_by")
      REFERENCES "auth"."users"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

ALTER TABLE "public"."championships"
  ADD COLUMN IF NOT EXISTS "sport" "text" DEFAULT 'football'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "modality" "text",
  ADD COLUMN IF NOT EXISTS "regulations_url" "text",
  ADD COLUMN IF NOT EXISTS "registration_opens_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "registration_closes_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;

ALTER TABLE "public"."match_events"
  ADD COLUMN IF NOT EXISTS "related_athlete_id" "uuid";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'match_events_related_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."match_events"
      ADD CONSTRAINT "match_events_related_athlete_id_fkey" FOREIGN KEY ("related_athlete_id")
      REFERENCES "public"."athletes"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

ALTER TABLE "public"."matches"
  ADD COLUMN IF NOT EXISTS "venue_id" "uuid",
  ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "confirmed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "confirmed_by" "uuid",
  ADD COLUMN IF NOT EXISTS "winner_team_id" "uuid",
  ADD COLUMN IF NOT EXISTS "decided_by" "text",
  ADD COLUMN IF NOT EXISTS "home_penalty_score" integer,
  ADD COLUMN IF NOT EXISTS "away_penalty_score" integer,
  ADD COLUMN IF NOT EXISTS "notes" "text";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_venue_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."matches"
      ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id")
      REFERENCES "public"."venues"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_confirmed_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."matches"
      ADD CONSTRAINT "matches_confirmed_by_fkey" FOREIGN KEY ("confirmed_by")
      REFERENCES "auth"."users"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_winner_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."matches"
      ADD CONSTRAINT "matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id")
      REFERENCES "public"."teams"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

ALTER TABLE "public"."referees"
  ADD COLUMN IF NOT EXISTS "document_number" "text",
  ADD COLUMN IF NOT EXISTS "default_role" "text" DEFAULT 'referee'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "default_fee" numeric(14,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "status" "text" DEFAULT 'active'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "availability" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  ADD COLUMN IF NOT EXISTS "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
  ADD COLUMN IF NOT EXISTS "created_by" "uuid",
  ADD COLUMN IF NOT EXISTS "updated_by" "uuid";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referees_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."referees"
      ADD CONSTRAINT "referees_created_by_fkey" FOREIGN KEY ("created_by")
      REFERENCES "auth"."users"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referees_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."referees"
      ADD CONSTRAINT "referees_updated_by_fkey" FOREIGN KEY ("updated_by")
      REFERENCES "auth"."users"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;

ALTER TABLE "public"."team_responsibles"
  ADD COLUMN IF NOT EXISTS "photo_url" "text",
  ADD COLUMN IF NOT EXISTS "document_number" "text",
  ADD COLUMN IF NOT EXISTS "document_number_normalized" "text",
  ADD COLUMN IF NOT EXISTS "whatsapp" "text",
  ADD COLUMN IF NOT EXISTS "status" "text" DEFAULT 'active'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "internal_notes" "text",
  ADD COLUMN IF NOT EXISTS "updated_by" "uuid",
  ADD COLUMN IF NOT EXISTS "archived_by" "uuid";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_responsibles_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."team_responsibles"
      ADD CONSTRAINT "team_responsibles_updated_by_fkey" FOREIGN KEY ("updated_by")
      REFERENCES "auth"."users"("id");
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_responsibles_archived_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."team_responsibles"
      ADD CONSTRAINT "team_responsibles_archived_by_fkey" FOREIGN KEY ("archived_by")
      REFERENCES "auth"."users"("id");
  END IF;
END
$drift$;

ALTER TABLE "public"."team_staff"
  ADD COLUMN IF NOT EXISTS "championship_id" "uuid",
  ADD COLUMN IF NOT EXISTS "category_id" "uuid",
  ADD COLUMN IF NOT EXISTS "document_number" "text",
  ADD COLUMN IF NOT EXISTS "status" "text" DEFAULT 'active'::"text" NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_by" "uuid";

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_staff_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."team_staff"
      ADD CONSTRAINT "team_staff_championship_id_fkey" FOREIGN KEY ("championship_id")
      REFERENCES "public"."championships"("id") ON DELETE CASCADE;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_staff_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."team_staff"
      ADD CONSTRAINT "team_staff_category_id_fkey" FOREIGN KEY ("category_id")
      REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE;
  END IF;
END
$drift$;

DO $drift$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_staff_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    ALTER TABLE "public"."team_staff"
      ADD CONSTRAINT "team_staff_updated_by_fkey" FOREIGN KEY ("updated_by")
      REFERENCES "auth"."users"("id") ON DELETE SET NULL;
  END IF;
END
$drift$;
