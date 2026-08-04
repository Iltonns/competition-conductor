-- Constraints, índices e policies que existem em produção mas não são
-- criados pela cadeia de migrations.
--
-- Origem: triagem do diff residual (tarefa FZ-1). Depois de versionar as 14
-- tabelas, 54 colunas e 11 funções, sobrou este resíduo. A triagem separou:
--   - 127 funções reescritas pelo migra -> RUÍDO, corpo idêntico ao do repo;
--   - 32 constraints com drop+add do mesmo nome -> RUÍDO de reordenação;
--   - o que está neste arquivo -> DIFERENÇA REAL.
--
-- Os 3 DROP no início não removem regra: produção usa nomes diferentes para a
-- mesma restrição (ex.: championship_categories_name_unique passou a
-- championship_categories_championship_id_name_key). O repo passa a usar o
-- nome que produção usa.
--
-- Idempotente: pode rodar em banco vazio ou sobre o estado existente.


-- ---------------------------------------------------------------
-- Renomeações: remove os nomes antigos (5)
-- ---------------------------------------------------------------

ALTER TABLE "public"."championship_categories" DROP CONSTRAINT IF EXISTS "championship_categories_maximum_age_check";

ALTER TABLE "public"."championship_categories" DROP CONSTRAINT IF EXISTS "championship_categories_name_unique";

ALTER TABLE "public"."championship_settings" DROP CONSTRAINT IF EXISTS "championship_settings_championship_unique";

DROP INDEX IF EXISTS "public"."championship_categories_name_unique";

DROP INDEX IF EXISTS "public"."championship_settings_championship_unique";

