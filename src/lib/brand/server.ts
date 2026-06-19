import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { deriveSidebarColors } from "@/lib/color-utils";

/**
 * Server-side brand theme resolver.
 *
 * Lives separately from the client-side `useBrandTheme` hook in
 * `src/hooks/use-brand-theme.ts` because the two have different jobs:
 *
 *   * This module runs during SSR. Its job is to make sure the rendered
 *     HTML carries the correct `--brand-*` CSS variables so the very first
 *     paint matches the configured theme. Without this, every block that
 *     references `var(--brand-primary)` (Hero, HeroFlex, CallToAction,
 *     FeaturedListings, Footer, etc.) flashes the globals.css default
 *     blue and then snaps to the real theme color once the client
 *     `BrandProvider` finishes its async fetch.
 *
 *   * The client hook stays in place — it still provides the React
 *     context (used for things like the logo URL in the sidebar) and
 *     re-applies the variables after edits in the admin UI so the change
 *     reflects without a hard refresh.
 *
 * Wrapped in `React.cache` so co-located server components and the layout
 * share a single Supabase round-trip per request.
 */

export interface ResolvedBrand {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_bg: string;
  sidebar_fg: string;
  sidebar_muted: string;
  font_heading: string;
  font_body: string;
}

// Defaults mirror those baked into `globals.css` so a missing row or a
// failed read produces the same visual as the existing CSS fallback.
const DEFAULTS: ResolvedBrand = {
  primary_color: "#1e40af",
  secondary_color: "#7c3aed",
  accent_color: "#f59e0b",
  // Sidebar derivations are computed from the primary; these literal
  // fallbacks only matter if `deriveSidebarColors` is bypassed (it isn't).
  sidebar_bg: "#0f172a",
  sidebar_fg: "#f1f5f9",
  sidebar_muted: "#1e293b",
  font_heading: "Inter",
  font_body: "Inter",
};

export const getBrandSettings = cache(async (): Promise<ResolvedBrand> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("brand_settings")
      .select("*")
      .limit(1)
      .single();

    if (!data) return DEFAULTS;

    const primary = data.primary_color ?? DEFAULTS.primary_color;
    // Mirror the client hook's behaviour: persist explicit sidebar colors
    // when an admin set them, otherwise derive from primary so the chrome
    // automatically tracks brand changes.
    const derived = deriveSidebarColors(primary);

    return {
      primary_color: primary,
      secondary_color: data.secondary_color ?? DEFAULTS.secondary_color,
      accent_color: data.accent_color ?? DEFAULTS.accent_color,
      sidebar_bg: data.sidebar_bg ?? derived.bg,
      sidebar_fg: data.sidebar_fg ?? derived.fg,
      sidebar_muted: data.sidebar_muted ?? derived.muted,
      font_heading: data.font_heading ?? DEFAULTS.font_heading,
      font_body: data.font_body ?? DEFAULTS.font_body,
    };
  } catch {
    // Network/RLS errors here are non-fatal — the CSS defaults in
    // globals.css take over and the page still renders, just without a
    // custom theme. Swallowing keeps the layout from 500-ing on transient
    // Supabase issues.
    return DEFAULTS;
  }
});
