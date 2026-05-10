export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { LinkCardPreview } from "@/components/portal/link-card/link-card-preview";
import type { Profile } from "@/types/database";

export default async function PublicLinkCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  // Short URL lookup wins. Codes (nanoid 7) are extremely unlikely to collide
  // with link card slugs (kebab-case with hyphens), but if they ever do the
  // short URL takes precedence so the admin can fix it by deleting the code.
  const { data: shortUrl } = await supabase
    .from("short_urls")
    .select("target_url, code")
    .eq("code", slug)
    .single();

  if (shortUrl) {
    supabase
      .rpc("increment_click_count", { short_url_code: shortUrl.code })
      .then(() => {})
      .catch(() => {});
    redirect(shortUrl.target_url);
  }

  const { data: linkCard } = await supabase
    .from("link_cards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!linkCard) notFound();

  const [{ data: profile }, { data: brand }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", linkCard.agent_id).single(),
    supabase.from("brand_settings").select("primary_color, secondary_color, accent_color").limit(1).single(),
  ]);

  if (!profile) notFound();

  const version = linkCard.current_version_id
    ? (
        await supabase
          .from("link_card_versions")
          .select("*")
          .eq("id", linkCard.current_version_id)
          .single()
      ).data
    : null;

  const widgets = version?.widgets || [];
  const layout = version?.layout || {};

  const pageStyle: React.CSSProperties = {};
  if (brand?.primary_color) (pageStyle as Record<string, string>)["--brand-primary"] = brand.primary_color;
  if (brand?.secondary_color) (pageStyle as Record<string, string>)["--brand-secondary"] = brand.secondary_color;
  if (brand?.accent_color) (pageStyle as Record<string, string>)["--brand-accent"] = brand.accent_color;

  const pageBg = (layout as Record<string, unknown>).page_bg_color as string | undefined;
  if (pageBg) pageStyle.backgroundColor = pageBg;

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${!pageBg ? "bg-muted" : ""}`}
      style={pageStyle}
    >
      <LinkCardPreview
        profile={profile as Profile}
        widgets={widgets}
        layout={layout}
      />
    </div>
  );
}