-- ---------------------------------------------------------------
-- Índices (22)
-- ---------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS championship_categories_championship_id_name_key ON public.championship_categories USING btree (championship_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS championship_settings_championship_id_key ON public.championship_settings USING btree (championship_id);

CREATE UNIQUE INDEX IF NOT EXISTS competition_groups_stage_id_name_key ON public.competition_groups USING btree (stage_id, name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs USING btree (organization_id, entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_championship ON public.championship_categories USING btree (championship_id, status);

CREATE INDEX IF NOT EXISTS idx_championship_teams_championship_status ON public.championship_teams USING btree (championship_id, status);

CREATE INDEX IF NOT EXISTS idx_championship_teams_group ON public.championship_teams USING btree (group_id);

CREATE INDEX IF NOT EXISTS idx_championships_org ON public.championships USING btree (organization_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_period ON public.financial_transactions USING btree (organization_id, championship_id, occurred_on);

CREATE INDEX IF NOT EXISTS idx_groups_stage ON public.competition_groups USING btree (stage_id, sequence);

CREATE INDEX IF NOT EXISTS idx_match_events_match_minute ON public.match_events USING btree (match_id, minute, created_at);

CREATE INDEX IF NOT EXISTS idx_matches_schedule ON public.matches USING btree (championship_id, scheduled_at, status);

CREATE INDEX IF NOT EXISTS idx_matches_stage_round ON public.matches USING btree (stage_id, group_id, round_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications USING btree (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rounds_stage_group ON public.competition_rounds USING btree (stage_id, group_id, round_number);

CREATE INDEX IF NOT EXISTS idx_stages_championship_sequence ON public.competition_stages USING btree (championship_id, category_id, sequence);

CREATE INDEX IF NOT EXISTS idx_standings_scope_position ON public.standings USING btree (championship_id, category_id, stage_id, group_id, "position");

CREATE UNIQUE INDEX IF NOT EXISTS uq_championship_team_registration ON public.championship_teams USING btree (championship_id, team_id, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE UNIQUE INDEX IF NOT EXISTS uq_competition_round_scope ON public.competition_rounds USING btree (stage_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), round_number);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_members_org_user ON public.organization_members USING btree (organization_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_standings_scope_team ON public.standings USING btree (championship_id, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(stage_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid), team_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_user_org_role ON public.user_roles USING btree (user_id, organization_id, role);

-- ---------------------------------------------------------------
-- Constraints (31)
-- ---------------------------------------------------------------

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_categories_championship_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_categories" add constraint "championship_categories_championship_id_fkey" FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_categories_championship_id_name_key' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_categories" add constraint "championship_categories_championship_id_name_key" UNIQUE using index "championship_categories_championship_id_name_key"$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_categories_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_categories" add constraint "championship_categories_check" CHECK (((maximum_age IS NULL) OR ((maximum_age >= 0) AND ((minimum_age IS NULL) OR (maximum_age >= minimum_age)))))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_settings_championship_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_settings" add constraint "championship_settings_championship_id_fkey" FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_settings_championship_id_key' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_settings" add constraint "championship_settings_championship_id_key" UNIQUE using index "championship_settings_championship_id_key"$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_category_same_org_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_teams" add constraint "championship_teams_category_same_org_fkey" FOREIGN KEY (category_id, organization_id) REFERENCES public.championship_categories(id, organization_id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_fee_amount_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_teams" add constraint "championship_teams_fee_amount_check" CHECK ((fee_amount >= (0)::numeric))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'championship_teams_payment_status_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."championship_teams" add constraint "championship_teams_payment_status_check" CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text, 'refunded'::text, 'waived'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'competition_groups_sequence_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."competition_groups" add constraint "competition_groups_sequence_check" CHECK ((sequence > 0))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'competition_groups_stage_id_name_key' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."competition_groups" add constraint "competition_groups_stage_id_name_key" UNIQUE using index "competition_groups_stage_id_name_key"$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'competition_rounds_round_number_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."competition_rounds" add constraint "competition_rounds_round_number_check" CHECK ((round_number > 0))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'competition_rounds_status_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."competition_rounds" add constraint "competition_rounds_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'finished'::text, 'archived'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'competition_stages_championship_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."competition_stages" add constraint "competition_stages_championship_id_fkey" FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'financial_transactions_transaction_type_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."financial_transactions" add constraint "financial_transactions_transaction_type_check" CHECK ((transaction_type = ANY (ARRAY['income'::text, 'expense'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'match_events_minute_chk' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."match_events" add constraint "match_events_minute_chk" CHECK (((minute IS NULL) OR (minute >= 0))) NOT VALID$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_category_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.championship_categories(id) ON DELETE SET NULL$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_distinct_teams_chk' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_distinct_teams_chk" CHECK (((home_team_id IS NULL) OR (away_team_id IS NULL) OR (home_team_id <> away_team_id))) NOT VALID$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_group_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.competition_groups(id) ON DELETE SET NULL$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_nonnegative_score_chk' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_nonnegative_score_chk" CHECK ((((home_score IS NULL) OR (home_score >= 0)) AND ((away_score IS NULL) OR (away_score >= 0)) AND ((home_penalty_score IS NULL) OR (home_penalty_score >= 0)) AND ((away_penalty_score IS NULL) OR (away_penalty_score >= 0)))) NOT VALID$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_round_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_round_id_fkey" FOREIGN KEY (round_id) REFERENCES public.competition_rounds(id) ON DELETE SET NULL$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_stage_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."matches" add constraint "matches_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE SET NULL$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_channel_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."notifications" add constraint "notifications_channel_check" CHECK ((channel = ANY (ARRAY['in_app'::text, 'email'::text, 'whatsapp'::text, 'push'::text, 'webhook'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_status_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."notifications" add constraint "notifications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'read'::text, 'cancelled'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referees_default_fee_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."referees" add constraint "referees_default_fee_check" CHECK ((default_fee >= (0)::numeric))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referees_default_role_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."referees" add constraint "referees_default_role_check" CHECK ((default_role = ANY (ARRAY['referee'::text, 'assistant'::text, 'fourth_official'::text, 'scorer'::text, 'timekeeper'::text, 'delegate'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'referees_status_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."referees" add constraint "referees_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'standings_category_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."standings" add constraint "standings_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.championship_categories(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'standings_group_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."standings" add constraint "standings_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.competition_groups(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'standings_stage_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."standings" add constraint "standings_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.competition_stages(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_staff_role_check' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."team_staff" add constraint "team_staff_role_check" CHECK ((role = ANY (ARRAY['president'::text, 'manager'::text, 'coach'::text, 'assistant_coach'::text, 'goalkeeper_coach'::text, 'physio'::text, 'doctor'::text, 'staff'::text, 'other'::text])))$sql$;
  END IF;
END
$fix$;

DO $fix$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_staff_team_id_fkey' AND connamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $sql$alter table "public"."team_staff" add constraint "team_staff_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE$sql$;
  END IF;
END
$fix$;

-- ---------------------------------------------------------------
-- Policies RLS (11)
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS "audit_logs_member_select" ON "public"."audit_logs";
create policy "audit_logs_member_select"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "competition_groups_editor_write" ON "public"."competition_groups";
create policy "competition_groups_editor_write"
  on "public"."competition_groups"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "competition_groups_public_select" ON "public"."competition_groups";
create policy "competition_groups_public_select"
  on "public"."competition_groups"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = competition_groups.championship_id) AND (c.is_public = true)))));

DROP POLICY IF EXISTS "competition_rounds_editor_write" ON "public"."competition_rounds";
create policy "competition_rounds_editor_write"
  on "public"."competition_rounds"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "competition_rounds_public_select" ON "public"."competition_rounds";
create policy "competition_rounds_public_select"
  on "public"."competition_rounds"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = competition_rounds.championship_id) AND (c.is_public = true)))));

DROP POLICY IF EXISTS "financial_transactions_editor_write" ON "public"."financial_transactions";
create policy "financial_transactions_editor_write"
  on "public"."financial_transactions"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "financial_transactions_member_select" ON "public"."financial_transactions";
create policy "financial_transactions_member_select"
  on "public"."financial_transactions"
  as permissive
  for select
  to authenticated
using (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "referees_editor_write" ON "public"."referees";
create policy "referees_editor_write"
  on "public"."referees"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "standings_editor_write" ON "public"."standings";
create policy "standings_editor_write"
  on "public"."standings"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "standings_public_select" ON "public"."standings";
create policy "standings_public_select"
  on "public"."standings"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.championships c
  WHERE ((c.id = standings.championship_id) AND (c.is_public = true)))));

DROP POLICY IF EXISTS "team_staff_editor_write" ON "public"."team_staff";
create policy "team_staff_editor_write"
  on "public"."team_staff"
  as permissive
  for all
  to authenticated
using (public.can_edit_org(organization_id))
with check (public.can_edit_org(organization_id));
