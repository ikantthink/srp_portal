-- Singleton table for site-wide domain configuration.
-- Replaces the NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_SHORT_DOMAIN env vars
-- so super-admins can swap domains without redeploying.
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Host only, no protocol, no trailing slash. e.g. "example.com"
  primary_domain text,
  short_domain text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public read: middleware needs this to resolve domains for unauthenticated requests.
CREATE POLICY "site_settings_select" ON public.site_settings FOR SELECT USING (true);

-- Only super_admin can write.
CREATE POLICY "site_settings_manage" ON public.site_settings FOR ALL
  USING (public.get_user_role() = 'super_admin');

-- Seed a single empty row so updates always have a target.
INSERT INTO public.site_settings (id) VALUES (gen_random_uuid());
