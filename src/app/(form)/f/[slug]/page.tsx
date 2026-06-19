export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PublicFormRenderer } from "@/components/portal/forms/public-form-renderer";
import { isIntegrationEnabled } from "@/lib/integrations/status";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: form }, { data: brand }] = await Promise.all([
    supabase
      .from("forms")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single(),
    supabase
      .from("brand_settings")
      .select("primary_color, secondary_color, accent_color, font_heading, font_body")
      .limit(1)
      .single(),
  ]);

  if (!form || !form.published_version_id) notFound();

  const { data: version } = await supabase
    .from("form_versions")
    .select("*")
    .eq("id", form.published_version_id)
    .single();

  if (!version) notFound();

  const isEmbed = embed === "true";
  const listingsEnabled = await isIntegrationEnabled("listings_api");

  const brandStyle: Record<string, string> = {};
  if (brand?.primary_color) brandStyle["--brand-primary"] = brand.primary_color;
  if (brand?.secondary_color) brandStyle["--brand-secondary"] = brand.secondary_color;
  if (brand?.accent_color) brandStyle["--brand-accent"] = brand.accent_color;
  if (brand?.font_heading) brandStyle["--font-heading"] = `"${brand.font_heading}"`;
  if (brand?.font_body) brandStyle["--font-body"] = `"${brand.font_body}"`;

  return (
    <div style={brandStyle as React.CSSProperties}>
      <PublicFormRenderer
        formId={form.id}
        versionId={version.id}
        schema={version.schema}
        pageData={version.page_data}
        successPageData={version.success_page_data}
        settings={version.settings}
        isEmbed={isEmbed}
        listingsEnabled={listingsEnabled}
      />
    </div>
  );
}
