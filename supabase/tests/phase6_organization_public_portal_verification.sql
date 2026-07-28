-- Run after 20260728030000_phase6_organization_public_portal.sql.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.organization_public_pages') IS NULL THEN
    RAISE EXCEPTION 'organization_public_pages table is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'organization_public_pages'
      AND indexname = 'organization_public_pages_slug_unique'
  ) THEN
    RAISE EXCEPTION 'organization public slug uniqueness is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'public'
      AND procedure.proname = 'get_public_organization_portal'
      AND procedure.prosecdef
  ) THEN
    RAISE EXCEPTION 'public organization portal RPC must be SECURITY DEFINER';
  END IF;

  IF has_table_privilege('anon', 'public.organization_public_pages', 'SELECT') THEN
    RAISE EXCEPTION 'anon must not read organization_public_pages directly';
  END IF;

  IF has_function_privilege(
    'anon',
    'public.get_organization_public_page_settings(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon must not read organization page settings';
  END IF;

  IF NOT has_function_privilege(
    'anon',
    'public.get_public_organization_portal(text)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'anon must execute the sanitized public portal RPC';
  END IF;
END;
$$;

DO $$
BEGIN
  IF public.organization_public_slug('  Arena São João  ') <> 'arena-sao-joao' THEN
    RAISE EXCEPTION 'slug normalization is not deterministic';
  END IF;

  IF NOT public.organization_public_links_are_valid(
    '{"instagram":"https://instagram.com/is.arena"}'::jsonb
  ) THEN
    RAISE EXCEPTION 'approved HTTPS social links must be accepted';
  END IF;

  IF public.organization_public_links_are_valid(
    '{"instagram":"javascript:alert(1)"}'::jsonb
  ) THEN
    RAISE EXCEPTION 'unsafe social links must be rejected';
  END IF;

  IF public.organization_public_links_are_valid(
    '{"custom":"https://example.com"}'::jsonb
  ) THEN
    RAISE EXCEPTION 'unknown social link keys must be rejected';
  END IF;

  IF public.get_public_organization_portal('does-not-exist') IS NOT NULL THEN
    RAISE EXCEPTION 'unknown or unpublished pages must fail closed';
  END IF;
END;
$$;

ROLLBACK;
