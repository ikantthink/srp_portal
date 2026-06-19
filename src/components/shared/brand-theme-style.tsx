import { getBrandSettings } from "@/lib/brand/server";

/**
 * Emits a `<style>` tag that sets the brand CSS variables to the values
 * stored in `brand_settings`. Rendered from the root layout so it lands in
 * the SSR HTML and overrides the defaults baked into `globals.css` on the
 * very first paint — no client roundtrip required.
 *
 * React 19 hoists this `<style>` element into `<head>` automatically. We
 * still inline it in source order *after* `globals.css` is imported in the
 * root layout so the cascade reliably puts our overrides on top.
 *
 * Security notes:
 *   * The resolved values flow into a CSS rule, so any value containing
 *     `}` or `</style>` would let an attacker break out. `safeColor` and
 *     `safeFont` whitelist the input shapes (hex, rgb(), CSS color keyword
 *     / quoted font name) and discard anything else.
 *   * If sanitisation rejects a value we fall back to the same defaults
 *     `globals.css` ships with, so behaviour is identical to a missing
 *     row.
 */
export async function BrandThemeStyle() {
  const brand = await getBrandSettings();

  const css = `:root{` +
    `--brand-primary:${safeColor(brand.primary_color, "#1e40af")};` +
    `--brand-secondary:${safeColor(brand.secondary_color, "#7c3aed")};` +
    `--brand-accent:${safeColor(brand.accent_color, "#f59e0b")};` +
    `--sidebar-bg:${safeColor(brand.sidebar_bg, "#0f172a")};` +
    `--sidebar-fg:${safeColor(brand.sidebar_fg, "#f1f5f9")};` +
    `--sidebar-muted:${safeColor(brand.sidebar_muted, "#1e293b")};` +
    `--font-heading:${safeFont(brand.font_heading, "Inter")};` +
    `--font-body:${safeFont(brand.font_body, "Inter")};` +
    `}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ---------------------------------------------------------------------------
// Value sanitisers
// ---------------------------------------------------------------------------

// Accepts:
//   * #rgb / #rrggbb / #rrggbbaa (3, 6 or 8 hex digits)
//   * rgb(...) / rgba(...) / hsl(...) / hsla(...)
//   * a small set of CSS color keywords commonly used in branding
// Anything else falls back to `fallback`.
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FN_RE = /^(?:rgb|rgba|hsl|hsla)\([0-9a-z\s,.%/-]+\)$/i;
const KEYWORD_RE = /^[a-z]{3,20}$/i;

function safeColor(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (HEX_RE.test(trimmed)) return trimmed;
  if (FN_RE.test(trimmed)) return trimmed;
  if (KEYWORD_RE.test(trimmed)) return trimmed;
  return fallback;
}

// Font family: allow letters, digits, spaces, hyphens. Wrap in quotes so
// multi-word names (e.g. "Playfair Display") work without callers having
// to remember to quote.
const FONT_NAME_RE = /^[a-z0-9 \-]{1,64}$/i;

function safeFont(value: string | null | undefined, fallback: string): string {
  const name = (value ?? "").trim() || fallback;
  if (!FONT_NAME_RE.test(name)) return `"${fallback}"`;
  return `"${name}"`;
}
