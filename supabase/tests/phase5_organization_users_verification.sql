-- Run after 20260727213000_phase5_organization_users.sql in staging.
BEGIN;

DO $$
DECLARE
  missing text[];
BEGIN
  IF to_regclass('public.organization_invitations') IS NULL THEN
    RAISE EXCEPTION 'organization_invitations is missing';
  END IF;

  SELECT array_agg(required.name) INTO missing
  FROM (VALUES
    ('organization_effective_role(uuid,uuid)'),
    ('can_manage_organization(uuid)'),
    ('assert_organization_role_assignment(uuid,app_role)'),
    ('get_manageable_organizations()'),
    ('get_organization_admin_context(uuid)'),
    ('save_organization_profile(uuid,jsonb)'),
    ('create_organization_invitation(uuid,text,app_role)'),
    ('prepare_organization_invitation_resend(uuid)'),
    ('mark_organization_invitation_sent(uuid)'),
    ('revoke_organization_invitation(uuid,text)'),
    ('change_organization_member_role(uuid,uuid,app_role,text)'),
    ('remove_organization_member(uuid,uuid,text)')
  ) required(name)
  WHERE to_regprocedure('public.' || required.name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Missing organization administration functions: %', missing;
  END IF;

  IF has_table_privilege('authenticated', 'public.organizations', 'INSERT')
     OR has_table_privilege('authenticated', 'public.organizations', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.organizations', 'DELETE')
     OR has_table_privilege('authenticated', 'public.organization_members', 'INSERT')
     OR has_table_privilege('authenticated', 'public.organization_members', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.organization_members', 'DELETE')
     OR has_table_privilege('authenticated', 'public.user_roles', 'INSERT')
     OR has_table_privilege('authenticated', 'public.user_roles', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.user_roles', 'DELETE')
     OR has_table_privilege('authenticated', 'public.organization_invitations', 'INSERT')
     OR has_table_privilege('authenticated', 'public.organization_invitations', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.organization_invitations', 'DELETE') THEN
    RAISE EXCEPTION 'Direct organization administration privileges are broader than expected';
  END IF;

  IF has_function_privilege(
       'anon', 'public.get_organization_admin_context(uuid)', 'EXECUTE'
     )
     OR has_function_privilege(
       'anon', 'public.create_organization_invitation(uuid,text,app_role)', 'EXECUTE'
     )
     OR has_function_privilege(
       'anon', 'public.change_organization_member_role(uuid,uuid,app_role,text)', 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Anonymous organization administration access is broader than expected';
  END IF;

  IF has_function_privilege(
       'authenticated',
       'public.assert_organization_role_assignment(uuid,app_role)',
       'EXECUTE'
     )
     OR has_function_privilege(
       'authenticated',
       'public.organization_effective_role(uuid,uuid)',
       'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'Internal authorization helper is exposed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'organization_invitations'
      AND indexname = 'organization_invitations_one_pending_email'
  ) THEN
    RAISE EXCEPTION 'Pending invitation uniqueness index is missing';
  END IF;

  IF public.audit_module_name('organization') <> 'governance'
     OR public.audit_module_name('organization_member') <> 'governance'
     OR public.audit_module_name('organization_invitation') <> 'governance' THEN
    RAISE EXCEPTION 'Organization audit module mapping is invalid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_auth_user_created'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Auth user provisioning trigger is missing';
  END IF;
END
$$;

ROLLBACK;
