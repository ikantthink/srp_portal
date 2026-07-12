-- google_reviews credentials are DB-backed (see registry.ts: envVars: [], configHref
-- to /portal/super-admin/google-reviews). Migration 021's constraint wrongly excluded
-- it, causing saves to fail the CHECK. Add it to the allowed services.
ALTER TABLE public.api_configurations
  DROP CONSTRAINT IF EXISTS api_configurations_service_check;

ALTER TABLE public.api_configurations
  ADD CONSTRAINT api_configurations_service_check
  CHECK (service IN ('idx_broker', 'reso', 'google_reviews'));
