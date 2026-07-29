-- Fase 6 / seguranca: corrige verificacoes fail-open causadas por
-- NULL <> 'owner' nas RPCs de assinatura e cobranca.

CREATE OR REPLACE FUNCTION public.assert_organization_owner(
  p_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'subscription:authentication_required';
  END IF;

  IF public.organization_effective_role(
    p_organization_id,
    auth.uid()
  ) IS DISTINCT FROM 'owner'::public.app_role THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'subscription:owner_required';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_organization_owner(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_manage_organization(
  p_organization_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(
      public.organization_effective_role(p_organization_id, auth.uid())
        IN ('owner'::public.app_role, 'admin'::public.app_role),
      false
    );
$$;

ALTER FUNCTION public.get_organization_subscription_context(uuid)
  RENAME TO get_organization_subscription_context_owner_checked_source;
REVOKE ALL ON FUNCTION
  public.get_organization_subscription_context_owner_checked_source(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_organization_subscription_context(
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.assert_organization_owner(p_organization_id);
  RETURN public.get_organization_subscription_context_owner_checked_source(
    p_organization_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_organization_subscription_context(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_organization_subscription_context(uuid)
  TO authenticated;

ALTER FUNCTION public.prepare_subscription_checkout(uuid, uuid, uuid)
  RENAME TO prepare_subscription_checkout_owner_checked_source;
REVOKE ALL ON FUNCTION
  public.prepare_subscription_checkout_owner_checked_source(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.prepare_subscription_checkout(
  p_organization_id uuid,
  p_plan_version_id uuid,
  p_client_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.assert_organization_owner(p_organization_id);
  RETURN public.prepare_subscription_checkout_owner_checked_source(
    p_organization_id,
    p_plan_version_id,
    p_client_request_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_subscription_checkout(uuid, uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_subscription_checkout(uuid, uuid, uuid)
  TO authenticated;

ALTER FUNCTION public.preview_organization_plan_change(uuid, uuid)
  RENAME TO preview_organization_plan_change_owner_checked_source;
REVOKE ALL ON FUNCTION
  public.preview_organization_plan_change_owner_checked_source(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.preview_organization_plan_change(
  p_organization_id uuid,
  p_target_plan_version_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM public.assert_organization_owner(p_organization_id);
  RETURN public.preview_organization_plan_change_owner_checked_source(
    p_organization_id,
    p_target_plan_version_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.preview_organization_plan_change(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_organization_plan_change(uuid, uuid)
  TO authenticated;

ALTER FUNCTION public.change_organization_member_role(
  uuid, uuid, public.app_role, text
) RENAME TO change_organization_member_role_manager_checked_source;
REVOKE ALL ON FUNCTION
  public.change_organization_member_role_manager_checked_source(
    uuid, uuid, public.app_role, text
  ) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.change_organization_member_role(
  p_organization_id uuid,
  p_user_id uuid,
  p_new_role public.app_role,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'organization:forbidden';
  END IF;
  PERFORM public.change_organization_member_role_manager_checked_source(
    p_organization_id,
    p_user_id,
    p_new_role,
    p_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.change_organization_member_role(
  uuid, uuid, public.app_role, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_organization_member_role(
  uuid, uuid, public.app_role, text
) TO authenticated;

ALTER FUNCTION public.remove_organization_member(uuid, uuid, text)
  RENAME TO remove_organization_member_manager_checked_source;
REVOKE ALL ON FUNCTION
  public.remove_organization_member_manager_checked_source(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.remove_organization_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'organization:forbidden';
  END IF;
  PERFORM public.remove_organization_member_manager_checked_source(
    p_organization_id,
    p_user_id,
    p_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.remove_organization_member(uuid, uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_organization_member(uuid, uuid, text)
  TO authenticated;
