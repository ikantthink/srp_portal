/**
 * Server-safe nav variant primitives: types, defaults, and the
 * `mergeNavVariant` helper. Lives outside `MainNav.tsx` (which is
 * `"use client"`) so server modules — site-chrome data layer, server
 * actions, the public layout — can `import` these directly. The client
 * component still consumes them from here too; nothing about the shape
 * is client-specific.
 */

export type MainNavProps = {
  logoText: string;
  logoUrl: string;
  links: string;
  ctaText: string;
  ctaLink: string;
  sticky: "yes" | "no";
};

export type NavVariantStyle = {
  height: number;
  maxWidth: "narrow" | "default" | "wide" | "full";
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  linkHoverColor: string;
  ctaBackgroundColor: string;
  ctaTextColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "regular" | "medium" | "semibold" | "bold";
  linkGap: number;
};

export type NavVariantScroll = {
  mode: "always_solid" | "transparent_until_scroll" | "transparent_over_hero";
  threshold: number;
  transparentTextColor: string;
  transparentLogoColor: string;
  solidBackgroundColor: string;
  transitionMs: number;
  /**
   * Logo image used while the header is in its transparent state. Accepts
   * the same shape as `MainNavProps.logoUrl` (custom URL, `theme:brand-logo`,
   * `theme:brand-logo-dark`). Empty means "same as the solid-state logo".
   */
  transparentLogoUrl: string;
};

export type NavVariant = MainNavProps & {
  id: string;
  name: string;
  style: NavVariantStyle;
  scroll: NavVariantScroll;
};

export type ParsedLink = { label: string; href: string };

/**
 * Theme tokens accepted in NavVariant color fields. A color value can be
 * either a raw CSS color (e.g. "#1e40af", "rgb(...)") or a sentinel of the
 * form `theme:<token>` which the renderer resolves to a `var(--…)`
 * reference at render time. This lets a single saved variant follow the
 * brand theme across sites without bake-in.
 */
export const THEME_COLOR_TOKENS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
] as const;

export type ThemeColorToken = (typeof THEME_COLOR_TOKENS)[number];

const THEME_TOKEN_CSS_VAR: Record<ThemeColorToken, string> = {
  primary: "var(--brand-primary)",
  secondary: "var(--brand-secondary)",
  accent: "var(--brand-accent)",
  background: "var(--background)",
  foreground: "var(--foreground)",
};

/**
 * Resolve a NavVariant color value. `theme:<token>` becomes the matching
 * CSS variable reference; everything else (hex/rgb/named/empty) is passed
 * through verbatim so existing saved variants keep rendering identically.
 */
export function resolveNavColor(value: string): string {
  if (typeof value !== "string") return value;
  if (!value.startsWith("theme:")) return value;
  const token = value.slice("theme:".length) as ThemeColorToken;
  return THEME_TOKEN_CSS_VAR[token] ?? value;
}

/** Sentinel logo values that resolve to brand-settings image URLs. */
export const LOGO_THEME_LIGHT = "theme:brand-logo";
export const LOGO_THEME_DARK = "theme:brand-logo-dark";

export interface LogoResolutionBrand {
  logoUrl: string | null;
  logoDarkUrl: string | null;
}

/**
 * Resolve a logo value into a concrete image URL.
 *
 *  - `theme:brand-logo`      → `brand.logoUrl ?? ""`
 *  - `theme:brand-logo-dark` → `brand.logoDarkUrl ?? ""`
 *  - empty string            → `""` (caller decides the fallback)
 *  - anything else           → the value verbatim (treated as a URL)
 */
export function resolveLogoUrl(
  value: string,
  brand: LogoResolutionBrand | null | undefined
): string {
  if (!value) return "";
  if (value === LOGO_THEME_LIGHT) return brand?.logoUrl ?? "";
  if (value === LOGO_THEME_DARK) return brand?.logoDarkUrl ?? "";
  return value;
}

export function parseLinks(value: string): ParsedLink[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s?.trim());
      return label && href ? { label, href } : null;
    })
    .filter((x): x is ParsedLink => x !== null);
}

export const MAIN_NAV_DEFAULTS: MainNavProps = {
  logoText: "SRP Real Estate",
  logoUrl: "",
  links: "Home|/\nAbout|/about\nListings|/listings\nContact|/contact",
  ctaText: "Agent Login",
  ctaLink: "/login",
  sticky: "yes",
};

// New variants default to theme tokens so they pick up brand colors out of
// the box. Existing saved variants keep whatever hex they had, because
// `mergeNavVariant` lets stored values win over these defaults.
export const NAV_VARIANT_STYLE_DEFAULTS: NavVariantStyle = {
  height: 64,
  maxWidth: "default",
  backgroundColor: "theme:background",
  textColor: "theme:foreground",
  linkColor: "theme:foreground",
  linkHoverColor: "theme:primary",
  ctaBackgroundColor: "theme:accent",
  ctaTextColor: "#000000",
  fontFamily: "",
  fontSize: 14,
  fontWeight: "medium",
  linkGap: 24,
};

export const NAV_VARIANT_SCROLL_DEFAULTS: NavVariantScroll = {
  mode: "always_solid",
  threshold: 80,
  transparentTextColor: "#ffffff",
  transparentLogoColor: "#ffffff",
  solidBackgroundColor: "theme:background",
  transitionMs: 200,
  transparentLogoUrl: "",
};

export const NAV_VARIANT_DEFAULTS: NavVariant = {
  id: "default",
  name: "Default",
  ...MAIN_NAV_DEFAULTS,
  style: NAV_VARIANT_STYLE_DEFAULTS,
  scroll: NAV_VARIANT_SCROLL_DEFAULTS,
};

/**
 * Deep-merge a partial NavVariant under NAV_VARIANT_DEFAULTS. The top-level
 * MainNavProps fields and identity fields shallow-merge; the `style` and
 * `scroll` sub-objects spread under their own defaults so saved rows that
 * pre-date a newly-added subfield still receive a sensible value.
 */
export function mergeNavVariant(partial: Partial<NavVariant>): NavVariant {
  const partialStyle = (partial.style ?? {}) as Partial<NavVariantStyle>;
  const partialScroll = (partial.scroll ?? {}) as Partial<NavVariantScroll>;
  return {
    ...NAV_VARIANT_DEFAULTS,
    ...partial,
    style: { ...NAV_VARIANT_STYLE_DEFAULTS, ...partialStyle },
    scroll: { ...NAV_VARIANT_SCROLL_DEFAULTS, ...partialScroll },
  };
}

export const NAV_MAX_WIDTH_PX: Record<NavVariantStyle["maxWidth"], string> = {
  narrow: "768px",
  default: "1280px",
  wide: "1536px",
  full: "100%",
};

export const NAV_FONT_WEIGHT: Record<NavVariantStyle["fontWeight"], number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};
