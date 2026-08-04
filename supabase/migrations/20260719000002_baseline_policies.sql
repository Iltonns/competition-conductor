-- Policies RLS das tabelas criadas fora do histórico de migrations.
--
-- Separadas da baseline 20260719000000 para desfazer uma dependência circular:
-- a policy usa public.can_manage_team(), que lê public.team_user_access, que só
-- passa a existir na própria baseline. A ordem correta é
-- tabelas -> função -> policies.
--
-- Em produção, onde já existem, registrar como aplicada com:
--   supabase migration repair --status applied 20260719000002

DROP POLICY IF EXISTS "athlete_registrations_editor_write" ON "public"."athlete_registrations";
CREATE POLICY "athlete_registrations_editor_write" ON "public"."athlete_registrations" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "athlete_registrations_member_select" ON "public"."athlete_registrations";
CREATE POLICY "athlete_registrations_member_select" ON "public"."athlete_registrations" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "lineups_editor_write" ON "public"."lineups";
CREATE POLICY "lineups_editor_write" ON "public"."lineups" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "lineups_member_select" ON "public"."lineups";
CREATE POLICY "lineups_member_select" ON "public"."lineups" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "media_editor_write" ON "public"."media";
CREATE POLICY "media_editor_write" ON "public"."media" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "media_member_select" ON "public"."media";
CREATE POLICY "media_member_select" ON "public"."media" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "media_public_select" ON "public"."media";
CREATE POLICY "media_public_select" ON "public"."media" FOR SELECT TO "authenticated", "anon" USING ((("is_public" = true) AND ("published_at" IS NOT NULL) AND ("published_at" <= "now"()) AND (EXISTS ( SELECT 1
   FROM "public"."championships" "c"
  WHERE (("c"."id" = "media"."championship_id") AND ("c"."is_public" = true))))));

DROP POLICY IF EXISTS "payments_editor_write" ON "public"."payments";
CREATE POLICY "payments_editor_write" ON "public"."payments" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "payments_member_select" ON "public"."payments";
CREATE POLICY "payments_member_select" ON "public"."payments" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "referee_assignments_editor_write" ON "public"."referee_assignments";
CREATE POLICY "referee_assignments_editor_write" ON "public"."referee_assignments" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "referee_assignments_member_select" ON "public"."referee_assignments";
CREATE POLICY "referee_assignments_member_select" ON "public"."referee_assignments" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "registration_documents_editor_write" ON "public"."registration_documents";
CREATE POLICY "registration_documents_editor_write" ON "public"."registration_documents" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "registration_documents_member_select" ON "public"."registration_documents";
CREATE POLICY "registration_documents_member_select" ON "public"."registration_documents" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "registration_forms_editor_write" ON "public"."registration_forms";
CREATE POLICY "registration_forms_editor_write" ON "public"."registration_forms" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "registration_forms_member_select" ON "public"."registration_forms";
CREATE POLICY "registration_forms_member_select" ON "public"."registration_forms" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "registration_forms_public_select" ON "public"."registration_forms";
CREATE POLICY "registration_forms_public_select" ON "public"."registration_forms" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND (("opens_at" IS NULL) OR ("opens_at" <= "now"())) AND (("closes_at" IS NULL) OR ("closes_at" >= "now"()))));

DROP POLICY IF EXISTS "registration_submissions_editor_write" ON "public"."registration_submissions";
CREATE POLICY "registration_submissions_editor_write" ON "public"."registration_submissions" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "registration_submissions_member_select" ON "public"."registration_submissions";
CREATE POLICY "registration_submissions_member_select" ON "public"."registration_submissions" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "sanctions_editor_write" ON "public"."sanctions";
CREATE POLICY "sanctions_editor_write" ON "public"."sanctions" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "sanctions_member_select" ON "public"."sanctions";
CREATE POLICY "sanctions_member_select" ON "public"."sanctions" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "substitutions_editor_write" ON "public"."substitutions";
CREATE POLICY "substitutions_editor_write" ON "public"."substitutions" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "substitutions_member_select" ON "public"."substitutions";
CREATE POLICY "substitutions_member_select" ON "public"."substitutions" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "team_user_access_editor_write" ON "public"."team_user_access";
CREATE POLICY "team_user_access_editor_write" ON "public"."team_user_access" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "team_user_access_member_select" ON "public"."team_user_access";
CREATE POLICY "team_user_access_member_select" ON "public"."team_user_access" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));

DROP POLICY IF EXISTS "team_user_access_self_select" ON "public"."team_user_access";
CREATE POLICY "team_user_access_self_select" ON "public"."team_user_access" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_org_member"("organization_id")));

DROP POLICY IF EXISTS "venues_editor_write" ON "public"."venues";
CREATE POLICY "venues_editor_write" ON "public"."venues" TO "authenticated" USING ("public"."can_edit_org"("organization_id")) WITH CHECK ("public"."can_edit_org"("organization_id"));

DROP POLICY IF EXISTS "venues_member_select" ON "public"."venues";
CREATE POLICY "venues_member_select" ON "public"."venues" FOR SELECT TO "authenticated" USING ("public"."is_org_member"("organization_id"));
