-- Views e triggers das tabelas criadas fora do histórico de migrations.
--
-- Separados da baseline 20260719000000 porque dependem de objetos introduzidos
-- por migrations posteriores:
--   - as views leem colunas criadas depois (ex.: championship_teams.category_id);
--   - os triggers chamam funções criadas depois (ex.: tg_notify_referee_assignment).
-- Aplicá-los no fim da cadeia mantém a sequência executável em um banco vazio.
--
-- Em produção, onde já existem, registrar como aplicada com:
--   supabase migration repair --status applied 20260729090000

-- ---------------------------------------------------------------
-- Views (10)
-- ---------------------------------------------------------------

CREATE OR REPLACE VIEW "public"."public_athlete_profiles" WITH ("security_barrier"='true') AS
 SELECT "ar"."championship_id",
    "ar"."category_id",
    "ar"."team_id",
    "a"."id" AS "athlete_id",
    "a"."full_name",
    "a"."photo_url",
    COALESCE("ar"."jersey_number", "a"."jersey_number") AS "jersey_number",
    COALESCE("ar"."position", "a"."position") AS "position",
    "ar"."status" AS "registration_status"
   FROM (("public"."athlete_registrations" "ar"
     JOIN "public"."athletes" "a" ON (("a"."id" = "ar"."athlete_id")))
     JOIN "public"."championships" "c" ON (("c"."id" = "ar"."championship_id")))
  WHERE (("c"."is_public" = true) AND ("ar"."status" = 'approved'::"text"));

ALTER VIEW "public"."public_athlete_profiles" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."public_team_profiles" WITH ("security_barrier"='true') AS
 SELECT "ct"."championship_id",
    "ct"."category_id",
    "ct"."group_id",
    "t"."id" AS "team_id",
    "t"."name",
    "t"."short_name",
    "t"."city",
    "t"."crest_url",
    "t"."primary_color"
   FROM (("public"."championship_teams" "ct"
     JOIN "public"."teams" "t" ON (("t"."id" = "ct"."team_id")))
     JOIN "public"."championships" "c" ON (("c"."id" = "ct"."championship_id")))
  WHERE (("c"."is_public" = true) AND ("ct"."status" = 'approved'::"text"));

ALTER VIEW "public"."public_team_profiles" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."public_athlete_profiles" TO "anon";

GRANT ALL ON TABLE "public"."public_athlete_profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."public_athlete_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."public_team_profiles" TO "anon";

GRANT ALL ON TABLE "public"."public_team_profiles" TO "authenticated";

GRANT ALL ON TABLE "public"."public_team_profiles" TO "service_role";

-- ---------------------------------------------------------------
-- Triggers (16)
-- ---------------------------------------------------------------

CREATE OR REPLACE TRIGGER "referee_assignment_notification" AFTER INSERT OR UPDATE OF "referee_id", "assignment_role", "confirmation_status" ON "public"."referee_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_notify_referee_assignment"();

CREATE OR REPLACE TRIGGER "registration_submission_notification" AFTER INSERT OR UPDATE OF "status" ON "public"."registration_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_notify_registration_submission"();

CREATE OR REPLACE TRIGGER "trg_athlete_registrations_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."athlete_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_changes"();

CREATE OR REPLACE TRIGGER "trg_athlete_registrations_updated_at" BEFORE UPDATE ON "public"."athlete_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_lineups_updated_at" BEFORE UPDATE ON "public"."lineups" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_media_updated_at" BEFORE UPDATE ON "public"."media" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_payments_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_changes"();

CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_referee_assignments_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."referee_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_changes"();

CREATE OR REPLACE TRIGGER "trg_referee_assignments_updated_at" BEFORE UPDATE ON "public"."referee_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_registration_forms_updated_at" BEFORE UPDATE ON "public"."registration_forms" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_registration_submissions_updated_at" BEFORE UPDATE ON "public"."registration_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_sanctions_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."sanctions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_changes"();

CREATE OR REPLACE TRIGGER "trg_sanctions_updated_at" BEFORE UPDATE ON "public"."sanctions" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_team_user_access_updated_at" BEFORE UPDATE ON "public"."team_user_access" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_venues_updated_at" BEFORE UPDATE ON "public"."venues" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();
