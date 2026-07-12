-- Super-admin-managed feature flags for optional integrations.
-- Each row is one toggleable subsystem. Runtime gating combines this flag with
-- env-var presence checks (see src/lib/integrations/status.ts).
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read so unauthenticated surfaces (login page, public website blocks)
-- can branch on the flag without elevating privileges.
CREATE POLICY "feature_flags_select" ON public.feature_flags FOR SELECT USING (true);

-- Only super_admin may flip a flag.
CREATE POLICY "feature_flags_manage" ON public.feature_flags FOR ALL
  USING (public.get_user_role() = 'super_admin');

-- Seed defaults matching INTEGRATIONS in src/lib/integrations/registry.ts.
INSERT INTO public.feature_flags (key, enabled) VALUES
  ('google_login', true),
  ('resend_email', true),
  ('twilio_sms',   false),
  ('listings_api', false),
  ('ai',           true)
ON CONFLICT (key) DO NOTHING;

-- api_configurations was previously used as a credential entry form for env-backed
-- services. Those services now live entirely in env vars (see registry envVars).
-- Keep the table but constrain it to provider-config services that genuinely
-- belong in the database.
DELETE FROM public.api_configurations
  WHERE service NOT IN ('idx_broker', 'reso', 'google_reviews');

ALTER TABLE public.api_configurations
  DROP CONSTRAINT IF EXISTS api_configurations_service_check;

ALTER TABLE public.api_configurations
  ADD CONSTRAINT api_configurations_service_check
  CHECK (service IN ('idx_broker', 'reso', 'google_reviews'));
