-- Add customisable sidebar color columns to brand_settings.
-- NULL means "derive from primary_color at runtime".
ALTER TABLE public.brand_settings
  ADD COLUMN sidebar_bg    text,
  ADD COLUMN sidebar_fg    text,
  ADD COLUMN sidebar_muted text;
