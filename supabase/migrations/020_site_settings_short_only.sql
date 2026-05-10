-- Drop primary_domain from site_settings.
-- Short URLs and link cards now share the `/c/<x>` route on every host,
-- so there's no need to store a canonical "primary" domain. The only
-- remaining setting is `short_domain`, used purely to render share URLs.
ALTER TABLE public.site_settings DROP COLUMN IF EXISTS primary_domain;
