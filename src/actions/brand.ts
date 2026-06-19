"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BrandAssetKey = "logo" | "logo_dark" | "favicon";

export interface BrandAsset {
  key: BrandAssetKey;
  label: string;
  url: string;
}

/**
 * Read the brand asset URLs configured under Settings → Branding so other
 * surfaces (notably the MediaPicker) can offer them as a shortcut without
 * forcing editors to re-upload a copy into the media library.
 *
 * Only entries with a non-empty URL are returned. Order is fixed
 * (logo → dark logo → favicon) so the picker UI stays predictable.
 */
export async function getBrandAssets(): Promise<BrandAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brand_settings")
    .select("logo_url, logo_dark_url, favicon_url")
    .limit(1)
    .maybeSingle();

  if (!data) return [];

  const out: BrandAsset[] = [];
  if (data.logo_url) {
    out.push({ key: "logo", label: "Logo", url: data.logo_url });
  }
  if (data.logo_dark_url) {
    out.push({ key: "logo_dark", label: "Dark mode logo", url: data.logo_dark_url });
  }
  if (data.favicon_url) {
    out.push({ key: "favicon", label: "Favicon", url: data.favicon_url });
  }
  return out;
}

export interface BrandSettingsInput {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_bg: string | null;
  sidebar_fg: string | null;
  sidebar_muted: string | null;
  font_heading: string;
  font_body: string;
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
}

function nullify(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export async function updateBrandSettings(input: BrandSettingsInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleRow?.role !== "admin" && roleRow?.role !== "super_admin") {
    return { error: "Unauthorized" };
  }

  const payload = {
    primary_color: input.primary_color,
    secondary_color: input.secondary_color,
    accent_color: input.accent_color,
    sidebar_bg: input.sidebar_bg,
    sidebar_fg: input.sidebar_fg,
    sidebar_muted: input.sidebar_muted,
    font_heading: input.font_heading,
    font_body: input.font_body,
    logo_url: nullify(input.logo_url),
    logo_dark_url: nullify(input.logo_dark_url),
    favicon_url: nullify(input.favicon_url),
  };

  const { data: existing } = await supabase
    .from("brand_settings")
    .select("id")
    .limit(1)
    .single();

  if (existing?.id) {
    const { error } = await supabase
      .from("brand_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("brand_settings").insert(payload);
    if (error) return { error: error.message };
  }

  // Brand CSS variables are emitted by `BrandThemeStyle` in the root layout,
  // so every public and portal route inherits them. Without the `"layout"`
  // type, `revalidatePath` only invalidates the literal `/` and `/portal`
  // segments — nested routes like `/about`, `/listings`, `/portal/website`
  // keep serving the stale layout cache and the nav/footer chrome only picks
  // up the new colors after a hard refresh. Pinning the call to the root
  // layout purges the entire client-side route cache so the next navigation
  // re-fetches the freshly-themed HTML.
  revalidatePath("/", "layout");

  return { success: true };
}
