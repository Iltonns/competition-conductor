-- Phase 6 / F6-RF03: public organization profile and published championships.

CREATE TABLE IF NOT EXISTS public.organization_public_pages (
  organization_id uuid PRIMARY KEY
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  headline text,
  description text,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  show_contact_email boolean NOT NULL DEFAULT false,
  show_contact_phone boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT organization_public_pages_slug_check
    CHECK (
      slug = lower(slug)
      AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      AND length(slug) BETWEEN 3 AND 80
    ),
  CONSTRAINT organization_public_pages_headline_check
    CHECK (headline IS NULL OR length(headline) BETWEEN 3 AND 160),
  CONSTRAINT organization_public_pages_description_check
    CHECK (description IS NULL OR length(description) <= 2000),
  CONSTRAINT organization_public_pages_social_links_object_check
    CHECK (jsonb_typeof(social_links) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_public_pages_slug_unique
  ON public.organization_public_pages (slug);

DROP TRIGGER IF EXISTS organization_public_pages_updated_at
  ON public.organization_public_pages;
CREATE TRIGGER organization_public_pages_updated_at
  BEFORE UPDATE ON public.organization_public_pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.organization_public_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_public_pages_manager_select
  ON public.organization_public_pages;
CREATE POLICY organization_public_pages_manager_select
  ON public.organization_public_pages
  FOR SELECT TO authenticated
  USING (public.can_manage_organization(organization_id));

REVOKE ALL ON public.organization_public_pages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.organization_public_pages TO authenticated;
GRANT ALL ON public.organization_public_pages TO service_role;

CREATE OR REPLACE FUNCTION public.organization_public_slug(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT lower(trim(both '-' FROM regexp_replace(
    regexp_replace(
      translate(
        COALESCE(p_value, ''),
        'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaaeeeeiiiiooooouuuucnAAAAAAEEEEIIIIOOOOOUUUUCN'
      ),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  )));
$$;

CREATE OR REPLACE FUNCTION public.organization_public_links_are_valid(p_links jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT jsonb_typeof(COALESCE(p_links, '{}'::jsonb)) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each_text(COALESCE(p_links, '{}'::jsonb)) entry
      WHERE entry.key NOT IN ('instagram', 'facebook', 'youtube', 'linkedin')
        OR entry.value !~* '^https://[^[:space:]]+$'
        OR length(entry.value) > 500
    );
$$;

CREATE OR REPLACE FUNCTION public.get_organization_public_page_settings(
  p_organization_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization_public_page:forbidden';
  END IF;

  SELECT jsonb_build_object(
    'organization_id', organization.id,
    'organization_name', organization.name,
    'organization_logo_url', organization.logo_url,
    'slug', COALESCE(page.slug, public.organization_public_slug(
      COALESCE(organization.slug, organization.name)
    )),
    'headline', page.headline,
    'description', page.description,
    'social_links', COALESCE(page.social_links, '{}'::jsonb),
    'show_contact_email', COALESCE(page.show_contact_email, false),
    'show_contact_phone', COALESCE(page.show_contact_phone, false),
    'is_public', COALESCE(page.is_public, false),
    'published_at', page.published_at
  )
  INTO result
  FROM public.organizations organization
  LEFT JOIN public.organization_public_pages page
    ON page.organization_id = organization.id
  WHERE organization.id = p_organization_id;

  IF result IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization_public_page:not_found';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_organization_public_page(
  p_organization_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  clean_slug text := public.organization_public_slug(p_payload->>'slug');
  clean_headline text := NULLIF(btrim(p_payload->>'headline'), '');
  clean_description text := NULLIF(btrim(p_payload->>'description'), '');
  clean_links jsonb := COALESCE(p_payload->'social_links', '{}'::jsonb);
  old_row public.organization_public_pages%ROWTYPE;
  saved_row public.organization_public_pages%ROWTYPE;
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization_public_page:forbidden';
  END IF;
  IF length(clean_slug) NOT BETWEEN 3 AND 80
     OR clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization_public_page:invalid_slug';
  END IF;
  IF clean_headline IS NOT NULL AND length(clean_headline) NOT BETWEEN 3 AND 160 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization_public_page:invalid_headline';
  END IF;
  IF clean_description IS NOT NULL AND length(clean_description) > 2000 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization_public_page:invalid_description';
  END IF;
  IF NOT public.organization_public_links_are_valid(clean_links) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'organization_public_page:invalid_links';
  END IF;

  SELECT * INTO old_row
  FROM public.organization_public_pages
  WHERE organization_id = p_organization_id
  FOR UPDATE;

  INSERT INTO public.organization_public_pages (
    organization_id, slug, headline, description, social_links,
    show_contact_email, show_contact_phone, created_by, updated_by
  ) VALUES (
    p_organization_id, clean_slug, clean_headline, clean_description, clean_links,
    COALESCE((p_payload->>'show_contact_email')::boolean, false),
    COALESCE((p_payload->>'show_contact_phone')::boolean, false),
    auth.uid(), auth.uid()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    slug = EXCLUDED.slug,
    headline = EXCLUDED.headline,
    description = EXCLUDED.description,
    social_links = EXCLUDED.social_links,
    show_contact_email = EXCLUDED.show_contact_email,
    show_contact_phone = EXCLUDED.show_contact_phone,
    updated_by = auth.uid()
  RETURNING * INTO saved_row;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action,
    old_data, new_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization_public_page',
    p_organization_id, 'saved', to_jsonb(old_row), to_jsonb(saved_row),
    jsonb_build_object('source', 'organization_public_page')
  );

  RETURN public.get_organization_public_page_settings(p_organization_id);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'organization_public_page:duplicate_slug';
END;
$$;

CREATE OR REPLACE FUNCTION public.set_organization_public_page_status(
  p_organization_id uuid,
  p_publish boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  old_row public.organization_public_pages%ROWTYPE;
  updated_row public.organization_public_pages%ROWTYPE;
BEGIN
  IF NOT public.can_manage_organization(p_organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'organization_public_page:forbidden';
  END IF;

  SELECT * INTO old_row
  FROM public.organization_public_pages
  WHERE organization_id = p_organization_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'organization_public_page:not_configured';
  END IF;

  IF p_publish AND (
    old_row.description IS NULL
    OR length(old_row.description) < 20
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'organization_public_page:publication_requirements';
  END IF;

  UPDATE public.organization_public_pages
  SET is_public = p_publish,
      published_at = CASE
        WHEN p_publish THEN COALESCE(published_at, now())
        ELSE NULL
      END,
      updated_by = auth.uid()
  WHERE organization_id = p_organization_id
  RETURNING * INTO updated_row;

  INSERT INTO public.audit_logs (
    organization_id, user_id, entity_type, entity_id, action,
    old_data, new_data, context
  ) VALUES (
    p_organization_id, auth.uid(), 'organization_public_page',
    p_organization_id, CASE WHEN p_publish THEN 'published' ELSE 'unpublished' END,
    to_jsonb(old_row), to_jsonb(updated_row),
    jsonb_build_object('source', 'organization_public_page')
  );

  RETURN public.get_organization_public_page_settings(p_organization_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_organization_portal(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT jsonb_build_object(
    'organization', jsonb_build_object(
      'name', organization.name,
      'slug', page.slug,
      'logo_url', organization.logo_url,
      'headline', page.headline,
      'description', page.description,
      'city', organization.city,
      'state', organization.state,
      'website_url', organization.website_url,
      'contact_email', CASE
        WHEN page.show_contact_email THEN organization.contact_email
        ELSE NULL
      END,
      'contact_phone', CASE
        WHEN page.show_contact_phone THEN organization.contact_phone
        ELSE NULL
      END,
      'social_links', page.social_links
    ),
    'championships', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', championship.id,
        'name', championship.name,
        'slug', championship.slug,
        'season', championship.season,
        'description', championship.description,
        'starts_at', championship.starts_at,
        'ends_at', championship.ends_at,
        'city', championship.city,
        'state', championship.state,
        'logo_url', championship.logo_url,
        'cover_url', championship.cover_url
      ) ORDER BY championship.starts_at DESC NULLS LAST, championship.name)
      FROM public.championships championship
      WHERE championship.organization_id = organization.id
        AND championship.is_public
        AND championship.status = 'published'
        AND championship.slug IS NOT NULL
    ), '[]'::jsonb)
  )
  FROM public.organization_public_pages page
  JOIN public.organizations organization
    ON organization.id = page.organization_id
  WHERE page.slug = public.organization_public_slug(p_slug)
    AND page.is_public;
$$;

REVOKE ALL ON FUNCTION public.organization_public_slug(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.organization_public_links_are_valid(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_organization_public_page_settings(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_organization_public_page(uuid,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_organization_public_page_status(uuid,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_public_organization_portal(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_organization_public_page_settings(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_organization_public_page(uuid,jsonb)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_organization_public_page_status(uuid,boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_organization_portal(text)
  TO anon, authenticated;

