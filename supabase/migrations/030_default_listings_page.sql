-- Seed a default editable Listings page so /listings is driven by
-- website_pages instead of a hardcoded React route. Idempotent via slug.
--
-- Unlike the home-page seed (023) which predated the draft/published split
-- in 027, this migration populates draft_puck_data + published_puck_data
-- directly so the new ListingsGrid block is rendered on the public site
-- without requiring an extra "publish" round-trip in the CMS.

INSERT INTO public.website_pages (
  slug,
  title,
  meta_description,
  puck_data,
  draft_puck_data,
  published_puck_data,
  status,
  published_at
)
SELECT
  'listings',
  'Listings',
  'Browse available properties. Powered by IDX/RESO when configured.',
  v.doc,
  v.doc,
  v.doc,
  'published',
  now()
FROM (
  SELECT jsonb_build_object(
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'ListingsGrid',
        'props', jsonb_build_object(
          'id', 'ListingsGrid-listings-default',
          'heading', 'Property Listings',
          'description', 'Property search powered by IDX / RESO API. Configure your listing provider in Super Admin settings to enable live MLS data.',
          'count', 6,
          'columns', '3'
        )
      )
    ),
    'root', jsonb_build_object('props', jsonb_build_object('title', 'Listings'))
  ) AS doc
) v
ON CONFLICT (slug) DO NOTHING;
