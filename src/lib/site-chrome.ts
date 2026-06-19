import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAIN_NAV_DEFAULTS,
  NAV_VARIANT_DEFAULTS,
  mergeNavVariant,
  type MainNavProps,
  type NavVariant,
} from "@/lib/puck/components/nav-variant";
import {
  FOOTER_COLUMN_WEIGHT_DEFAULT,
  FOOTER_DEFAULTS,
  FOOTER_STYLE_DEFAULTS,
  makeCopyrightBlock,
  makeSocialBlock,
  makeTextBlock,
  sanitizeWeight,
  type FooterBlock,
  type FooterBlockAlign,
  type FooterLeafBlock,
  type FooterProps,
  type FooterRow,
  type FooterStyle,
} from "@/lib/puck/components/Footer";

const NAV_KEY = "site_nav";
const FOOTER_KEY = "site_footer";
const NAV_VARIANTS_KEY = "site_nav_variants";

/**
 * Read a single `website_settings` row keyed by `key`, merging defaults under
 * whatever the DB stores. We use the admin client because nav/footer are
 * needed on every public page render regardless of auth state.
 */
async function readSetting<T>(key: string, defaults: T): Promise<T> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (!data?.value) return defaults;
  // Shallow-merge ensures newly-added fields fall back to the defaults even if
  // the saved row pre-dates their introduction.
  return { ...defaults, ...(data.value as Partial<T>) } as T;
}

/**
 * Backward-compat reader for the now-deprecated `site_nav` row. New code
 * should call `getNavVariant`/`listNavVariants` instead. Returns just the
 * `MainNavProps` slice of the default variant when the legacy row is missing.
 */
export async function getSiteNav(): Promise<MainNavProps> {
  return readSetting<MainNavProps>(NAV_KEY, MAIN_NAV_DEFAULTS);
}

export async function getSiteFooter(): Promise<FooterProps> {
  // We deliberately don't pass `FOOTER_DEFAULTS` as the readSetting defaults
  // because `readSetting` shallow-merges the defaults on top of the raw row,
  // which would inject the new-shape `rows: [...]` field into legacy v1-v3
  // payloads and trick `normalizeFooter` into skipping the migration path.
  // `normalizeFooter` already handles the empty/missing case by returning
  // a fresh clone of `FOOTER_DEFAULTS`.
  const raw = await readSetting<Record<string, unknown>>(FOOTER_KEY, {});
  return normalizeFooter(raw);
}

/**
 * Coerce legacy footer payloads into the current `FooterProps` shape.
 *
 * Known prior shapes (each is detected per-column or per-row):
 *  v1. `columns: { title, links }[]` (pre column-layout editor) — one list per
 *      column, no ids, no `style`.
 *  v2. `columns: { id, title, links }[][]` (last iteration, link-lists only).
 *  v3. `columns: FooterBlock[][]` with top-level `tagline`/`copyright`/
 *      `socialLinks`/`backgroundColor: "dark"|"light"|"brand"`.
 *  v4. `rows: FooterRow[]` (current) with color-picker fields.
 *
 * v1–v3 are lifted into the v4 rows model. The pre-existing tagline becomes
 * a leading text block, and the pre-existing copyright + social-links bar
 * becomes a trailing row, so existing footers keep looking the same after
 * migration.
 */
