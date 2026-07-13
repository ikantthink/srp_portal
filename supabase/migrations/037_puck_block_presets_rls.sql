-- 032_security_rls_hardening ran before puck_block_presets existed on some
-- deployments and skipped enabling RLS for it via its to_regclass guard.
-- Apply it now that the table is guaranteed to exist (from 016).
ALTER TABLE public.puck_block_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "puck_block_presets_select" ON public.puck_block_presets;
DROP POLICY IF EXISTS "puck_block_presets_manage" ON public.puck_block_presets;

CREATE POLICY "puck_block_presets_select"
  ON public.puck_block_presets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "puck_block_presets_manage"
  ON public.puck_block_presets FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));
