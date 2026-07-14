
-- Enums
CREATE TYPE public.app_role AS ENUM ('owner','admin','editor','viewer');
CREATE TYPE public.championship_status AS ENUM ('draft','active','finished','archived');
CREATE TYPE public.match_status AS ENUM ('scheduled','live','finished','postponed','cancelled');
CREATE TYPE public.event_type AS ENUM ('goal','own_goal','yellow_card','red_card','substitution','assist','injury','note');

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- organization_members
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- helpers
CREATE OR REPLACE FUNCTION public.is_org_member(_org UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user UUID, _org UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user AND organization_id = _org AND role = _role);
$$;

CREATE POLICY "org read own" ON public.organizations FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "org insert self" ON public.organizations FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "org update owner" ON public.organizations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), id, 'owner') OR public.has_role(auth.uid(), id, 'admin'));

CREATE POLICY "members read own org" ON public.organization_members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "members owner manage" ON public.organization_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'owner'))
  WITH CHECK (public.has_role(auth.uid(), organization_id, 'owner'));

CREATE POLICY "roles read own org" ON public.user_roles FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

-- signup trigger: create profile, personal org, membership, owner role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_org UUID; dname TEXT;
BEGIN
  dname := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
    VALUES (NEW.id, dname, NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.organizations (name, created_by) VALUES (dname || ' Organização', NEW.id) RETURNING id INTO new_org;
  INSERT INTO public.organization_members (organization_id, user_id) VALUES (new_org, NEW.id);
  INSERT INTO public.user_roles (user_id, organization_id, role) VALUES (NEW.id, new_org, 'owner');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- championships
CREATE TABLE public.championships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  season TEXT,
  status championship_status NOT NULL DEFAULT 'draft',
  is_public BOOLEAN NOT NULL DEFAULT false,
  cover_url TEXT,
  description TEXT,
  starts_at DATE,
  ends_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.championships TO authenticated;
GRANT SELECT ON public.championships TO anon;
GRANT ALL ON public.championships TO service_role;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "champ member read" ON public.championships FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "champ public read" ON public.championships FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "champ member write" ON public.championships FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER championships_updated_at BEFORE UPDATE ON public.championships FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id UUID REFERENCES public.championships(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  city TEXT,
  crest_url TEXT,
  primary_color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams member read" ON public.teams FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "teams public read" ON public.teams FOR SELECT TO anon USING (
  championship_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.championships c WHERE c.id = teams.championship_id AND c.is_public)
);
CREATE POLICY "teams member write" ON public.teams FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- athletes
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  jersey_number INT,
  position TEXT,
  photo_url TEXT,
  birth_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athletes TO authenticated;
GRANT SELECT ON public.athletes TO anon;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes member read" ON public.athletes FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "athletes public read" ON public.athletes FOR SELECT TO anon USING (
  team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.teams t JOIN public.championships c ON c.id = t.championship_id
    WHERE t.id = athletes.team_id AND c.is_public
  )
);
CREATE POLICY "athletes member write" ON public.athletes FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER athletes_updated_at BEFORE UPDATE ON public.athletes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  phase TEXT,
  round TEXT,
  venue TEXT,
  scheduled_at TIMESTAMPTZ,
  home_score INT,
  away_score INT,
  status match_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT SELECT ON public.matches TO anon;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches member read" ON public.matches FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "matches public read" ON public.matches FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.championships c WHERE c.id = matches.championship_id AND c.is_public)
);
CREATE POLICY "matches member write" ON public.matches FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- match_events
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
  type event_type NOT NULL,
  minute INT,
  period TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT SELECT ON public.match_events TO anon;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events member read" ON public.match_events FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "events public read" ON public.match_events FOR SELECT TO anon USING (
  EXISTS (SELECT 1 FROM public.matches m JOIN public.championships c ON c.id = m.championship_id
          WHERE m.id = match_events.match_id AND c.is_public)
);
CREATE POLICY "events member write" ON public.match_events FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- sponsors
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  tier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT SELECT ON public.sponsors TO anon;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sponsors member read" ON public.sponsors FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "sponsors public read" ON public.sponsors FOR SELECT TO anon USING (
  championship_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.championships c WHERE c.id = sponsors.championship_id AND c.is_public)
);
CREATE POLICY "sponsors member write" ON public.sponsors FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER sponsors_updated_at BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- news
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  championship_id UUID REFERENCES public.championships(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  image_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT SELECT ON public.news TO anon;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news member read" ON public.news FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "news public read" ON public.news FOR SELECT TO anon USING (
  championship_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.championships c WHERE c.id = news.championship_id AND c.is_public)
  AND published_at IS NOT NULL AND published_at <= now()
);
CREATE POLICY "news member write" ON public.news FOR ALL TO authenticated
  USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
