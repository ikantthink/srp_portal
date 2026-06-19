import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { FormBuilderTabs } from "@/components/portal/forms/form-builder-tabs";
import { ExternalLink } from "lucide-react";
import { isIntegrationEnabled } from "@/lib/integrations/status";

export default async function FormEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const initialTab = typeof sp.tab === "string" ? sp.tab : undefined;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("*")
    .eq("id", id)
    .single();

  if (!form) notFound();

  const { data: version } = form.current_version_id
    ? await supabase
        .from("form_versions")
        .select("*")
        .eq("id", form.current_version_id)
        .single()
    : { data: null };

  const { data: allVersions } = await supabase
    .from("form_versions")
    .select("*")
    .eq("form_id", id)
    .order("version_number", { ascending: false });

  const { data: submissions } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false });

  const aiEnabled = await isIntegrationEnabled("ai");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{form.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>/f/{form.slug}</span>
            {form.status === "published" && (
              <a
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-primary hover:underline"
              >
                View live form
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.status === "published" && form.current_version_id !== form.published_version_id && (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              Unpublished Changes
            </Badge>
          )}
          <Badge variant={form.status === "published" ? "success" : "secondary"}>
            {form.status === "published"
              ? `Published v${(allVersions || []).find((v: any) => v.id === form.published_version_id)?.version_number ?? "?"}`
              : form.status}
          </Badge>
        </div>
      </div>

      <FormBuilderTabs
        formId={form.id}
        formSlug={form.slug}
        formStatus={form.status}
        version={version}
        allVersions={allVersions || []}
        publishedVersionId={form.published_version_id}
        submissions={submissions || []}
        initialTab={initialTab}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}
