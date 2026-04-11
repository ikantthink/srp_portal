import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { WebsitePageEditor } from "@/components/portal/website/website-page-editor";

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
        initialData={page.puck_data as any}
        status={page.status}
      />
    </div>
  );
}
