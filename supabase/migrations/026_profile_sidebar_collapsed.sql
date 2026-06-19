-- Per-user sidebar collapse preference. NULL means "never set" so the portal
-- layout can backfill `false` on first load and treat the key as initialised
-- thereafter.
ALTER TABLE public.profiles
  ADD COLUMN sidebar_collapsed boolean;
