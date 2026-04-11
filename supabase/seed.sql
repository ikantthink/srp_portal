-- Seed data for development

-- Default newsletter templates
INSERT INTO public.newsletter_templates (name, description, react_component_name, thumbnail_url) VALUES
  ('Simple', 'Clean, minimal newsletter layout', 'NewsletterBase', NULL),
  ('Featured Property', 'Newsletter highlighting a featured listing', 'NewsletterBase', NULL),
  ('Market Update', 'Monthly market statistics and trends', 'NewsletterBase', NULL);

-- Default email templates
INSERT INTO public.email_templates (name, type, subject, body_html, variables) VALUES
  ('Form Submission Alert', 'form_response', 'New form submission: {{form_name}}', '<p>New submission received for <strong>{{form_name}}</strong>.</p>', '["form_name", "submission_data"]'),
  ('New Lead Alert', 'lead_notification', 'New lead: {{lead_name}}', '<p>A new lead has been received: <strong>{{lead_name}}</strong> ({{lead_email}}).</p>', '["lead_name", "lead_email", "lead_type"]'),
  ('Transaction Update', 'transaction_update', 'Transaction update: {{property_address}}', '<p>The milestone <strong>{{milestone}}</strong> for {{property_address}} has been updated to <strong>{{status}}</strong>.</p>', '["property_address", "milestone", "status"]');

-- Default SMS templates
INSERT INTO public.sms_templates (name, type, body, variables) VALUES
  ('New Lead SMS', 'lead_notification', 'New lead: {{lead_name}} ({{lead_type}}). Check the portal for details.', '["lead_name", "lead_type"]'),
  ('Transaction Update SMS', 'transaction_update', '{{property_address}} - {{milestone}} is now {{status}}.', '["property_address", "milestone", "status"]');

-- Ensure brand_settings has a default row
INSERT INTO public.brand_settings (primary_color, secondary_color, accent_color, font_heading, font_body)
SELECT '#1e40af', '#7c3aed', '#f59e0b', 'Geist', 'Geist'
WHERE NOT EXISTS (SELECT 1 FROM public.brand_settings);

-- Default website settings
INSERT INTO public.website_settings (key, value) VALUES
  ('site_title', '"SRP Real Estate"'),
  ('social_links', '{"facebook": "", "instagram": "", "twitter": "", "linkedin": ""}'),
  ('idx_config', '{"provider": "none", "api_key": ""}')
ON CONFLICT (key) DO NOTHING;
