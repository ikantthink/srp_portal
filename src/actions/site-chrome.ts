"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";
import type { MainNavProps, NavVariant } from "@/lib/puck/components/nav-variant";
import { mergeNavVariant } from "@/lib/puck/components/nav-variant";
import type { FooterProps } from "@/lib/puck/components/Footer";
import {
  SITE_FOOTER_KEY,
  SITE_NAV_KEY,
  SITE_NAV_VARIANTS_KEY,
  listNavVariants,
} from "@/lib/site-chrome";

async function upsertSetting(key: string, value: unknown) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("website_settings")
    .upsert({ key, value }, { onConflict: "key" });
  return error ? { error: error.message } : { ok: true as const };
}

export async function saveSiteNav(
  nav: MainNavProps
): Promise<{ ok: true } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const result = await upsertSetting(SITE_NAV_KEY, nav as unknown as Record<string, unknown>);
  if ("error" in result) return result;

  revalidatePath("/portal/website/chrome");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveSiteFooter(
  footer: FooterProps
): Promise<{ ok: true } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const result = await upsertSetting(SITE_FOOTER_KEY, footer as unknown as Record<string, unknown>);
  if ("error" in result) return result;

  revalidatePath("/portal/website/chrome");
  revalidatePath("/", "layout");
  return { ok: true };
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Pick an id from `desired`, suffixing `-2`, `-3`, … until it doesn't clash
 * with any existing id. Used when the editor creates a new variant — names
 * can be anything but ids must be stable+unique because pages reference
 * them by id.
 */
function uniqueId(desired: string, taken: Set<string>): string {
  const base = desired || "variant";
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10_000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Astronomically unlikely; fall back to a timestamp.
  return `${base}-${Date.now()}`;
}

/**
 * Create or update a nav variant. The `default` variant exists implicitly
 * and cannot have its id changed; the rest are matched by id, with new
 * variants getting a fresh slug-from-name id (collision-suffixed) when the
 * incoming `id` is missing or already taken by a different name.
 */
export async function upsertNavVariant(
  variant: NavVariant
): Promise<{ ok: true; variant: NavVariant } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  const variants = await listNavVariants();
  const existingIds = new Set(variants.map((v) => v.id));

  let id = variant.id?.trim() || "";
  const existing = id ? variants.find((v) => v.id === id) : undefined;

  if (id === "default") {
    // Editing default is fine, but trying to rename it isn't.
    if (!existing) return { error: "Default variant must exist" };
  } else if (!existing) {
    // New variant — derive a unique id from the name.
    const desired = id || slugifyName(variant.name || "variant");
    if (!desired) return { error: "A variant name is required" };
    id = uniqueId(desired, existingIds);
  }

  const merged = mergeNavVariant({ ...variant, id, name: variant.name?.trim() || id });

  const next = existing
    ? variants.map((v) => (v.id === merged.id ? merged : v))
    : [...variants, merged];

  const supabase = await createClient();
  const { error } = await supabase
    .from("website_settings")
    .upsert({ key: SITE_NAV_VARIANTS_KEY, value: next }, { onConflict: "key" });
  if (error) return { error: error.message };

  revalidatePath("/portal/website/chrome");
  revalidatePath("/", "layout");
  return { ok: true, variant: merged };
}

/**
 * Delete a non-default variant and null out any page references. Supabase
 * JS doesn't surface true transactions, so we accept best-effort here —
 * leaving a dangling `nav_variant_id` is harmless because the resolver
 * falls back to the default variant when the id is unknown.
 */
export async function deleteNavVariant(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard;

  if (id === "default") return { error: "Cannot delete the default variant" };

  const variants = await listNavVariants();
  if (!variants.some((v) => v.id === id)) {
    return { error: "Variant not found" };
  }
  const next = variants.filter((v) => v.id !== id);

  const supabase = await createClient();
  const { error: writeErr } = await supabase
    .from("website_settings")
    .upsert(
      { key: SITE_NAV_VARIANTS_KEY, value: next },
      { onConflict: "key" }
    );
  if (writeErr) return { error: writeErr.message };

  await supabase
    .from("website_pages")
    .update({ nav_variant_id: null })
    .eq("nav_variant_id", id);

  revalidatePath("/portal/website/chrome");
  revalidatePath("/", "layout");
  return { ok: true };
}
