-- Public bucket for link card media (images, banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'link-card-assets',
  'link-card-assets',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
);

-- Anyone can read (public bucket)
CREATE POLICY "link_card_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'link-card-assets');

-- Authenticated users can upload to their own folder
CREATE POLICY "link_card_assets_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'link-card-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "link_card_assets_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'link-card-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "link_card_assets_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'link-card-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
