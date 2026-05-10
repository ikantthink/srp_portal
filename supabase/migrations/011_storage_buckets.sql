-- Public bucket for brand assets (logos, favicon)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
);

-- Anyone can read (public bucket)
CREATE POLICY "brand_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

-- Only super_admin can upload/update/delete
CREATE POLICY "brand_assets_super_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "brand_assets_super_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'brand-assets'
    AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "brand_assets_super_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brand-assets'
    AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'super_admin'
  );
