-- Allow admins (in addition to super_admins) to manage brand_settings.
-- Branding now lives under regular Settings instead of Super Admin, so admin
-- users need write access. Public read access (brand_select) is unchanged.
DROP POLICY IF EXISTS "brand_manage" ON public.brand_settings;

CREATE POLICY "brand_manage" ON public.brand_settings
  FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));