function normalizeFooter(raw: Record<string, unknown>): FooterProps {
  const style: FooterStyle = {
    ...FOOTER_STYLE_DEFAULTS,
    ...((raw.style as Partial<FooterStyle>) ?? {}),
  };

  // v4 payloads carry `rows` directly. Normalize each row's blocks but skip
  // the legacy column/tagline/copyright merge below.
  if (Array.isArray(raw.rows)) {
    const rows = normalizeRows(raw.rows);
    return {
      rows: rows.length > 0 ? rows : cloneRows(FOOTER_DEFAULTS.rows),
      backgroundColor: pickString(raw.backgroundColor, FOOTER_DEFAULTS.backgroundColor),
      textColor: pickString(raw.textColor, FOOTER_DEFAULTS.textColor),
      linkColor: pickString(raw.linkColor, FOOTER_DEFAULTS.linkColor),
      linkHoverColor: pickString(raw.linkHoverColor, FOOTER_DEFAULTS.linkHoverColor),
      style,
    };
  }

  // Legacy v1–v3 — build a single row out of the old `columns` block grid,
  // then prepend/append rows to host the tagline/copyright/social chrome
  // that used to be hard-coded outside the grid.
  const legacyColumns: FooterBlock[][] = Array.isArray(raw.columns)
    ? (raw.columns as unknown[]).map((entry, ci) => normalizeColumn(entry, ci))
    : [];

  const rows: FooterRow[] = [];

  const tagline = typeof raw.tagline === "string" ? raw.tagline.trim() : "";
  if (tagline) {
    const columns = [[makeTextBlock({ id: "block_legacy_tagline", body: tagline })]];
    rows.push({
      id: "row_legacy_tagline",
      columns,
      columnWeights: defaultWeights(columns.length),
      wrap: true,
    });
  }

  if (legacyColumns.length > 0) {
    rows.push({
      id: "row_legacy_links",
      columns: legacyColumns,
      columnWeights: defaultWeights(legacyColumns.length),
      wrap: true,
    });
  }

  const copyright = typeof raw.copyright === "string" ? raw.copyright.trim() : "";
  const socialLinks = typeof raw.socialLinks === "string" ? raw.socialLinks.trim() : "";
  if (copyright || socialLinks) {
    const metaColumns: FooterBlock[][] = [];
    if (copyright) {
      metaColumns.push([
        makeCopyrightBlock({ id: "block_legacy_copyright", text: copyright }),
      ]);
    }
    if (socialLinks) {
      metaColumns.push([
        makeSocialBlock({
          id: "block_legacy_social",
          align: copyright ? "right" : "left",
          links: socialLinks,
        }),
      ]);
    }
    rows.push({
      id: "row_legacy_meta",
      columns: metaColumns,
      columnWeights: defaultWeights(metaColumns.length),
      wrap: true,
    });
  }

  const finalRows = rows.length > 0 ? rows : cloneRows(FOOTER_DEFAULTS.rows);

  // Map the legacy 3-preset background into the new theme/custom color
  // fields. Theme tokens are preferred so brand changes still flow through.
  const legacyBg = raw.backgroundColor;
  const colors = legacyBackgroundColors(legacyBg);

  return {
    rows: finalRows,
    backgroundColor: colors.backgroundColor,
    textColor: colors.textColor,
    linkColor: colors.linkColor,
    linkHoverColor: colors.linkHoverColor,
    style,
  };
}

interface LegacyColorMap {
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  linkHoverColor: string;
}

function legacyBackgroundColors(value: unknown): LegacyColorMap {
  if (value === "light") {
    return {
      backgroundColor: "theme:background",
      textColor: "theme:foreground",
      linkColor: "theme:foreground",
      linkHoverColor: "theme:primary",
    };
  }
  if (value === "brand") {
    return {
      backgroundColor: "theme:primary",
      textColor: "#ffffff",
      linkColor: "rgba(255,255,255,0.85)",
      linkHoverColor: "#ffffff",
    };
  }
  if (value === "dark") {
    return {
      backgroundColor: "theme:foreground",
      textColor: "#ffffff",
      linkColor: "rgba(255,255,255,0.7)",
      linkHoverColor: "#ffffff",
    };
  }
  // Unknown / not-set → fall back to the fresh-install defaults.
  return {
    backgroundColor: FOOTER_DEFAULTS.backgroundColor,
    textColor: FOOTER_DEFAULTS.textColor,
    linkColor: FOOTER_DEFAULTS.linkColor,
    linkHoverColor: FOOTER_DEFAULTS.linkHoverColor,
  };
}

function cloneRows(rows: FooterRow[]): FooterRow[] {
  return rows.map((row) => ({
    id: row.id,
    columns: row.columns.map((col) => col.map((b) => ({ ...b }))),
    columnWeights: row.columnWeights.slice(),
    wrap: row.wrap,
  }));
}

