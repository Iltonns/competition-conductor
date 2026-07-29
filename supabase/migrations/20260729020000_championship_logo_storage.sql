-- Logo pública do campeonato com escrita isolada por organização/campeonato.

ALTER TABLE public.championships
  ADD COLUMN IF NOT EXISTS logo_object_path text;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES(
  'championship-branding',
  'championship-branding',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT(id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS championship_branding_admin_insert ON storage.objects;
DROP POLICY IF EXISTS championship_branding_admin_update ON storage.objects;
DROP POLICY IF EXISTS championship_branding_admin_delete ON storage.objects;

CREATE POLICY championship_branding_admin_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'championship-branding'
  AND EXISTS (
    SELECT 1
    FROM public.championships c
    WHERE c.organization_id::text = (storage.foldername(name))[1]
      AND c.id::text = (storage.foldername(name))[2]
      AND public.can_edit_org(c.organization_id)
  )
);

CREATE POLICY championship_branding_admin_update
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'championship-branding'
  AND EXISTS (
    SELECT 1
    FROM public.championships c
    WHERE c.organization_id::text = (storage.foldername(name))[1]
      AND c.id::text = (storage.foldername(name))[2]
      AND public.can_edit_org(c.organization_id)
  )
)
WITH CHECK (
  bucket_id = 'championship-branding'
  AND EXISTS (
    SELECT 1
    FROM public.championships c
    WHERE c.organization_id::text = (storage.foldername(name))[1]
      AND c.id::text = (storage.foldername(name))[2]
      AND public.can_edit_org(c.organization_id)
  )
);

CREATE POLICY championship_branding_admin_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'championship-branding'
  AND EXISTS (
    SELECT 1
    FROM public.championships c
    WHERE c.organization_id::text = (storage.foldername(name))[1]
      AND c.id::text = (storage.foldername(name))[2]
      AND public.can_edit_org(c.organization_id)
  )
);

CREATE OR REPLACE FUNCTION public.set_championship_logo(
  p_championship_id uuid,
  p_logo_url text,
  p_object_path text
) RETURNS public.championships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, storage
AS $$
DECLARE
  target public.championships%ROWTYPE;
  result public.championships%ROWTYPE;
  normalized_url text := nullif(btrim(p_logo_url), '');
  normalized_path text := nullif(btrim(p_object_path), '');
BEGIN
  SELECT * INTO target
  FROM public.championships
  WHERE id = p_championship_id
  FOR UPDATE;

  IF target.id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'championship_logo:not_found';
  END IF;
  IF NOT public.can_edit_org(target.organization_id) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'championship_logo:forbidden';
  END IF;
  IF (normalized_url IS NULL) <> (normalized_path IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_logo:invalid_payload';
  END IF;

  IF normalized_path IS NOT NULL THEN
    IF normalized_url !~* '^https://[^[:space:]]+$'
       OR normalized_path NOT LIKE
          target.organization_id::text || '/' || target.id::text || '/%'
       OR NOT EXISTS (
         SELECT 1
         FROM storage.objects o
         WHERE o.bucket_id = 'championship-branding'
           AND o.name = normalized_path
       ) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'championship_logo:invalid_media';
    END IF;
  END IF;

  UPDATE public.championships
  SET logo_url = normalized_url,
      logo_object_path = normalized_path,
      updated_at = now()
  WHERE id = target.id
  RETURNING * INTO result;

  INSERT INTO public.audit_logs(
    organization_id, user_id, entity_type, entity_id, action, old_data, new_data
  ) VALUES (
    target.organization_id, auth.uid(), 'championship', target.id,
    CASE WHEN normalized_url IS NULL THEN 'logo_removed' ELSE 'logo_updated' END,
    jsonb_build_object('logo_url', target.logo_url),
    jsonb_build_object('logo_url', result.logo_url)
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.set_championship_logo(uuid,text,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_championship_logo(uuid,text,text)
  TO authenticated;
