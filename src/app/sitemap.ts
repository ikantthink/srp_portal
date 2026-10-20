export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL, slugToPath } from "@/lib/seo/business-profile";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("website_pages")
    .select("slug, updated_at")
    .eq("status", "published");

  return (data ?? []).map((page) => ({
    url: `${SITE_URL}${slugToPath(page.slug)}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : undefined,
  }));
}
