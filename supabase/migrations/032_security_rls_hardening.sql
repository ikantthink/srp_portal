-- Security hardening: tighten RLS, enable puck_block_presets RLS, fix function search_path.
-- Uses to_regclass / IF EXISTS guards so this applies cleanly when local migrations
-- ahead of the live project have not yet been synced.

-- ---------------------------------------------------------------------------
-- puck_block_presets (table may not exist on older deployments)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.puck_block_presets') IS NOT NULL THEN
    ALTER TABLE public.puck_block_presets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "puck_block_presets_select" ON public.puck_block_presets;
    DROP POLICY IF EXISTS "puck_block_presets_manage" ON public.puck_block_presets;

    CREATE POLICY "puck_block_presets_select"
      ON public.puck_block_presets FOR SELECT
      USING (auth.uid() IS NOT NULL);

    CREATE POLICY "puck_block_presets_manage"
      ON public.puck_block_presets FOR ALL
      USING (public.get_user_role() IN ('admin', 'super_admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Tighten over-permissive SELECT / INSERT policies
-- ---------------------------------------------------------------------------

-- website_pages: hide drafts from anon; admins retain full access via pages_manage
DROP POLICY IF EXISTS "pages_select" ON public.website_pages;
CREATE POLICY "pages_select" ON public.website_pages FOR SELECT USING (
  status = 'published'
  OR public.get_user_role() IN ('admin', 'super_admin')
);

-- forms: anon sees published only; authenticated team sees all via forms_manage
DROP POLICY IF EXISTS "forms_select" ON public.forms;
CREATE POLICY "forms_select" ON public.forms FOR SELECT USING (
  status = 'published'
  OR auth.uid() IS NOT NULL
);

-- form_versions: anon sees published versions only
DROP POLICY IF EXISTS "form_versions_select" ON public.form_versions;
CREATE POLICY "form_versions_select" ON public.form_versions FOR SELECT USING (
  status = 'published'
  OR auth.uid() IS NOT NULL
);

-- form_submissions: close direct anon INSERT (submissions go through service-role API)
DROP POLICY IF EXISTS "form_submissions_insert" ON public.form_submissions;

-- lead_tags: CRM metadata requires authentication
DROP POLICY IF EXISTS "lead_tags_select" ON public.lead_tags;
CREATE POLICY "lead_tags_select" ON public.lead_tags FOR SELECT USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Function search_path (Supabase security advisor)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role public.app_role;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"user"');
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
