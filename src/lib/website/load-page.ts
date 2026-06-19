import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Data } from "@puckeditor/core";
import type { Role } from "@/types/database";

export interface LoadedWebsitePage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  /** The puck doc to render — `published_puck_data` normally, or
   * `draft_puck_data` when previewing as an admin. */
  data: Data;
  /** True when the resolved doc came from `draft_puck_data` instead of the
   * published column. Consumers can use this to render a "preview" badge. */
  isPreview: boolean;
  status: "draft" | "published";
}

export interface LoadOptions {
  /** When the request came in with `?preview=draft`, set this true; the loader
   * still gates the preview on the viewer being an admin. */
  preview?: boolean;
}

/**
 * Resolve a published website page by slug. When `preview` is set and the
 * caller is authenticated as an admin/super_admin, the draft doc is returned
 * instead — even for unpublished pages.
 *
 * Returns `null` when there is nothing renderable so the caller can decide
 * how to respond (typically `notFound()`).
 */
export async function loadWebsitePage(
  slug: string,
  { preview = false }: LoadOptions = {}
): Promise<LoadedWebsitePage | null> {
  if (preview) {
    const previewPage = await loadAsPreview(slug);
    if (previewPage) return previewPage;
    // Fall through to the published lookup if the viewer isn't allowed to
    // preview or the slug has no draft — published content is still safe.
  }

  const supabase = createAdminClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("id, slug, title, meta_description, published_puck_data, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!page || !page.published_puck_data) return null;

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    meta_description: page.meta_description,
    data: page.published_puck_data as Data,
    isPreview: false,
    status: page.status as "draft" | "published",
  };
}

async function loadAsPreview(slug: string): Promise<LoadedWebsitePage | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (roleRow?.role as Role) || "user";
  if (role !== "admin" && role !== "super_admin") return null;

  const { data: page } = await supabase
    .from("website_pages")
    .select("id, slug, title, meta_description, draft_puck_data, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!page || !page.draft_puck_data) return null;

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    meta_description: page.meta_description,
    data: page.draft_puck_data as Data,
    isPreview: true,
    status: page.status as "draft" | "published",
  };
}
