-- Seed editable rows for the global site navigation and footer. Both are
-- idempotent: re-running this migration is a no-op if the keys already exist.

INSERT INTO public.website_settings (key, value)
VALUES (
  'site_nav',
  jsonb_build_object(
    'logoText', 'SRP Real Estate',
    'logoUrl', '',
    'links', E'Home|/\nAbout|/about\nListings|/listings\nContact|/contact',
    'ctaText', 'Agent Login',
    'ctaLink', '/login',
    'sticky', 'yes'
  )
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.website_settings (key, value)
VALUES (
  'site_footer',
  jsonb_build_object(
    'tagline', 'Expert real estate guidance for buyers and sellers.',
    'columns', jsonb_build_array(
      jsonb_build_object(
        'title', 'Explore',
        'links', E'Listings|/listings\nNeighborhoods|/neighborhoods\nBlog|/blog'
      ),
      jsonb_build_object(
        'title', 'Company',
        'links', E'About|/about\nContact|/contact\nAgent Login|/login'
      )
    ),
    'copyright', E'© {year} SRP Real Estate. All rights reserved.',
    'socialLinks', E'facebook|https://facebook.com\ninstagram|https://instagram.com',
    'backgroundColor', 'dark'
  )
)
ON CONFLICT (key) DO NOTHING;
