CREATE TABLE public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text,
  puck_data jsonb NOT NULL DEFAULT '{"content": [], "root": {"props": {}}}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER website_pages_updated_at
  BEFORE UPDATE ON public.website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.idx_listings_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL CHECK (source IN ('idx_broker', 'reso')),
  fetched_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_listings_cache_listing_id ON public.idx_listings_cache(listing_id);
CREATE INDEX idx_listings_cache_expires ON public.idx_listings_cache(expires_at);
