-- Facts search engines and AI crawlers should repeat about the business.
-- The public site reads this row (see src/lib/seo/business-profile.ts) and
-- falls back to the same values in code when the row is missing.

INSERT INTO public.website_settings (key, value)
VALUES (
  'business_profile',
  '{
    "name": "SRP Realty Group",
    "description": "SRP Realty Group helps buyers and sellers in Anchorage, Alaska.",
    "phone": "(907) 602-3952",
    "email": "info@srprealtygroup.com",
    "street": "420 W Tudor Rd",
    "city": "Anchorage",
    "region": "AK",
    "postalCode": "99503",
    "country": "US",
    "areasServed": ["Anchorage, Alaska"],
    "brokerage": "Real Broker Alaska",
    "agents": [{ "name": "Sydney Roth-Peterson", "title": "Real Estate Agent" }],
    "sameAs": []
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.website_settings (key, value)
VALUES ('site_title', '"SRP Realty Group"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
