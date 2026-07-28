-- Run after 20260727230000_phase5_internal_notifications.sql in staging.
BEGIN;

DO $$
DECLARE
  missing text[];
BEGIN
  IF to_regclass('public.notifications') IS NULL
     OR to_regclass('public.notification_preferences') IS NULL
     OR to_regclass('public.notification_delivery_settings') IS NULL THEN
    RAISE EXCEPTION 'Notification tables are missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('notification_type_is_valid(text)'),
    ('emit_internal_notification(uuid,uuid,uuid,text,text,text,text,text,text,text,jsonb)'),
    ('emit_internal_notification_to_org(uuid,uuid,text,text,text,text,text,text,text,jsonb,app_role[])'),
    ('get_my_notifications(integer)'),
    ('mark_my_notification_read(uuid)'),
    ('mark_all_my_notifications_read()'),
    ('get_my_notification_preferences(uuid)'),
    ('save_my_notification_preferences(uuid,jsonb)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing notification functions: %', missing;
  END IF;

  IF has_table_privilege('authenticated', 'public.notifications', 'INSERT')
     OR has_table_privilege('authenticated', 'public.notifications', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.notifications', 'DELETE')
     OR has_table_privilege('authenticated', 'public.notification_preferences', 'INSERT')
     OR has_table_privilege('authenticated', 'public.notification_preferences', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.notification_preferences', 'DELETE')
     OR has_table_privilege('authenticated', 'public.notification_delivery_settings', 'INSERT')
     OR has_table_privilege('authenticated', 'public.notification_delivery_settings', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.notification_delivery_settings', 'DELETE') THEN
    RAISE EXCEPTION 'Direct notification write privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.emit_internal_notification(uuid,uuid,uuid,text,text,text,text,text,text,text,jsonb)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'anon', 'public.get_my_notifications(integer)', 'EXECUTE'
     )
     OR has_function_privilege(
       'anon', 'public.save_my_notification_preferences(uuid,jsonb)', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Notification function privileges are broader than expected';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND indexname = 'notifications_recipient_event_channel_unique'
  ) THEN
    RAISE EXCEPTION 'Notification idempotency index is missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.notification_delivery_settings
    WHERE email_enabled AND smtp_validated_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Email delivery is enabled without SMTP validation';
  END IF;

  IF NOT public.notification_type_is_valid('organization_invitation')
     OR NOT public.notification_type_is_valid('registration_submitted')
     OR NOT public.notification_type_is_valid('registration_review_requested')
     OR NOT public.notification_type_is_valid('match_changed')
     OR NOT public.notification_type_is_valid('referee_assigned')
     OR NOT public.notification_type_is_valid('publication_published')
     OR public.notification_type_is_valid('unknown') THEN
    RAISE EXCEPTION 'Notification type allowlist is invalid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'match_changed_notification' AND NOT tgisinternal
  )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'referee_assignment_notification' AND NOT tgisinternal
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'news_published_notification' AND NOT tgisinternal
     )
     OR NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'organization_invitation_notification' AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION 'Required notification triggers are missing';
  END IF;
END
$$;

ROLLBACK;
