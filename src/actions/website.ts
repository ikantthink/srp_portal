"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/require-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listNavVariants } from "@/lib/site-chrome";

const EMPTY_PUCK_DOC = { content: [], root: { props: {} } };

const HOME_DEFAULT_PUCK_DATA = {
  content: [
    {
      type: "Hero",
      props: {
        id: "Hero-home-default",
        heading: "Find Your Dream Home",
        subheading:
          "Expert guidance for buyers and sellers. Let our team navigate the market for you.",
        ctaText: "Get Started",
        ctaLink: "/contact",
        backgroundImage: "",
        overlay: false,
      },
    },
    {
      type: "Stats",
      props: {
        id: "Stats-home-default",
        items:
          "500+|Homes Sold\n98%|Client Satisfaction\n15+|Years Experience\n$200M+|In Sales",
      },
    },
    {
      type: "CallToAction",
      props: {
        id: "CallToAction-home-default",
        heading: "Ready to Get Started?",
        description:
          "Whether you're buying or selling, our team is here to help.",
        buttonText: "Contact Us Today",
        buttonLink: "/contact",
        variant: "primary",
      },
    },
  ],
  root: { props: { title: "Home" } },
};

const LISTINGS_DEFAULT_PUCK_DATA = {
  content: [
    {
      type: "ListingsGrid",
      props: {
        id: "ListingsGrid-listings-default",
        heading: "Property Listings",
        description:
          "Property search powered by IDX / RESO API. Configure your listing provider in Super Admin settings to enable live MLS data.",
        count: 6,
        columns: "3",
      },
    },
  ],
  root: { props: { title: "Listings" } },
};

// Slugs that map to special CMS rows we own — they cannot be renamed,
// deleted, or claimed by user-created pages because something else in the
// app (routing, navigation defaults, …) depends on the slug being stable.
const SYSTEM_PAGE_SLUGS = new Set(["home", "listings"]);

function isSystemSlug(slug: string | null | undefined): boolean {
  return !!slug && SYSTEM_PAGE_SLUGS.has(slug);
}

function sanitiseSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/**
 * Ensure a `slug=home` row exists. Used as a defensive backstop for legacy
 * databases that pre-date the 023_default_home_page seed migration. Returns
 * the row's id either way.
 */
