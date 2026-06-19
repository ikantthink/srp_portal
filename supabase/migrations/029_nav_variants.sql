-- Add per-page nav variant override + seed the `site_nav_variants` settings
-- row from the existing `site_nav` row (or hardcoded defaults if absent).
-- Idempotent: re-runs are no-ops once the column + row exist.

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS nav_variant_id text;

INSERT INTO public.website_settings (key, value)
SELECT
  'site_nav_variants',
  jsonb_build_array(
    -- The canonical "default" variant. Existing `site_nav` content (if any)
    -- is merged on top of the hardcoded fallbacks; then `id`/`name` and the
    -- new `style`/`scroll` sub-objects are layered on, with the existing
    -- save overriding any matching keys at the top level only.
    jsonb_build_object(
      'logoText', 'SRP Real Estate',
      'logoUrl', '',
      'links', E'Home|/\nAbout|/about\nListings|/listings\nContact|/contact',
      'ctaText', 'Agent Login',
      'ctaLink', '/login',
      'sticky', 'yes'
    )
    || COALESCE(
         (SELECT value FROM public.website_settings WHERE key = 'site_nav'),
         '{}'::jsonb
       )
    || jsonb_build_object(
      'id', 'default',
      'name', 'Default',
      'style', jsonb_build_object(
        'height', 64,
        'maxWidth', 'default',
        'backgroundColor', '#ffffff',
        'textColor', '#0a0a0a',
        'linkColor', '#0a0a0a',
        'linkHoverColor', '#1e40af',
        'ctaBackgroundColor', '#f59e0b',
        'ctaTextColor', '#000000',
        'fontFamily', '',
        'fontSize', 14,
        'fontWeight', 'medium',
        'linkGap', 24
      ),
      'scroll', jsonb_build_object(
        'mode', 'always_solid',
        'threshold', 80,
        'transparentTextColor', '#ffffff',
        'transparentLogoColor', '#ffffff',
        'solidBackgroundColor', '#ffffff',
        'transitionMs', 200
      )
    )
  )
ON CONFLICT (key) DO NOTHING;
