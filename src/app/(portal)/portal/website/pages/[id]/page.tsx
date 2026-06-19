import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { WebsitePageEditor } from "@/components/portal/website/website-page-editor";
import { isIntegrationEnabled } from "@/lib/integrations/status";
import { listNavVariants } from "@/lib/site-chrome";
import type { Data } from "@puckeditor/core";

const EMPTY_PUCK_DOC: Data = { content: [], root: { props: {} } };

export default async function WebsitePageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (!page) notFound();

  const [aiEnabled, navVariants] = await Promise.all([
    isIntegrationEnabled("ai"),
    listNavVariants(),
  ]);

  // Prefer the new draft column; fall back to legacy puck_data so pages that
  // existed before migration 027 keep working until they are first saved.
  const editingData =
    (page.draft_puck_data as Data | null) ??
    (page.puck_data as Data | null) ??
    EMPTY_PUCK_DOC;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{page.title}</h1>
          <p className="text-sm text-muted-foreground">/{page.slug}</p>
        </div>
      </div>
      <WebsitePageEditor
        pageId={page.id}
        slug={page.slug}
        title={page.title}
        metaDescription={page.meta_description ?? null}
        initialData={editingData}
        status={page.status}
        aiEnabled={aiEnabled}
        navVariants={navVariants.map((v) => ({
          id: v.id,
          name: v.name,
          scrollMode: v.scroll.mode,
        }))}
        initialNavVariantId={(page.nav_variant_id as string | null) ?? null}
      />
    </div>
  );
}