function normalizeRows(rawRows: unknown[]): FooterRow[] {
  return rawRows
    .map((entry, ri) => {
      if (!entry || typeof entry !== "object") return null;
      const r = entry as Record<string, unknown>;
      const id =
        typeof r.id === "string" && r.id.length > 0 ? r.id : `row_legacy_${ri}`;
      const columns: FooterBlock[][] = Array.isArray(r.columns)
        ? (r.columns as unknown[]).map((c, ci) => normalizeColumn(c, ci))
        : [];
      // Drop entirely-empty rows so the renderer doesn't waste a grid slot.
      if (columns.length === 0) return null;
      const columnWeights = reconcileWeights(r.columnWeights, columns.length);
      // Default to wrap=true so footers persisted before this field existed
      // pick up the new responsive behavior automatically. Only an explicit
      // `false` opts out.
      const wrap = typeof r.wrap === "boolean" ? r.wrap : true;
      return { id, columns, columnWeights, wrap } as FooterRow;
    })
    .filter((r): r is FooterRow => r !== null);
}

/** Produce a `[1, 1, …, 1]` array of the given length using the shared
 * default. Used when constructing rows from legacy payloads that never had
 * per-column weights. */
function defaultWeights(length: number): number[] {
  return Array.from({ length }, () => FOOTER_COLUMN_WEIGHT_DEFAULT);
}

/** Coerce a persisted `columnWeights` array into a length-`columnCount`
 * shape, sanitizing each entry. Missing/garbage entries become the default
 * weight, extra entries are dropped. Keeps the renderer free of array-length
 * assertions. */
function reconcileWeights(raw: unknown, columnCount: number): number[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: columnCount }, (_, i) => sanitizeWeight(list[i]));
}

function normalizeColumn(entry: unknown, columnIndex: number): FooterBlock[] {
  if (Array.isArray(entry)) {
    return entry
      .map((b, bi) => normalizeBlock(b, columnIndex, bi))
      .filter((b): b is FooterBlock => b !== null);
  }
  // Legacy v1 1D shape: each column held a single { title, links } object.
  const single = normalizeBlock(entry, columnIndex, 0);
  return single ? [single] : [];
}

function pickString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function pickAlign(v: unknown): FooterBlockAlign {
  return v === "center" || v === "right" ? v : "left";
}

function pickNonNegInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function normalizeBlock(
  raw: unknown,
  columnIndex: number,
  blockIndex: number
): FooterBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id =
    typeof r.id === "string" && r.id.length > 0
      ? r.id
      : `block_legacy_${columnIndex}_${blockIndex}`;
  const align = pickAlign(r.align);
  const rawType = r.type;
  const type =
    rawType === "image" ||
    rawType === "imageLink" ||
    rawType === "text" ||
    rawType === "copyright" ||
    rawType === "social" ||
    rawType === "inlineRow"
      ? rawType
      : "linkList";

  if (type === "inlineRow") {
    const rawChildren = Array.isArray(r.children) ? (r.children as unknown[]) : [];
    const children = rawChildren
      .map((child, ci) => normalizeBlock(child, columnIndex, ci))
      // Block nested inline rows — discriminated union refinement to
      // `FooterLeafBlock` keeps the type narrowed for downstream consumers.
      .filter((c): c is FooterLeafBlock => c !== null && c.type !== "inlineRow");
    const gap = typeof r.gap === "number" && r.gap >= 0 ? Math.floor(r.gap) : 16;
    const wrap = typeof r.wrap === "boolean" ? r.wrap : true;
    const verticalAlign =
      r.verticalAlign === "center" ||
      r.verticalAlign === "bottom" ||
      r.verticalAlign === "stretch"
        ? r.verticalAlign
        : "top";
    return { id, align, type, children, gap, wrap, verticalAlign };
  }
  if (type === "linkList") {
    return {
      id,
      align,
      type,
      title: pickString(r.title, "Column"),
      links: pickString(r.links, ""),
    };
  }
  if (type === "image") {
    return {
      id,
      align,
      type,
      src: pickString(r.src, ""),
      alt: pickString(r.alt, ""),
      maxWidth: pickNonNegInt(r.maxWidth),
      maxHeight: pickNonNegInt(r.maxHeight),
    };
  }
  if (type === "imageLink") {
    return {
      id,
      align,
      type,
      src: pickString(r.src, ""),
      alt: pickString(r.alt, ""),
      href: pickString(r.href, ""),
      maxWidth: pickNonNegInt(r.maxWidth),
      maxHeight: pickNonNegInt(r.maxHeight),
    };
  }
  if (type === "text") {
    const fontSizeRaw = typeof r.fontSize === "number" ? r.fontSize : 14;
    return {
      id,
      align,
      type,
      heading: pickString(r.heading, ""),
      body: pickString(r.body, ""),
      fontSize: fontSizeRaw > 0 ? Math.floor(fontSizeRaw) : 14,
      color: pickString(r.color, ""),
    };
  }
  if (type === "copyright") {
    return {
      id,
      align,
      type,
      text: pickString(r.text, "© {year} All rights reserved."),
    };
  }
  // social
  return {
    id,
    align,
    type,
    links: pickString(r.links, ""),
  };
}

