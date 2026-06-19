-- Seed a default editable Home page so the public root URL is driven by
-- website_pages instead of a hardcoded fallback. Idempotent via slug.

INSERT INTO public.website_pages (slug, title, meta_description, puck_data, status, published_at)
VALUES (
  'home',
  'Home',
  'SRP Real Estate - Find your dream home with expert guidance for buyers and sellers.',
  jsonb_build_object(
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'Hero',
        'props', jsonb_build_object(
          'id', 'Hero-home-default',
          'heading', 'Find Your Dream Home',
          'subheading', 'Expert guidance for buyers and sellers. Let our team navigate the market for you.',
          'ctaText', 'Get Started',
          'ctaLink', '/contact',
          'backgroundImage', '',
          'overlay', false
        )
      ),
      jsonb_build_object(
        'type', 'Stats',
        'props', jsonb_build_object(
          'id', 'Stats-home-default',
          'items', E'500+|Homes Sold\n98%|Client Satisfaction\n15+|Years Experience\n$200M+|In Sales'
        )
      ),
      jsonb_build_object(
        'type', 'CallToAction',
        'props', jsonb_build_object(
          'id', 'CallToAction-home-default',
          'heading', 'Ready to Get Started?',
          'description', 'Whether you''re buying or selling, our team is here to help.',
          'buttonText', 'Contact Us Today',
          'buttonLink', '/contact',
          'variant', 'primary'
        )
      )
    ),
    'root', jsonb_build_object('props', jsonb_build_object('title', 'Home'))
  ),
  'published',
  now()
)
ON CONFLICT (slug) DO NOTHING;
