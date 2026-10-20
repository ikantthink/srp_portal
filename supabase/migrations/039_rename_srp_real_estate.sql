-- Rename the old public name in rows saved before the source defaults changed.

UPDATE public.website_settings
SET value = replace(value::text, 'SRP Real Estate', 'SRP Realty Group')::jsonb
WHERE value::text LIKE '%SRP Real Estate%';

UPDATE public.website_pages
SET
  title = replace(title, 'SRP Real Estate', 'SRP Realty Group'),
  meta_description = replace(meta_description, 'SRP Real Estate', 'SRP Realty Group'),
  puck_data = replace(puck_data::text, 'SRP Real Estate', 'SRP Realty Group')::jsonb,
  draft_puck_data = CASE
    WHEN draft_puck_data IS NULL THEN NULL
    ELSE replace(draft_puck_data::text, 'SRP Real Estate', 'SRP Realty Group')::jsonb
  END,
  published_puck_data = CASE
    WHEN published_puck_data IS NULL THEN NULL
    ELSE replace(published_puck_data::text, 'SRP Real Estate', 'SRP Realty Group')::jsonb
  END
WHERE title LIKE '%SRP Real Estate%'
   OR coalesce(meta_description, '') LIKE '%SRP Real Estate%'
   OR puck_data::text LIKE '%SRP Real Estate%'
   OR coalesce(draft_puck_data::text, '') LIKE '%SRP Real Estate%'
   OR coalesce(published_puck_data::text, '') LIKE '%SRP Real Estate%';

UPDATE public.email_templates
SET
  name = replace(name, 'SRP Real Estate', 'SRP Realty Group'),
  subject = replace(subject, 'SRP Real Estate', 'SRP Realty Group'),
  body_html = replace(body_html, 'SRP Real Estate', 'SRP Realty Group'),
  body_react_component = CASE
    WHEN body_react_component IS NULL THEN NULL
    ELSE replace(body_react_component, 'SRP Real Estate', 'SRP Realty Group')
  END
WHERE name LIKE '%SRP Real Estate%'
   OR subject LIKE '%SRP Real Estate%'
   OR body_html LIKE '%SRP Real Estate%'
   OR coalesce(body_react_component, '') LIKE '%SRP Real Estate%';

UPDATE public.sms_templates
SET
  name = replace(name, 'SRP Real Estate', 'SRP Realty Group'),
  body = replace(body, 'SRP Real Estate', 'SRP Realty Group')
WHERE name LIKE '%SRP Real Estate%'
   OR coalesce(body, '') LIKE '%SRP Real Estate%';

UPDATE public.newsletters
SET
  subject = replace(subject, 'SRP Real Estate', 'SRP Realty Group'),
  body_json = replace(body_json::text, 'SRP Real Estate', 'SRP Realty Group')::jsonb
WHERE coalesce(subject, '') LIKE '%SRP Real Estate%'
   OR coalesce(body_json::text, '') LIKE '%SRP Real Estate%';
