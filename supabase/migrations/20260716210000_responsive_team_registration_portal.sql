-- Rascunho canônico do portal público de cadastro de equipes.
-- A apresentação muda por viewport; dados, permissões e submissão permanecem únicos.
CREATE TABLE IF NOT EXISTS public.team_registration_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  championship_id uuid NOT NULL REFERENCES public.championships(id),
  championship_team_id uuid NOT NULL REFERENCES public.championship_teams(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_steps text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_registration_drafts_status_check
    CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved')),
  CONSTRAINT team_registration_drafts_scope_key UNIQUE (championship_team_id),
  CONSTRAINT team_registration_drafts_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS team_registration_drafts_team_idx
  ON public.team_registration_drafts(team_id, championship_id);

ALTER TABLE public.team_registration_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.team_registration_drafts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.team_registration_drafts TO service_role;

DROP TRIGGER IF EXISTS team_registration_drafts_updated_at ON public.team_registration_drafts;
CREATE TRIGGER team_registration_drafts_updated_at
  BEFORE UPDATE ON public.team_registration_drafts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-registration',
  'team-registration',
  false,
  10485760,
  ARRAY[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'image/heic', 'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON TABLE public.team_registration_drafts IS
  'Rascunho versionado do portal externo. Acesso exclusivo pelo servidor após validação da sessão de link.';
