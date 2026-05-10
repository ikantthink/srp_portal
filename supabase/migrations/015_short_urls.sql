CREATE TABLE public.short_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  target_url text NOT NULL,
  title text,
  click_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  link_card_id uuid REFERENCES public.link_cards(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_short_urls_code ON public.short_urls (code);
CREATE INDEX idx_short_urls_created_by ON public.short_urls (created_by);
CREATE INDEX idx_short_urls_link_card_id ON public.short_urls (link_card_id);

ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Public can read by code (needed for redirect lookups)
CREATE POLICY "short_urls_select_public" ON public.short_urls FOR SELECT USING (true);

-- Authenticated users can insert their own
CREATE POLICY "short_urls_insert_own" ON public.short_urls FOR INSERT WITH CHECK (
  created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Owners and admins can update
CREATE POLICY "short_urls_update_own" ON public.short_urls FOR UPDATE USING (
  created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.get_user_role() IN ('admin', 'super_admin')
);

-- Owners and admins can delete
CREATE POLICY "short_urls_delete_own" ON public.short_urls FOR DELETE USING (
  created_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  OR public.get_user_role() IN ('admin', 'super_admin')
);

-- RPC to atomically increment click_count (called from middleware)
CREATE OR REPLACE FUNCTION public.increment_click_count(short_url_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.short_urls SET click_count = click_count + 1 WHERE code = short_url_code;
$$;
