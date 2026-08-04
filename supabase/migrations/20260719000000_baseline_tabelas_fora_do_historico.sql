-- Baseline das tabelas criadas fora do histórico de migrations.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): estas 14 relações existiam no
-- banco de produção sem nenhum CREATE TABLE no repositório — foram criadas
-- diretamente no banco, fora do controle de versão. Sem este arquivo, a
-- sequência de migrations não roda em um banco vazio: a migration
-- 20260721170000_phase3_sports_operations.sql aborta com
-- 'relation "public.sanctions" does not exist'.
--
-- O conteúdo foi extraído de 'supabase db dump --linked' contra produção e
-- tornado idempotente, para poder ser aplicado tanto em um banco vazio quanto
-- sobre o estado existente sem efeito colateral.
--
-- Em produção, onde os objetos já existem, registrar como aplicada com:
--   supabase migration repair --status applied 20260719000000
--
-- Relações cobertas: athlete_registrations, lineups, media, payments, public_athlete_profiles, public_team_profiles, referee_assignments, registration_documents, registration_forms, registration_submissions, sanctions, substitutions, team_user_access, venues.



-- ---------------------------------------------------------------
-- Tabelas (12)
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid",
    "match_id" "uuid",
    "team_id" "uuid",
    "athlete_id" "uuid",
    "media_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "file_url" "text",
    "thumbnail_url" "text",
    "external_url" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "object_path" "text",
    "file_name" "text",
    "mime_type" "text",
    "size_bytes" bigint,
    "alt_text" "text",
    "archived_at" timestamp with time zone,
    CONSTRAINT "media_media_type_check" CHECK (("media_type" = ANY (ARRAY['image'::"text", 'video'::"text", 'gallery'::"text", 'document'::"text", 'stream'::"text", 'artwork'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."referee_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "assignment_role" "text" NOT NULL,
    "fee_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "confirmation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "confirmed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "responded_at" timestamp with time zone,
    "responded_by" "uuid",
    "response_note" "text",
    CONSTRAINT "referee_assignments_assignment_role_check" CHECK (("assignment_role" = ANY (ARRAY['referee'::"text", 'assistant'::"text", 'fourth_official'::"text", 'scorer'::"text", 'timekeeper'::"text", 'delegate'::"text"]))),
    CONSTRAINT "referee_assignments_confirmation_status_check" CHECK (("confirmation_status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'declined'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "referee_assignments_fee_amount_check" CHECK (("fee_amount" >= (0)::numeric)),
    CONSTRAINT "referee_assignments_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text", 'waived'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."sanctions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "stage_id" "uuid",
    "group_id" "uuid",
    "team_id" "uuid",
    "athlete_id" "uuid",
    "match_id" "uuid",
    "sanction_type" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "matches_suspended" integer DEFAULT 0 NOT NULL,
    "fine_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "points_deducted" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "served_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "team_staff_id" "uuid",
    "source_event_id" "uuid",
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid",
    "revocation_reason" "text",
    CONSTRAINT "sanctions_check" CHECK ((("team_id" IS NOT NULL) OR ("athlete_id" IS NOT NULL))),
    CONSTRAINT "sanctions_fine_amount_check" CHECK (("fine_amount" >= (0)::numeric)),
    CONSTRAINT "sanctions_matches_suspended_check" CHECK (("matches_suspended" >= 0)),
    CONSTRAINT "sanctions_points_deducted_check" CHECK (("points_deducted" >= 0)),
    CONSTRAINT "sanctions_sanction_type_check" CHECK (("sanction_type" = ANY (ARRAY['yellow_card_accumulation'::"text", 'red_card'::"text", 'suspension'::"text", 'fine'::"text", 'points_deduction'::"text", 'ban'::"text", 'warning'::"text"]))),
    CONSTRAINT "sanctions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'served'::"text", 'cancelled'::"text", 'appealed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."lineups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    "lineup_role" "text" NOT NULL,
    "jersey_number" integer,
    "position" "text",
    "is_captain" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "lineups_jersey_number_check" CHECK ((("jersey_number" IS NULL) OR (("jersey_number" >= 0) AND ("jersey_number" <= 999)))),
    CONSTRAINT "lineups_lineup_role_check" CHECK (("lineup_role" = ANY (ARRAY['starter'::"text", 'substitute'::"text"]))),
    CONSTRAINT "lineups_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'confirmed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."substitutions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "match_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "athlete_out_id" "uuid" NOT NULL,
    "athlete_in_id" "uuid" NOT NULL,
    "minute" integer,
    "period" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "substitutions_check" CHECK (("athlete_out_id" <> "athlete_in_id")),
    CONSTRAINT "substitutions_minute_check" CHECK ((("minute" IS NULL) OR ("minute" >= 0)))
);

CREATE TABLE IF NOT EXISTS "public"."athlete_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "team_id" "uuid" NOT NULL,
    "athlete_id" "uuid" NOT NULL,
    "jersey_number" integer,
    "position" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "eligibility_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "valid_from" "date",
    "valid_until" "date",
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "athlete_registrations_eligibility_status_check" CHECK (("eligibility_status" = ANY (ARRAY['pending'::"text", 'eligible'::"text", 'ineligible'::"text", 'suspended'::"text"]))),
    CONSTRAINT "athlete_registrations_jersey_number_check" CHECK ((("jersey_number" IS NULL) OR (("jersey_number" >= 0) AND ("jersey_number" <= 999)))),
    CONSTRAINT "athlete_registrations_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'suspended'::"text", 'cancelled'::"text", 'transferred'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid",
    "championship_team_id" "uuid",
    "registration_submission_id" "uuid",
    "external_reference" "text",
    "provider" "text",
    "amount" numeric(14,2) NOT NULL,
    "currency" character(3) DEFAULT 'BRL'::"bpchar" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text",
    "due_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
    "receipt_url" "text",
    "provider_payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "payments_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text", 'refunded'::"text", 'failed'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."registration_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "athlete_id" "uuid",
    "document_type" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text",
    "mime_type" "text",
    "size_bytes" bigint,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_documents_size_bytes_check" CHECK ((("size_bytes" IS NULL) OR ("size_bytes" >= 0))),
    CONSTRAINT "registration_documents_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."registration_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "requires_payment" boolean DEFAULT false NOT NULL,
    "fee_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "opens_at" timestamp with time zone,
    "closes_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "registration_forms_fee_amount_check" CHECK (("fee_amount" >= (0)::numeric))
);

CREATE TABLE IF NOT EXISTS "public"."registration_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "championship_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "form_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "submitted_by" "uuid",
    "responsible_name" "text" NOT NULL,
    "responsible_email" "text",
    "responsible_phone" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_submissions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'submitted'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'changes_requested'::"text", 'cancelled'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."team_user_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "team_id" "uuid" NOT NULL,
    "championship_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "access_role" "text" DEFAULT 'manager'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "team_user_access_access_role_check" CHECK (("access_role" = ANY (ARRAY['manager'::"text", 'editor'::"text", 'viewer'::"text"]))),
    CONSTRAINT "team_user_access_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'active'::"text", 'inactive'::"text", 'revoked'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "district" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "capacity" integer,
    "surface" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "venues_capacity_check" CHECK ((("capacity" IS NULL) OR ("capacity" >= 0)))
);



-- ---------------------------------------------------------------
-- Owner (12)
-- ---------------------------------------------------------------

ALTER TABLE "public"."media" OWNER TO "postgres";

ALTER TABLE "public"."referee_assignments" OWNER TO "postgres";

ALTER TABLE "public"."sanctions" OWNER TO "postgres";

ALTER TABLE "public"."lineups" OWNER TO "postgres";

ALTER TABLE "public"."substitutions" OWNER TO "postgres";

ALTER TABLE "public"."athlete_registrations" OWNER TO "postgres";

ALTER TABLE "public"."payments" OWNER TO "postgres";

ALTER TABLE "public"."registration_documents" OWNER TO "postgres";

ALTER TABLE "public"."registration_forms" OWNER TO "postgres";

ALTER TABLE "public"."registration_submissions" OWNER TO "postgres";

ALTER TABLE "public"."team_user_access" OWNER TO "postgres";

ALTER TABLE "public"."venues" OWNER TO "postgres";



-- ---------------------------------------------------------------
-- Chaves primárias e únicas (14)
-- ---------------------------------------------------------------

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_match_id_team_id_athlete_id_key'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_match_id_team_id_athlete_id_key" UNIQUE ("match_id", "team_id", "athlete_id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_match_id_referee_id_assignment_role_key'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_match_id_referee_id_assignment_role_key" UNIQUE ("match_id", "referee_id", "assignment_role")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_documents_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venues_pkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id")$sql$;
  END IF;
END
$baseline$;



-- ---------------------------------------------------------------
-- Chaves estrangeiras (78)
-- ---------------------------------------------------------------

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_approved_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'athlete_registrations_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."athlete_registrations"
    ADD CONSTRAINT "athlete_registrations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_match_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lineups_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."lineups"
    ADD CONSTRAINT "lineups_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_match_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_championship_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_championship_team_id_fkey" FOREIGN KEY ("championship_team_id") REFERENCES "public"."championship_teams"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_registration_submission_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_registration_submission_id_fkey" FOREIGN KEY ("registration_submission_id") REFERENCES "public"."registration_submissions"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_match_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_referee_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "public"."referees"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_responded_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_responded_by_fkey" FOREIGN KEY ("responded_by") REFERENCES "auth"."users"("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referee_assignments_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."referee_assignments"
    ADD CONSTRAINT "referee_assignments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_documents_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_documents_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_documents_reviewed_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_documents_submission_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_documents"
    ADD CONSTRAINT "registration_documents_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."registration_submissions"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_forms_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_forms"
    ADD CONSTRAINT "registration_forms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_form_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."registration_forms"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_reviewed_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_submitted_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'registration_submissions_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."registration_submissions"
    ADD CONSTRAINT "registration_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_athlete_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_category_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."championship_categories"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_group_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."competition_groups"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_match_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_revoked_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_source_event_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_source_event_id_fkey" FOREIGN KEY ("source_event_id") REFERENCES "public"."match_events"("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_stage_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_team_staff_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_team_staff_id_fkey" FOREIGN KEY ("team_staff_id") REFERENCES "public"."team_staff"("id")$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sanctions_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."sanctions"
    ADD CONSTRAINT "sanctions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_athlete_in_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_athlete_in_id_fkey" FOREIGN KEY ("athlete_in_id") REFERENCES "public"."athletes"("id") ON DELETE RESTRICT$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_athlete_out_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_athlete_out_id_fkey" FOREIGN KEY ("athlete_out_id") REFERENCES "public"."athletes"("id") ON DELETE RESTRICT$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_match_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'substitutions_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."substitutions"
    ADD CONSTRAINT "substitutions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_championship_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_championship_id_fkey" FOREIGN KEY ("championship_id") REFERENCES "public"."championships"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_team_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_user_access_user_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."team_user_access"
    ADD CONSTRAINT "team_user_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venues_created_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venues_organization_id_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE$sql$;
  END IF;
END
$baseline$;

DO $baseline$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venues_updated_by_fkey'
      AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL$sql$;
  END IF;
END
$baseline$;



-- ---------------------------------------------------------------
-- Índices (22)
-- ---------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "idx_athlete_registrations_athlete" ON "public"."athlete_registrations" USING "btree" ("athlete_id");

CREATE INDEX IF NOT EXISTS "idx_athlete_registrations_team_status" ON "public"."athlete_registrations" USING "btree" ("championship_id", "team_id", "status");

CREATE INDEX IF NOT EXISTS "idx_lineups_match_team" ON "public"."lineups" USING "btree" ("match_id", "team_id");

CREATE INDEX IF NOT EXISTS "idx_media_publication" ON "public"."media" USING "btree" ("championship_id", "is_public", "published_at");

CREATE INDEX IF NOT EXISTS "idx_payments_status_due" ON "public"."payments" USING "btree" ("organization_id", "status", "due_at");

CREATE INDEX IF NOT EXISTS "idx_referee_assignments_match" ON "public"."referee_assignments" USING "btree" ("match_id");

CREATE INDEX IF NOT EXISTS "idx_registration_submissions_status" ON "public"."registration_submissions" USING "btree" ("championship_id", "status", "submitted_at");

CREATE INDEX IF NOT EXISTS "idx_sanctions_championship_athlete" ON "public"."sanctions" USING "btree" ("championship_id", "athlete_id", "status");

CREATE INDEX IF NOT EXISTS "idx_sanctions_championship_team" ON "public"."sanctions" USING "btree" ("championship_id", "team_id", "status");

CREATE INDEX IF NOT EXISTS "idx_team_user_access_user" ON "public"."team_user_access" USING "btree" ("user_id", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "lineups_match_athlete_unique" ON "public"."lineups" USING "btree" ("match_id", "athlete_id");

CREATE UNIQUE INDEX IF NOT EXISTS "lineups_match_team_captain_unique" ON "public"."lineups" USING "btree" ("match_id", "team_id") WHERE ("is_captain" AND ("status" = 'active'::"text"));

CREATE UNIQUE INDEX IF NOT EXISTS "media_object_path_unique" ON "public"."media" USING "btree" ("object_path") WHERE ("object_path" IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS "referee_assignment_match_role_unique" ON "public"."referee_assignments" USING "btree" ("match_id", "assignment_role");

CREATE INDEX IF NOT EXISTS "referee_assignment_referee_match_idx" ON "public"."referee_assignments" USING "btree" ("referee_id", "match_id");

CREATE INDEX IF NOT EXISTS "sanctions_active_athlete_idx" ON "public"."sanctions" USING "btree" ("championship_id", "athlete_id") WHERE ("status" = 'active'::"text");

CREATE UNIQUE INDEX IF NOT EXISTS "sanctions_source_event_unique" ON "public"."sanctions" USING "btree" ("source_event_id") WHERE ("source_event_id" IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS "substitutions_match_athlete_in_unique" ON "public"."substitutions" USING "btree" ("match_id", "athlete_in_id");

CREATE UNIQUE INDEX IF NOT EXISTS "substitutions_match_athlete_out_unique" ON "public"."substitutions" USING "btree" ("match_id", "athlete_out_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_athlete_competition_registration" ON "public"."athlete_registrations" USING "btree" ("championship_id", "athlete_id", COALESCE("category_id", '00000000-0000-0000-0000-000000000000'::"uuid"));

CREATE UNIQUE INDEX IF NOT EXISTS "uq_payments_provider_reference" ON "public"."payments" USING "btree" ("provider", "external_reference") WHERE (("provider" IS NOT NULL) AND ("external_reference" IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS "uq_team_user_access_scope" ON "public"."team_user_access" USING "btree" ("team_id", "user_id", COALESCE("championship_id", '00000000-0000-0000-0000-000000000000'::"uuid"));



-- ---------------------------------------------------------------
-- Row Level Security (12)
-- ---------------------------------------------------------------

ALTER TABLE "public"."athlete_registrations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."lineups" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."media" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."referee_assignments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."registration_documents" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."registration_forms" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."registration_submissions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."sanctions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."substitutions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."team_user_access" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;



-- ---------------------------------------------------------------
-- Grants (32)
-- ---------------------------------------------------------------

GRANT ALL ON TABLE "public"."media" TO "anon";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."media" TO "authenticated";

GRANT ALL ON TABLE "public"."media" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."referee_assignments" TO "authenticated";

GRANT ALL ON TABLE "public"."referee_assignments" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sanctions" TO "authenticated";

GRANT ALL ON TABLE "public"."sanctions" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."lineups" TO "authenticated";

GRANT ALL ON TABLE "public"."lineups" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."substitutions" TO "authenticated";

GRANT ALL ON TABLE "public"."substitutions" TO "service_role";

GRANT ALL ON TABLE "public"."athlete_registrations" TO "anon";

GRANT ALL ON TABLE "public"."athlete_registrations" TO "authenticated";

GRANT ALL ON TABLE "public"."athlete_registrations" TO "service_role";

GRANT ALL ON TABLE "public"."payments" TO "anon";

GRANT ALL ON TABLE "public"."payments" TO "authenticated";

GRANT ALL ON TABLE "public"."payments" TO "service_role";

GRANT ALL ON TABLE "public"."registration_documents" TO "anon";

GRANT ALL ON TABLE "public"."registration_documents" TO "authenticated";

GRANT ALL ON TABLE "public"."registration_documents" TO "service_role";

GRANT ALL ON TABLE "public"."registration_forms" TO "anon";

GRANT ALL ON TABLE "public"."registration_forms" TO "authenticated";

GRANT ALL ON TABLE "public"."registration_forms" TO "service_role";

GRANT ALL ON TABLE "public"."registration_submissions" TO "anon";

GRANT ALL ON TABLE "public"."registration_submissions" TO "authenticated";

GRANT ALL ON TABLE "public"."registration_submissions" TO "service_role";

GRANT ALL ON TABLE "public"."team_user_access" TO "anon";

GRANT ALL ON TABLE "public"."team_user_access" TO "authenticated";

GRANT ALL ON TABLE "public"."team_user_access" TO "service_role";

GRANT ALL ON TABLE "public"."venues" TO "anon";

GRANT ALL ON TABLE "public"."venues" TO "authenticated";

GRANT ALL ON TABLE "public"."venues" TO "service_role";

