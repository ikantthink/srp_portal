-- Media Library: shared team-wide asset library with folders, tags, and a
-- public-read storage bucket. Used by the Media portal page and the website
-- builder's Media Picker.

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100 MB
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/webm'
  ]
);

CREATE POLICY "media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_authed_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "media_authed_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "media_authed_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Folders
--   is_system folders cannot be renamed or deleted from the UI. Files can
--   still be moved in and out of them freely.
-- ---------------------------------------------------------------------------
CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Files
--   storage_path is the object key inside the `media` bucket. We compute the
--   public URL on read rather than storing it, so renaming the bucket or
--   project URL doesn't leave stale links in the table.
-- ---------------------------------------------------------------------------
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES public.media_folders(id) ON DELETE RESTRICT,
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL,
  display_name text,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  width int,
  height int,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_files_folder ON public.media_files(folder_id);
CREATE INDEX idx_media_files_created ON public.media_files(created_at DESC);

CREATE TRIGGER media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
CREATE TABLE public.media_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6b7280',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.media_file_tags (
  file_id uuid NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES public.media_tags(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (file_id, tag_id)
);

CREATE INDEX idx_media_file_tags_tag ON public.media_file_tags(tag_id);

-- ---------------------------------------------------------------------------
-- RLS: team-shared. Any authenticated user can read and manage media.
-- ---------------------------------------------------------------------------
ALTER TABLE public.media_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_file_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_folders_select" ON public.media_folders
  FOR SELECT USING (true);
CREATE POLICY "media_folders_manage" ON public.media_folders
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "media_files_select" ON public.media_files
  FOR SELECT USING (true);
CREATE POLICY "media_files_manage" ON public.media_files
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "media_tags_select" ON public.media_tags
  FOR SELECT USING (true);
CREATE POLICY "media_tags_manage" ON public.media_tags
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "media_file_tags_select" ON public.media_file_tags
  FOR SELECT USING (true);
CREATE POLICY "media_file_tags_manage" ON public.media_file_tags
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Seed default system folders
-- ---------------------------------------------------------------------------
INSERT INTO public.media_folders (name, slug, is_system) VALUES
  ('General',  'general',  true),
  ('Listings', 'listings', true),
  ('Website',  'website',  true);
