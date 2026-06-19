-- Rebind seeded site_nav_variants / site_footer color fields whose values
-- still match the original migration seed onto `theme:*` tokens, so changes
-- in brand_settings automatically propagate to the navbar / footer chrome
-- on the next render.
--
-- Migration is intentionally conservative: only fields whose stored value
-- is EXACTLY one of the documented seed defaults are rewritten. Any value
-- an admin has typed in (custom hex, rgba, an unrelated theme token, etc.)
-- is left untouched — that matches the "custom hex stays custom unless the
-- admin opts into Theme mode" rule the editor enforces.
--
-- Re-running the migration is a no-op because every conditional only
-- rebinds when the field still equals the original literal seed value.

-- ---------------------------------------------------------------------------
-- 1. site_nav_variants
--    Seeded by migration 029 with hardcoded hex defaults that mirror the
--    fresh-install brand palette. Once migrated those should live as
--    `theme:*` sentinels so brand changes flow through `resolveNavColor`.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  raw_value jsonb;
  rebound jsonb;
  variant jsonb;
  next_variant jsonb;
  next_style jsonb;
  next_scroll jsonb;
  has_style boolean;
  has_scroll boolean;
BEGIN
  SELECT value INTO raw_value
  FROM public.website_settings
  WHERE key = 'site_nav_variants';

  IF raw_value IS NULL OR jsonb_typeof(raw_value) <> 'array' THEN
    RETURN;
  END IF;

  rebound := '[]'::jsonb;

  FOR variant IN SELECT * FROM jsonb_array_elements(raw_value) LOOP
    -- Pass non-object entries through verbatim — defensive against
    -- malformed rows that pre-date the variant schema.
    IF variant IS NULL OR jsonb_typeof(variant) <> 'object' THEN
      rebound := rebound || jsonb_build_array(variant);
      CONTINUE;
    END IF;

    next_variant := variant;
    has_style := variant ? 'style' AND jsonb_typeof(variant -> 'style') = 'object';
    has_scroll := variant ? 'scroll' AND jsonb_typeof(variant -> 'scroll') = 'object';
    next_style := CASE WHEN has_style THEN variant -> 'style' ELSE '{}'::jsonb END;
    next_scroll := CASE WHEN has_scroll THEN variant -> 'scroll' ELSE '{}'::jsonb END;

    -- Rebind seeded `style.*` colors. Each replacement is gated on the
    -- field still equaling its 029-seed literal so admin overrides survive.
    IF next_style ->> 'backgroundColor' = '#ffffff' THEN
      next_style := jsonb_set(next_style, '{backgroundColor}', '"theme:background"');
    END IF;
    IF next_style ->> 'textColor' = '#0a0a0a' THEN
      next_style := jsonb_set(next_style, '{textColor}', '"theme:foreground"');
    END IF;
    IF next_style ->> 'linkColor' = '#0a0a0a' THEN
      next_style := jsonb_set(next_style, '{linkColor}', '"theme:foreground"');
    END IF;
    IF next_style ->> 'linkHoverColor' = '#1e40af' THEN
      next_style := jsonb_set(next_style, '{linkHoverColor}', '"theme:primary"');
    END IF;
    IF next_style ->> 'ctaBackgroundColor' = '#f59e0b' THEN
      next_style := jsonb_set(next_style, '{ctaBackgroundColor}', '"theme:accent"');
    END IF;
    -- ctaTextColor stays '#000000': it's a contrast-on-accent choice that
    -- matches the in-code default and isn't tied to any brand variable.

    -- Rebind seeded `scroll.*` colors that should track brand. The
    -- transparent-state colors stay '#ffffff' (the in-code default) because
    -- the transparent navbar floats over hero artwork that is conventionally
    -- dark — rebinding them to `theme:background` would invert behavior on
    -- light hero images.
    IF next_scroll ->> 'solidBackgroundColor' = '#ffffff' THEN
      next_scroll := jsonb_set(next_scroll, '{solidBackgroundColor}', '"theme:background"');
    END IF;

    -- Only re-set sub-objects we actually touched (or that already existed),
    -- so we don't add empty `{}` placeholders to rows that previously had
    -- no `style`/`scroll`. `mergeNavVariant` in code handles the missing
    -- case by spreading defaults at read time.
    IF has_style THEN
      next_variant := jsonb_set(next_variant, '{style}', next_style);
    END IF;
    IF has_scroll THEN
      next_variant := jsonb_set(next_variant, '{scroll}', next_scroll);
    END IF;

    rebound := rebound || jsonb_build_array(next_variant);
  END LOOP;

  IF rebound IS DISTINCT FROM raw_value THEN
    UPDATE public.website_settings
    SET value = rebound,
        updated_at = now()
    WHERE key = 'site_nav_variants';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. site_footer
--    Migration 028 seeded `backgroundColor: 'dark'`, which `normalizeFooter`
--    transparently maps to a theme:foreground bg + white text at READ time.
--    Persist that mapping here so the editor and any direct readers see the
--    final v4 shape, and so a future site-chrome refactor can drop the
--    legacy preset handling without re-introducing a flash of the old
--    background.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  raw_value jsonb;
  bg text;
  text_color text;
  link_color text;
  link_hover text;
BEGIN
  SELECT value INTO raw_value
  FROM public.website_settings
  WHERE key = 'site_footer';

  IF raw_value IS NULL OR jsonb_typeof(raw_value) <> 'object' THEN
    RETURN;
  END IF;

  bg := raw_value ->> 'backgroundColor';

  -- Only act on the three documented legacy preset strings. Anything else
  -- (already a theme token, a hex, missing) is left for `normalizeFooter`
  -- to handle at read time / for the admin to manage explicitly.
  IF bg = 'dark' THEN
    text_color := '#ffffff';
    link_color := 'rgba(255,255,255,0.7)';
    link_hover := '#ffffff';
    raw_value := jsonb_set(raw_value, '{backgroundColor}', '"theme:foreground"');
  ELSIF bg = 'light' THEN
    text_color := 'theme:foreground';
    link_color := 'theme:foreground';
    link_hover := 'theme:primary';
    raw_value := jsonb_set(raw_value, '{backgroundColor}', '"theme:background"');
  ELSIF bg = 'brand' THEN
    text_color := '#ffffff';
    link_color := 'rgba(255,255,255,0.85)';
    link_hover := '#ffffff';
    raw_value := jsonb_set(raw_value, '{backgroundColor}', '"theme:primary"');
  ELSE
    RETURN;
  END IF;

  -- Only write the per-field colors if the row doesn't already carry them.
  -- This avoids clobbering a partial migration done by an earlier save.
  IF NOT raw_value ? 'textColor' THEN
    raw_value := jsonb_set(raw_value, '{textColor}', to_jsonb(text_color), true);
  END IF;
  IF NOT raw_value ? 'linkColor' THEN
    raw_value := jsonb_set(raw_value, '{linkColor}', to_jsonb(link_color), true);
  END IF;
  IF NOT raw_value ? 'linkHoverColor' THEN
    raw_value := jsonb_set(raw_value, '{linkHoverColor}', to_jsonb(link_hover), true);
  END IF;

  UPDATE public.website_settings
  SET value = raw_value,
      updated_at = now()
  WHERE key = 'site_footer';
END $$;

-- ---------------------------------------------------------------------------
-- 3. (Optional follow-up): if/when more chrome surfaces gain `theme:*`
--    support (link cards, form Puck pages), extend this migration with
--    additional DO blocks rather than introducing a new file — keeping all
--    brand-link rebinding in one place makes the audit trail obvious.
-- ---------------------------------------------------------------------------