/**
 * Read the full list of nav variants. Always returns at least one element
 * (the canonical `default` variant) so callers can safely `.find`/index.
 */
export async function listNavVariants(): Promise<NavVariant[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", NAV_VARIANTS_KEY)
    .maybeSingle();

  const raw = data?.value as unknown;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [NAV_VARIANT_DEFAULTS];
  }

  const variants = raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => mergeNavVariant(v as Partial<NavVariant>));

  // Guarantee a default variant exists at index 0.
  if (!variants.some((v) => v.id === "default")) {
    variants.unshift(NAV_VARIANT_DEFAULTS);
  }
  return variants;
}

/**
 * Look up a variant by id. Falls back to the default variant when the id is
 * missing/null/unknown — never throws so callers can always render a header.
 */
export async function getNavVariant(
  id: string | null | undefined
): Promise<NavVariant> {
  const variants = await listNavVariants();
  if (!id) return variants.find((v) => v.id === "default") ?? variants[0];
  return (
    variants.find((v) => v.id === id) ??
    variants.find((v) => v.id === "default") ??
    variants[0]
  );
}

/**
 * Resolve the variant attached to the page that owns `pathname`. The pathname
 * is parsed into a CMS slug: `/` -> `home`, `/about` -> `about`, blog routes
 * collapse to `blog` (blog isn't a CMS page, so it gets the default).
 */
export async function getNavVariantForPath(pathname: string): Promise<NavVariant> {
  const variants = await listNavVariants();
  const fallback = variants.find((v) => v.id === "default") ?? variants[0];

  const slug = pathname.split("/").filter(Boolean)[0] ?? "home";
  if (!slug || slug === "home") {
    // The literal `home` row carries the override for `/`.
  }
  const lookupSlug = !slug || slug === "" ? "home" : slug;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("website_pages")
      .select("nav_variant_id")
      .eq("slug", lookupSlug)
      .maybeSingle();

    const variantId = (data?.nav_variant_id as string | null) ?? null;
    if (!variantId) return fallback;
    return variants.find((v) => v.id === variantId) ?? fallback;
  } catch {
    return fallback;
  }
}

export const SITE_NAV_KEY = NAV_KEY;
export const SITE_FOOTER_KEY = FOOTER_KEY;
export const SITE_NAV_VARIANTS_KEY = NAV_VARIANTS_KEY;

export interface BrandLogos {
  logoUrl: string | null;
  logoDarkUrl: string | null;
}

/**
 * Read the configured brand logo URLs from `brand_settings`. Returns
 * `{ logoUrl: null, logoDarkUrl: null }` when nothing is configured. The
 * nav variant resolver uses these to expand `theme:brand-logo` /
 * `theme:brand-logo-dark` tokens into real image URLs at render time.
 *
 * Uses the admin client because the public navbar needs to read this on
 * every page render, regardless of the visitor's auth state.
 */
export async function getBrandLogos(): Promise<BrandLogos> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("brand_settings")
      .select("logo_url, logo_dark_url")
      .limit(1)
      .maybeSingle();
    return {
      logoUrl: (data?.logo_url as string | null) ?? null,
      logoDarkUrl: (data?.logo_dark_url as string | null) ?? null,
    };
  } catch {
    return { logoUrl: null, logoDarkUrl: null };
  }
}
