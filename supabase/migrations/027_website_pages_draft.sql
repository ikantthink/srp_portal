-- Separate draft and published puck data so autosave no longer overwrites
-- whatever the public site is rendering. `puck_data` is left in place for one
-- release as a fallback and will be dropped in a later migration.

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS draft_puck_data jsonb;

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS published_puck_data jsonb;

-- Backfill: every existing row keeps its current contents as the draft, and
-- already-published rows also seed published_puck_data so the live site keeps
-- rendering the exact same thing after deploy.
UPDATE public.website_pages
SET draft_puck_data = COALESCE(draft_puck_data, puck_data);

UPDATE public.website_pages
SET published_puck_data = puck_data
WHERE status = 'published'
  AND published_puck_data IS NULL;
