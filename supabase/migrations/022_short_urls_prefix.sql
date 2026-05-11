-- Categorize short URLs by type so each pool gets its own keyspace.
-- 'l' = link card short URL (redirects to /c/<slug>)
-- 's' = standard / user-created short URL (redirects to arbitrary target_url)
--
-- The previous UNIQUE constraint on `code` alone is replaced with UNIQUE on
-- (prefix, code) so the same 4-char code can exist under different prefixes.

ALTER TABLE public.short_urls
  ADD COLUMN prefix text NOT NULL DEFAULT 's'
  CHECK (prefix IN ('l', 's'));

UPDATE public.short_urls SET prefix = 'l' WHERE link_card_id IS NOT NULL;

ALTER TABLE public.short_urls DROP CONSTRAINT short_urls_code_key;
ALTER TABLE public.short_urls ADD CONSTRAINT short_urls_prefix_code_key UNIQUE (prefix, code);

DROP INDEX IF EXISTS idx_short_urls_code;
CREATE INDEX idx_short_urls_prefix_code ON public.short_urls (prefix, code);

-- The old text-keyed click-count RPC can't disambiguate when the same code
-- exists under two prefixes. Switch to the row id.
DROP FUNCTION IF EXISTS public.increment_click_count(text);
CREATE OR REPLACE FUNCTION public.increment_click_count(short_url_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.short_urls SET click_count = click_count + 1 WHERE id = short_url_id;
$$;
