-- Add published_version_id to forms (separate from current_version_id which is the draft)
ALTER TABLE public.forms
  ADD COLUMN published_version_id uuid REFERENCES public.form_versions(id);

-- Backfill: any form that was already published should have published_version_id = current_version_id
UPDATE public.forms
  SET published_version_id = current_version_id
  WHERE status = 'published' AND current_version_id IS NOT NULL;

-- Add a status column to form_versions so we can easily identify published versions
ALTER TABLE public.form_versions
  ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Backfill: versions that have published_at set are published
UPDATE public.form_versions
  SET status = 'published'
  WHERE published_at IS NOT NULL;