export async function ensureHomePage(): Promise<{ id: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("website_pages")
    .select("id")
    .eq("slug", "home")
    .maybeSingle();

  if (existing?.id) return { id: existing.id };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("website_pages")
    .insert({
      slug: "home",
      title: "Home",
      meta_description:
        "SRP Real Estate - Find your dream home with expert guidance for buyers and sellers.",
      puck_data: HOME_DEFAULT_PUCK_DATA,
      draft_puck_data: HOME_DEFAULT_PUCK_DATA,
      published_puck_data: HOME_DEFAULT_PUCK_DATA,
      status: "published",
      published_at: now,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create Home page" };

  revalidatePath("/portal/website");
  revalidatePath("/");
  return { id: data.id };
}

/**
 * Ensure a `slug=listings` row exists. Counterpart to {@link ensureHomePage}
 * for the (also-special) `/listings` route, which used to be hardcoded JSX
 * and now reads its body from `website_pages`. The seed migration handles
 * this for fresh DBs; this action covers legacy DBs that pre-date the
 * migration. Returns the row's id either way.
 */
export async function ensureListingsPage(): Promise<{ id: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("website_pages")
    .select("id")
    .eq("slug", "listings")
    .maybeSingle();

  if (existing?.id) return { id: existing.id };

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("website_pages")
    .insert({
      slug: "listings",
      title: "Listings",
      meta_description:
        "Browse available properties. Powered by IDX/RESO when configured.",
      puck_data: LISTINGS_DEFAULT_PUCK_DATA,
      draft_puck_data: LISTINGS_DEFAULT_PUCK_DATA,
      published_puck_data: LISTINGS_DEFAULT_PUCK_DATA,
      status: "published",
      published_at: now,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create Listings page" };
  }

  revalidatePath("/portal/website");
  revalidatePath("/listings");
  return { id: data.id };
}

export async function createPage(formData: FormData) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const cleanSlug = sanitiseSlug(formData.get("slug") as string);
  if (isSystemSlug(cleanSlug)) {
    return { error: `The /${cleanSlug} slug is reserved by the system` };
  }

  const { data: page, error } = await supabase
    .from("website_pages")
    .insert({
      title: formData.get("title") as string,
      slug: cleanSlug,
      meta_description: (formData.get("meta_description") as string) || null,
      puck_data: EMPTY_PUCK_DOC,
      draft_puck_data: EMPTY_PUCK_DOC,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  redirect(`/portal/website/pages/${page.id}`);
}

export async function savePageData(
  id: string,
  puckData: Record<string, unknown>
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("website_pages")
    .update({ draft_puck_data: puckData })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  return { ok: true };
}

export async function publishPage(id: string): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from("website_pages")
    .select("draft_puck_data, slug")
    .eq("id", id)
    .single();

  if (readErr || !row) {
    return { error: readErr?.message ?? "Page not found" };
  }

  const { error } = await supabase
    .from("website_pages")
    .update({
      published_puck_data: row.draft_puck_data ?? EMPTY_PUCK_DOC,
      puck_data: row.draft_puck_data ?? EMPTY_PUCK_DOC,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  revalidatePath("/");
  if (row.slug && row.slug !== "home") revalidatePath(`/${row.slug}`);
  return { ok: true };
}

export async function unpublishPage(id: string): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("website_pages")
    .select("slug")
    .eq("id", id)
    .single();

  if (isSystemSlug(row?.slug)) {
    return { error: `Cannot unpublish the /${row?.slug} page` };
  }

  const { error } = await supabase
    .from("website_pages")
    .update({
      status: "draft",
      published_puck_data: null,
      published_at: null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  revalidatePath("/");
  if (row?.slug) revalidatePath(`/${row.slug}`);
  return { ok: true };
}

export async function discardDraft(id: string): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from("website_pages")
    .select("published_puck_data")
    .eq("id", id)
    .single();

  if (readErr || !row) {
    return { error: readErr?.message ?? "Page not found" };
  }

  const { error } = await supabase
    .from("website_pages")
    .update({ draft_puck_data: row.published_puck_data ?? EMPTY_PUCK_DOC })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  return { ok: true };
}

export async function updatePageMeta(
  id: string,
  meta: {
    title: string;
    slug: string;
    meta_description: string | null;
    nav_variant_id?: string | null;
  }
): Promise<{ ok: true } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const trimmedTitle = meta.title.trim();
  if (!trimmedTitle) return { error: "Title is required" };

  const cleanSlug = sanitiseSlug(meta.slug);
  if (!cleanSlug) return { error: "Slug is required" };

  const { data: existing } = await supabase
    .from("website_pages")
    .select("id, slug")
    .eq("id", id)
    .single();

  if (!existing) return { error: "Page not found" };

  // Block renaming any system page; routing + nav defaults assume the slug.
  if (isSystemSlug(existing.slug) && cleanSlug !== existing.slug) {
    return { error: `The /${existing.slug} slug cannot be changed` };
  }

  // Equally, block claiming a system slug from a non-system page.
  if (!isSystemSlug(existing.slug) && isSystemSlug(cleanSlug)) {
    return { error: `The /${cleanSlug} slug is reserved by the system` };
  }

  if (cleanSlug !== existing.slug) {
    const { data: clash } = await supabase
      .from("website_pages")
      .select("id")
      .eq("slug", cleanSlug)
      .neq("id", id)
      .maybeSingle();
    if (clash) return { error: `Another page already uses /${cleanSlug}` };
  }

  // `nav_variant_id` is optional: only patch it when the caller explicitly
  // passes the key (so omitting it leaves the existing value untouched).
  // `null` clears the override; a string must reference an existing variant.
  const updates: Record<string, unknown> = {
    title: trimmedTitle,
    slug: cleanSlug,
    meta_description: meta.meta_description?.trim() || null,
  };

  if ("nav_variant_id" in meta) {
    const navVariantId = meta.nav_variant_id;
    if (navVariantId) {
      const variants = await listNavVariants();
      if (!variants.some((v) => v.id === navVariantId)) {
        return { error: "Selected navigation variant no longer exists" };
      }
      updates.nav_variant_id = navVariantId;
    } else {
      updates.nav_variant_id = null;
    }
  }

  const { error } = await supabase
    .from("website_pages")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/portal/website");
  revalidatePath(`/portal/website/pages/${id}`);
  revalidatePath("/");
  if (existing.slug !== "home") revalidatePath(`/${existing.slug}`);
  if (cleanSlug !== "home") revalidatePath(`/${cleanSlug}`);
  return { ok: true };
}

export async function duplicatePage(id: string): Promise<{ id: string } | { error: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: source, error: readErr } = await supabase
    .from("website_pages")
    .select("title, slug, meta_description, draft_puck_data, published_puck_data")
    .eq("id", id)
    .single();

  if (readErr || !source) {
    return { error: readErr?.message ?? "Page not found" };
  }

  // Pick a non-colliding slug by appending "-copy" (and a numeric suffix when
  // needed).
  const baseSlug = sanitiseSlug(`${source.slug}-copy`);
  let candidate = baseSlug;
  let suffix = 2;
  // Cap to avoid pathological infinite loops if the DB starts returning errors.
  for (let i = 0; i < 50; i++) {
    const { data: clash } = await supabase
      .from("website_pages")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash) break;
    candidate = `${baseSlug}-${suffix++}`;
  }

  const seed = source.draft_puck_data ?? source.published_puck_data ?? EMPTY_PUCK_DOC;

  const { data: created, error } = await supabase
    .from("website_pages")
    .insert({
      title: `${source.title} (Copy)`,
      slug: candidate,
      meta_description: source.meta_description,
      puck_data: seed,
      draft_puck_data: seed,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !created) return { error: error?.message ?? "Failed to duplicate page" };

  revalidatePath("/portal/website");
  return { id: created.id };
}

export async function deletePage(id: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { data: row } = await supabase
    .from("website_pages")
    .select("slug")
    .eq("id", id)
    .single();

  if (isSystemSlug(row?.slug)) {
    return { error: `Cannot delete the /${row?.slug} page` };
  }

  await supabase.from("website_pages").delete().eq("id", id);
  revalidatePath("/portal/website");
  revalidatePath("/");
  if (row?.slug) revalidatePath(`/${row.slug}`);
  redirect("/portal/website");
}
