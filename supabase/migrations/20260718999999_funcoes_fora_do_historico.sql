-- Funções que existem em produção mas não são criadas por nenhuma migration.
--
-- Contexto (FZ-0.1 / FZ-1 do PRD de fechamento): terceiro tipo de drift
-- encontrado, além das 14 tabelas e das 54 colunas fora do controle de versão.
-- Sem estas definições, os triggers e policies restaurados pela baseline não
-- podem ser criados em um banco vazio.
--
-- Aplicado antes da baseline: só dependem de tabelas do núcleo.
--
-- Funções: audit_row_changes, can_manage_org, ensure_championship_settings, recalculate_standings_after_match, rls_auto_enable.

CREATE OR REPLACE FUNCTION "public"."audit_row_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_organization_id uuid;
  v_entity_id uuid;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_organization_id := OLD.organization_id;
    v_entity_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_organization_id := NEW.organization_id;
    v_entity_id := NEW.id;
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
  ELSE
    v_organization_id := NEW.organization_id;
    v_entity_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = v_organization_id
  ) THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    context
  )
  VALUES (
    v_organization_id,
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    v_old_data,
    v_new_data,
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'trigger', TG_NAME
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."can_manage_org"("p_organization_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.organization_id = p_organization_id
      AND ur.user_id = auth.uid()
      AND ur.role::text IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION "public"."ensure_championship_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.championship_settings (
    organization_id,
    championship_id,
    created_by
  )
  VALUES (
    NEW.organization_id,
    NEW.id,
    NEW.created_by
  )
  ON CONFLICT (championship_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."recalculate_standings_after_match"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_standings(
      OLD.championship_id,
      OLD.stage_id,
      OLD.group_id,
      OLD.category_id
    );
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF (
      OLD.status IS DISTINCT FROM NEW.status
      OR OLD.home_score IS DISTINCT FROM NEW.home_score
      OR OLD.away_score IS DISTINCT FROM NEW.away_score
      OR OLD.home_team_id IS DISTINCT FROM NEW.home_team_id
      OR OLD.away_team_id IS DISTINCT FROM NEW.away_team_id
      OR OLD.stage_id IS DISTINCT FROM NEW.stage_id
      OR OLD.group_id IS DISTINCT FROM NEW.group_id
      OR OLD.category_id IS DISTINCT FROM NEW.category_id
    ) THEN
      IF (
        OLD.championship_id IS DISTINCT FROM NEW.championship_id
        OR OLD.stage_id IS DISTINCT FROM NEW.stage_id
        OR OLD.group_id IS DISTINCT FROM NEW.group_id
        OR OLD.category_id IS DISTINCT FROM NEW.category_id
      ) THEN
        PERFORM public.recalculate_standings(
          OLD.championship_id,
          OLD.stage_id,
          OLD.group_id,
          OLD.category_id
        );
      END IF;

      PERFORM public.recalculate_standings(
        NEW.championship_id,
        NEW.stage_id,
        NEW.group_id,
        NEW.category_id
      );
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status::text = 'finished' THEN
    PERFORM public.recalculate_standings(
      NEW.championship_id,
      NEW.stage_id,
      NEW.group_id,
      NEW.category_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;
